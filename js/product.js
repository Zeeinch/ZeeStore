// ============================================
// ZeeStore — Product Detail Logic
// ============================================

let currentProduct = null;

// Load product detail
async function loadProductDetail() {
  const productId = getParam('id');
  if (!productId) {
    window.location.href = 'home.html';
    return;
  }

  const container = document.getElementById('productDetailContainer');
  showLoading(container);

  const { data, error } = await _supabase
    .from('products')
    .select('*, categories(name), profiles(full_name)')
    .eq('id', productId)
    .single();

  if (error || !data) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-exclamation-triangle"></i>
        <h5>Produk tidak ditemukan</h5>
        <p>Produk yang kamu cari mungkin sudah dihapus.</p>
        <a href="home.html" class="btn btn-zee">Kembali ke Beranda</a>
      </div>`;
    return;
  }

  currentProduct = data;
  renderProductDetail(data);
  loadRelatedProducts(data.category_id, data.id);
}

// Render product detail
function renderProductDetail(p) {
  const container = document.getElementById('productDetailContainer');
  const sellerName = escapeHTML(p.profiles?.full_name || 'ZeeStore Official');
  const safeImg = sanitizeURL(p.image_url) || 'https://via.placeholder.com/600x600?text=No+Image';
  const safeName = escapeHTML(p.name);
  const safeDesc = escapeHTML(p.description || 'Tidak ada deskripsi.');
  const safeCat = escapeHTML(p.categories?.name || 'Umum');
  const safeCity = escapeHTML(p.city || 'Indonesia');

  container.innerHTML = `
    <div class="row g-4 fade-in-up">
      <!-- Product Image -->
      <div class="col-md-5">
        <div class="product-detail-img">
          <img src="${safeImg}" 
               alt="${safeName}" class="img-fluid">
        </div>
      </div>

      <!-- Product Info -->
      <div class="col-md-7">
        <div class="product-detail-info">
          <span class="badge-zee mb-2 d-inline-block">${safeCat}</span>
          <h1 class="title mb-2">${safeName}</h1>
          
          <div class="meta-row mb-3">
            <span><i class="bi bi-star-fill"></i> ${p.rating || 0}</span>
            <span><i class="bi bi-bag-check"></i> ${p.sold || 0} terjual</span>
            <span><i class="bi bi-box-seam"></i> Stok: ${p.stock}</span>
          </div>

          <div class="price mb-3">${formatRupiah(p.price)}</div>

          <hr>

          <div class="mb-3">
            <h6 class="fw-bold mb-2">Deskripsi Produk</h6>
            <p class="text-secondary" style="line-height:1.8;">${safeDesc}</p>
          </div>

          <div class="mb-3">
            <div class="seller-badge">
              <i class="bi bi-shop"></i>
              <span>${sellerName}</span>
              <span class="text-muted">• <i class="bi bi-geo-alt"></i> ${safeCity}</span>
            </div>
          </div>

          <hr>

          <!-- Quantity & Actions -->
          <div class="d-flex align-items-center gap-3 mb-3">
            <label class="fw-semibold">Jumlah:</label>
            <div class="cart-item">
              <div class="quantity-control">
                <button onclick="changeQty(-1)">−</button>
                <span id="qty">1</span>
                <button onclick="changeQty(1)">+</button>
              </div>
            </div>
          </div>

          <div class="d-flex gap-2 flex-wrap">
            <button class="btn btn-zee flex-fill" onclick="addToCart()" id="btnAddCart">
              <i class="bi bi-cart-plus me-1"></i> Tambah ke Keranjang
            </button>
            <button class="btn btn-zee-outline flex-fill" onclick="buyNow()">
              <i class="bi bi-bag-check me-1"></i> Beli Langsung
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

// Change quantity
function changeQty(delta) {
  const qtyEl = document.getElementById('qty');
  let qty = parseInt(qtyEl.textContent) + delta;
  if (qty < 1) qty = 1;
  if (currentProduct && qty > currentProduct.stock) qty = currentProduct.stock;
  qtyEl.textContent = qty;
}

// Add to cart
async function addToCart() {
  const session = await getSession();
  if (!session) {
    showToast('Silakan login terlebih dahulu.', 'warning');
    setTimeout(() => window.location.href = 'index.html', 1500);
    return;
  }

  const qty = parseInt(document.getElementById('qty').textContent);
  const btn = document.getElementById('btnAddCart');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menambahkan...';

  try {
    // Check if already in cart
    const { data: existing } = await _supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('product_id', currentProduct.id)
      .single();

    if (existing) {
      // Update quantity
      await _supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + qty })
        .eq('id', existing.id);
    } else {
      // Insert new
      await _supabase
        .from('cart_items')
        .insert({
          user_id: session.user.id,
          product_id: currentProduct.id,
          quantity: qty
        });
    }

    showToast('Produk berhasil ditambahkan ke keranjang!', 'success');
    await updateCartBadge();
  } catch (err) {
    showToast('Gagal menambahkan ke keranjang: ' + escapeHTML(err.message), 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-cart-plus me-1"></i> Tambah ke Keranjang';
  }
}

// Buy now
async function buyNow() {
  await addToCart();
  window.location.href = 'cart.html';
}

// Load related products
async function loadRelatedProducts(categoryId, excludeId) {
  const container = document.getElementById('relatedProducts');
  if (!container) return;

  const { data } = await _supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .neq('id', excludeId)
    .limit(6);

  if (!data || data.length === 0) {
    container.parentElement.style.display = 'none';
    return;
  }

  container.innerHTML = data.map(p => {
    const safeImg = sanitizeURL(p.image_url) || 'https://via.placeholder.com/400x400?text=No+Image';
    const safeName = escapeHTML(p.name);
    return `
    <div class="col-6 col-md-4 col-lg-2 mb-3">
      <div class="product-card" onclick="window.location.href='product.html?id=${p.id}'">
        <div class="card-img-wrapper">
          <img src="${safeImg}" alt="${safeName}" loading="lazy">
        </div>
        <div class="card-body">
          <div class="product-name">${safeName}</div>
          <div class="product-price">${formatRupiah(p.price)}</div>
          <div class="product-meta">
            <span class="rating"><i class="bi bi-star-fill"></i> ${p.rating || 0}</span>
          </div>
        </div>
      </div>
    </div>
  `}).join('');
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
  await initPage();
  await loadProductDetail();
});
