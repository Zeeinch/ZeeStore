// ============================================
// ZeeStore — Home Page Logic
// ============================================

let allProducts = [];
let currentCategory = null;

// Load all products from Supabase
async function loadProducts(categoryId = null, searchQuery = '') {
  const container = document.getElementById('productGrid');
  showLoading(container);

  let query = _supabase
    .from('products')
    .select('*, categories(name)')
    .order('created_at', { ascending: false });

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`);
  }

  const { data, error } = await query;

  if (error) {
    container.innerHTML = `<div class="col-12"><div class="alert alert-danger">Gagal memuat produk: ${escapeHTML(error.message)}</div></div>`;
    return;
  }

  allProducts = data || [];
  renderProducts(allProducts);
}

// Render product cards
function renderProducts(products) {
  const container = document.getElementById('productGrid');

  if (!products || products.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          <i class="bi bi-box-seam"></i>
          <h5>Belum ada produk</h5>
          <p>Produk yang kamu cari tidak ditemukan.</p>
        </div>
      </div>`;
    return;
  }

  container.innerHTML = products.map((p, i) => {
    const safeImg = sanitizeURL(p.image_url) || 'https://via.placeholder.com/400x400?text=No+Image';
    const safeName = escapeHTML(p.name);
    const safeCity = escapeHTML(p.city || 'Indonesia');
    return `
    <div class="col-6 col-md-4 col-lg-3 col-xl-2 mb-3 fade-in-up delay-${(i % 4) + 1}">
      <div class="product-card" onclick="window.location.href='product.html?id=${p.id}'">
        <div class="card-img-wrapper">
          <img src="${safeImg}" alt="${safeName}" loading="lazy">
        </div>
        <div class="card-body">
          <div class="product-name">${safeName}</div>
          <div class="product-price">${formatRupiah(p.price)}</div>
          <div class="product-meta">
            <span class="rating"><i class="bi bi-star-fill"></i> ${p.rating || '0'}</span>
            <span class="sold">${p.sold || 0} terjual</span>
          </div>
          <div class="product-location">
            <i class="bi bi-geo-alt"></i> ${safeCity}
          </div>
        </div>
      </div>
    </div>
  `}).join('');
}

// Load categories
async function loadCategories() {
  const container = document.getElementById('categoryScroll');
  if (!container) return;

  const { data, error } = await _supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error || !data) return;

  // "Semua" category first
  let html = `
    <div class="category-item active" onclick="filterCategory(null, this)">
      <i class="bi bi-grid-3x3-gap"></i>
      <span>Semua</span>
    </div>`;

  html += data.map(c => `
    <div class="category-item" onclick="filterCategory('${c.id}', this)">
      <i class="bi ${escapeHTML(c.icon)}"></i>
      <span>${escapeHTML(c.name)}</span>
    </div>
  `).join('');

  container.innerHTML = html;
}

// Filter by category
function filterCategory(categoryId, el) {
  currentCategory = categoryId;

  // Update active state
  document.querySelectorAll('.category-item').forEach(item => item.classList.remove('active'));
  if (el) el.classList.add('active');

  loadProducts(categoryId);
}

// Search products
let searchTimeout = null;
function handleSearch(query) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadProducts(currentCategory, query);
  }, 400);
}

// Initialize home page
async function initHome() {
  await initPage();
  await loadCategories();
  await loadProducts();

  // Search handler
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      handleSearch(e.target.value.trim());
    });
  }
}

document.addEventListener('DOMContentLoaded', initHome);
