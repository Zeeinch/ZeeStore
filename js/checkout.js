// ============================================
// ZeeStore — Checkout Logic
// ============================================

let checkoutItems = [];
let currentStep = 1;

// Load checkout data
async function loadCheckout() {
  const session = await requireAuth();
  if (!session) return;

  // Load cart items
  const { data, error } = await _supabase
    .from('cart_items')
    .select('*, products(*)')
    .eq('user_id', session.user.id);

  if (error || !data || data.length === 0) {
    showToast('Keranjang kosong. Silakan tambahkan produk terlebih dahulu.', 'warning');
    setTimeout(() => window.location.href = 'home.html', 2000);
    return;
  }

  checkoutItems = data;

  // Load user profile for pre-fill
  const profile = await getUserProfile();
  if (profile) {
    if (profile.full_name) document.getElementById('shippingName').value = profile.full_name;
    if (profile.phone) document.getElementById('shippingPhone').value = profile.phone;
    if (profile.address) document.getElementById('shippingAddress').value = profile.address;
    if (profile.city) document.getElementById('shippingCity').value = profile.city;
  }

  renderOrderSummary();
}

// Render order summary sidebar
function renderOrderSummary() {
  const container = document.getElementById('orderItems');
  if (!container) return;

  container.innerHTML = checkoutItems.map(item => {
    const p = item.products;
    if (!p) return '';
    return `
      <div class="d-flex gap-2 mb-2 pb-2 border-bottom">
        <img src="${p.image_url || 'https://via.placeholder.com/60x60?text=No'}" 
             alt="${p.name}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;">
        <div class="flex-fill">
          <div style="font-size:0.8rem;font-weight:500;line-height:1.3;">${truncate(p.name, 40)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">${item.quantity}x ${formatRupiah(p.price)}</div>
        </div>
        <div style="font-size:0.85rem;font-weight:600;white-space:nowrap;">${formatRupiah(p.price * item.quantity)}</div>
      </div>`;
  }).join('');

  updateCheckoutSummary();
}

// Update checkout summary totals
function updateCheckoutSummary() {
  const subtotal = checkoutItems.reduce((sum, item) => {
    return sum + (item.products?.price || 0) * item.quantity;
  }, 0);

  const shipping = 15000;
  const total = subtotal + shipping;

  document.getElementById('checkoutSubtotal').textContent = formatRupiah(subtotal);
  document.getElementById('checkoutShipping').textContent = formatRupiah(shipping);
  document.getElementById('checkoutTotal').textContent = formatRupiah(total);
}

// Navigate checkout steps
function goToStep(step) {
  // Validate current step before moving forward
  if (step > currentStep) {
    if (currentStep === 1 && !validateShipping()) return;
    if (currentStep === 2 && !validatePayment()) return;
  }

  currentStep = step;

  // Update step indicators
  document.querySelectorAll('.checkout-step').forEach((el, i) => {
    el.classList.remove('active', 'completed');
    if (i + 1 < step) el.classList.add('completed');
    if (i + 1 === step) el.classList.add('active');
  });

  document.querySelectorAll('.step-connector').forEach((el, i) => {
    el.classList.toggle('completed', i + 1 < step);
  });

  // Show/hide step panels
  document.querySelectorAll('.step-panel').forEach(el => {
    el.style.display = 'none';
  });
  const panel = document.getElementById(`step${step}`);
  if (panel) {
    panel.style.display = 'block';
    panel.classList.add('fade-in-up');
  }

  // Update confirmation summary if on step 3
  if (step === 3) renderConfirmation();
}

// Validate shipping form
function validateShipping() {
  const name = document.getElementById('shippingName').value.trim();
  const phone = document.getElementById('shippingPhone').value.trim();
  const address = document.getElementById('shippingAddress').value.trim();
  const city = document.getElementById('shippingCity').value.trim();

  if (!name || !phone || !address || !city) {
    showToast('Mohon lengkapi semua data pengiriman.', 'warning');
    return false;
  }
  return true;
}

// Validate payment method
function validatePayment() {
  const selected = document.querySelector('input[name="paymentMethod"]:checked');
  if (!selected) {
    showToast('Pilih metode pembayaran.', 'warning');
    return false;
  }
  return true;
}

// Render confirmation
function renderConfirmation() {
  const shippingName = document.getElementById('shippingName').value;
  const shippingPhone = document.getElementById('shippingPhone').value;
  const shippingAddress = document.getElementById('shippingAddress').value;
  const shippingCity = document.getElementById('shippingCity').value;
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || '-';

  const paymentLabels = {
    'bca': 'Transfer Bank BCA',
    'mandiri': 'Transfer Bank Mandiri',
    'gopay': 'GoPay',
    'ovo': 'OVO',
    'dana': 'DANA',
    'cod': 'Bayar di Tempat (COD)'
  };

  document.getElementById('confirmShipping').innerHTML = `
    <p class="mb-1"><strong>${shippingName}</strong></p>
    <p class="mb-1 text-muted">${shippingPhone}</p>
    <p class="mb-0 text-muted">${shippingAddress}, ${shippingCity}</p>`;

  document.getElementById('confirmPayment').innerHTML = `
    <p class="mb-0"><strong>${paymentLabels[paymentMethod] || paymentMethod}</strong></p>`;
}

// Process order
async function processOrder() {
  const session = await requireAuth();
  if (!session) return;

  const btn = document.getElementById('btnPay');
  const spinner = document.getElementById('paySpinner');

  btn.disabled = true;
  spinner.classList.remove('d-none');

  try {
    const subtotal = checkoutItems.reduce((sum, item) => {
      return sum + (item.products?.price || 0) * item.quantity;
    }, 0);

    const shippingCost = 15000;
    const total = subtotal + shippingCost;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'unknown';

    // Create order
    const { data: order, error: orderError } = await _supabase
      .from('orders')
      .insert({
        user_id: session.user.id,
        status: 'paid',
        payment_method: paymentMethod,
        shipping_name: document.getElementById('shippingName').value,
        shipping_address: document.getElementById('shippingAddress').value,
        shipping_city: document.getElementById('shippingCity').value,
        shipping_phone: document.getElementById('shippingPhone').value,
        subtotal,
        shipping_cost: shippingCost,
        total
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = checkoutItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.products?.name || 'Unknown',
      product_image: item.products?.image_url || null,
      quantity: item.quantity,
      price: item.products?.price || 0
    }));

    const { error: itemsError } = await _supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Clear cart
    await _supabase
      .from('cart_items')
      .delete()
      .eq('user_id', session.user.id);

    // Show success
    goToStep(4);
    renderSuccess(order);
    updateCartBadge();

  } catch (err) {
    showToast('Gagal memproses pesanan: ' + err.message, 'error');
    btn.disabled = false;
    spinner.classList.add('d-none');
  }
}

// Render success page
function renderSuccess(order) {
  const panel = document.getElementById('step4');
  panel.style.display = 'block';

  document.getElementById('orderId').textContent = order.id.substring(0, 8).toUpperCase();
  document.getElementById('orderTotal').textContent = formatRupiah(order.total);
  document.getElementById('orderDate').textContent = new Date(order.created_at).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Hide summary sidebar on success
  document.getElementById('orderSummarySidebar').style.display = 'none';

  // Update steps to all completed
  document.querySelectorAll('.checkout-step').forEach(el => {
    el.classList.remove('active');
    el.classList.add('completed');
  });
  document.querySelectorAll('.step-connector').forEach(el => {
    el.classList.add('completed');
  });
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
  await initPage();
  await loadCheckout();

  // Payment method selection
  document.querySelectorAll('.payment-method').forEach(el => {
    el.addEventListener('click', function() {
      document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
      this.classList.add('selected');
      this.querySelector('input[type="radio"]').checked = true;
    });
  });
});
