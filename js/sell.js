// ============================================
// ZeeStore — Sell Product Logic
// ============================================

// Load categories for dropdown
async function loadCategoriesForSell() {
  const select = document.getElementById('productCategory');
  if (!select) return;

  const { data, error } = await _supabase
    .from('categories')
    .select('*')
    .order('name');

  if (data) {
    data.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = c.name;
      select.appendChild(option);
    });
  }
}

// Preview image from URL
function previewImage() {
  const url = document.getElementById('productImage').value.trim();
  const preview = document.getElementById('imagePreview');

  if (url) {
    const safeUrl = sanitizeURL(url);
    if (safeUrl) {
      preview.innerHTML = `<img src="${safeUrl}" alt="Preview" onerror="this.parentElement.innerHTML='<i class=\\'bi bi-exclamation-triangle fs-1\\'></i><p>Gambar tidak dapat dimuat</p>'">`;
    } else {
      preview.innerHTML = `<div class="alert alert-danger mb-0">URL gambar tidak valid.</div>`;
    }
  } else {
    preview.innerHTML = `
      <i class="bi bi-image fs-1"></i>
      <p>Masukkan URL gambar untuk preview</p>`;
  }
}

// Submit product
async function submitProduct(e) {
  e.preventDefault();

  const session = await requireAuth();
  if (!session) return;

  const btn = document.getElementById('btnSubmit');
  const spinner = document.getElementById('submitSpinner');
  const errorEl = document.getElementById('sellError');
  const successEl = document.getElementById('sellSuccess');

  errorEl.classList.add('d-none');
  successEl.classList.add('d-none');

  // Gather form data
  const name = document.getElementById('productName').value.trim();
  const category = document.getElementById('productCategory').value;
  const description = document.getElementById('productDescription').value.trim();
  const price = parseInt(document.getElementById('productPrice').value);
  const stock = parseInt(document.getElementById('productStock').value);
  const imageUrl = document.getElementById('productImage').value.trim();
  const city = document.getElementById('productCity').value.trim() || 'Jakarta';

  // Validation
  if (!name || !category || !price || !stock) {
    errorEl.textContent = 'Mohon lengkapi semua field yang wajib.';
    errorEl.classList.remove('d-none');
    return;
  }

  if (price < 100) {
    errorEl.textContent = 'Harga minimal Rp 100.';
    errorEl.classList.remove('d-none');
    return;
  }

  spinner.classList.remove('d-none');
  btn.disabled = true;

  try {
    const { data, error } = await _supabase
      .from('products')
      .insert({
        seller_id: session.user.id,
        category_id: category,
        name,
        description,
        price,
        stock,
        image_url: imageUrl || null,
        city,
        rating: (Math.random() * 2 + 3).toFixed(1), // Random 3.0-5.0
        sold: 0
      })
      .select()
      .single();

    if (error) throw error;

    successEl.innerHTML = `
      Produk berhasil dipublish! 
      <a href="product.html?id=${data.id}" class="alert-link">Lihat produk →</a>`;
    successEl.classList.remove('d-none');

    // Reset form
    document.getElementById('sellForm').reset();
    document.getElementById('imagePreview').innerHTML = `
      <i class="bi bi-image fs-1"></i>
      <p>Masukkan URL gambar untuk preview</p>`;
    document.getElementById('pricePreview').textContent = 'Rp 0';

    showToast('Produk berhasil dipublish!', 'success');
  } catch (err) {
    errorEl.textContent = 'Gagal mempublish produk: ' + err.message;
    errorEl.classList.remove('d-none');
  } finally {
    spinner.classList.add('d-none');
    btn.disabled = false;
  }
}

// Update price preview
function updatePricePreview() {
  const price = document.getElementById('productPrice').value;
  const preview = document.getElementById('pricePreview');
  if (preview) {
    preview.textContent = price ? formatRupiah(parseInt(price)) : 'Rp 0';
  }
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
  await requireAuth();
  await initPage();
  await loadCategoriesForSell();

  document.getElementById('sellForm').addEventListener('submit', submitProduct);
});
