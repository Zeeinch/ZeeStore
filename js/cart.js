// ============================================
// ZeeStore — Cart Logic
// ============================================

let cartItems = [];

// Load cart items
async function loadCart() {
  const session = await requireAuth();
  if (!session) return;

  const container = document.getElementById('cartItemsList');
  showLoading(container);

  const { data, error } = await _supabase
    .from('cart_items')
    .select('*, products(*)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    container.innerHTML = `<div class="alert alert-danger">Gagal memuat keranjang: ${escapeHTML(error.message)}</div>`;
    return;
  }

  cartItems = data || [];
  renderCart();
}

// Render cart items
function renderCart() {
  const container = document.getElementById('cartItemsList');
  const summaryContainer = document.getElementById('cartSummary');
  const emptyState = document.getElementById('cartEmpty');
  const cartContent = document.getElementById('cartContent');

  if (!cartItems || cartItems.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    if (cartContent) cartContent.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (cartContent) cartContent.style.display = 'block';

  // Render items
  container.innerHTML = cartItems.map(item => {
    const p = item.products;
    if (!p) return '';
    const safeImg = sanitizeURL(p.image_url) || 'https://via.placeholder.com/100x100?text=No+Image';
    const safeName = escapeHTML(p.name);
    const safeCity = escapeHTML(p.city || 'Indonesia');

    return `
      <div class="cart-item fade-in-up" id="cart-item-${item.id}">
        <div class="d-flex gap-3">
          <img src="${safeImg}" 
               alt="${safeName}" onclick="window.location.href='product.html?id=${p.id}'" style="cursor:pointer;">
          <div class="flex-fill">
            <h6 class="fw-semibold mb-1" style="font-size:0.95rem;">
              <a href="product.html?id=${p.id}" class="text-decoration-none text-dark">${safeName}</a>
            </h6>
            <div class="text-muted mb-2" style="font-size:0.8rem;">
              <i class="bi bi-geo-alt"></i> ${safeCity}
            </div>
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div class="fw-bold" style="color:var(--primary);font-size:1.05rem;">${formatRupiah(p.price)}</div>
              <div class="d-flex align-items-center gap-2">
                <div class="quantity-control">
                  <button onclick="updateQuantity('${item.id}', ${item.quantity - 1})">−</button>
                  <span>${item.quantity}</span>
                  <button onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="removeItem('${item.id}')" title="Hapus">
                  <i class="bi bi-trash3"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  // Update summary
  updateSummary();
}

// Update quantity
async function updateQuantity(itemId, newQty) {
  if (newQty < 1) {
    removeItem(itemId);
    return;
  }

  // Find item and check stock
  const item = cartItems.find(i => i.id === itemId);
  if (item && item.products && newQty > item.products.stock) {
    showToast(`Stok tersedia hanya ${item.products.stock}`, 'warning');
    return;
  }

  const { error } = await _supabase
    .from('cart_items')
    .update({ quantity: newQty })
    .eq('id', itemId);

  if (error) {
    showToast('Gagal mengubah jumlah.', 'error');
    return;
  }

  // Update local data
  const idx = cartItems.findIndex(i => i.id === itemId);
  if (idx >= 0) {
    cartItems[idx].quantity = newQty;
    renderCart();
    updateCartBadge();
  }
}

// Remove item
async function removeItem(itemId) {
  const el = document.getElementById(`cart-item-${itemId}`);
  if (el) {
    el.style.opacity = '0.5';
    el.style.pointerEvents = 'none';
  }

  const { error } = await _supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    showToast('Gagal menghapus item.', 'error');
    if (el) {
      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
    }
    return;
  }

  cartItems = cartItems.filter(i => i.id !== itemId);
  renderCart();
  updateCartBadge();
  showToast('Item dihapus dari keranjang.', 'success');
}

// Update summary
function updateSummary() {
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (item.products?.price || 0) * item.quantity;
  }, 0);

  const shippingCost = cartItems.length > 0 ? 15000 : 0;
  const total = subtotal + shippingCost;

  document.getElementById('summarySubtotal').textContent = formatRupiah(subtotal);
  document.getElementById('summaryShipping').textContent = formatRupiah(shippingCost);
  document.getElementById('summaryTotal').textContent = formatRupiah(total);
  document.getElementById('summaryItemCount').textContent = `${cartItems.length} produk`;
}

// Proceed to checkout
function proceedToCheckout() {
  if (cartItems.length === 0) {
    showToast('Keranjang masih kosong.', 'warning');
    return;
  }
  window.location.href = 'checkout.html';
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
  await initPage();
  await loadCart();
});
