// ============================================
// ZeeStore — Profile & Order History Logic
// ============================================

let currentUserId = null;

// Load Profile Settings
async function loadProfile() {
  const session = await requireAuth();
  if (!session) return;
  
  currentUserId = session.user.id;
  const profile = await getUserProfile();
  
  if (profile) {
    document.getElementById('profileName').value = profile.full_name || '';
    document.getElementById('profilePhone').value = profile.phone || '';
    document.getElementById('profileAddress').value = profile.address || '';
    document.getElementById('profileCity').value = profile.city || '';
  }
}

// Save Profile changes
const profileForm = document.getElementById('profileForm');
if (profileForm) {
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('btnSaveProfile');
    const spinner = document.getElementById('profileSpinner');
    
    btn.disabled = true;
    spinner.classList.remove('d-none');
    
    try {
      const { error } = await _supabase
        .from('profiles')
        .update({
          full_name: document.getElementById('profileName').value.trim(),
          phone: document.getElementById('profilePhone').value.trim(),
          address: document.getElementById('profileAddress').value.trim(),
          city: document.getElementById('profileCity').value.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUserId);
        
      if (error) throw error;
      
      showToast('Profil berhasil diperbarui!', 'success');
      
      // Update navbar with new name
      await updateNavbarUser();
      
    } catch (err) {
      showToast('Gagal menyimpan profil: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      spinner.classList.add('d-none');
    }
  });
}

// Load Order History
async function loadHistory() {
  if (!currentUserId) return;
  
  const container = document.getElementById('historyList');
  
  const { data, error } = await _supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', currentUserId)
    .order('created_at', { ascending: false });
    
  if (error) {
    container.innerHTML = `<div class="alert alert-danger">Gagal memuat riwayat belanja: ${escapeHTML(error.message)}</div>`;
    return;
  }
  
  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="empty-state fade-in-up">
        <i class="bi bi-clock-history"></i>
        <h5>Belum ada riwayat belanja</h5>
        <p>Ayo mulai belanja dan temukan produk menarik!</p>
        <a href="home.html" class="btn btn-zee mt-2">Mulai Belanja</a>
      </div>
    `;
    return;
  }
  
  container.innerHTML = data.map((order, i) => {
    const date = new Date(order.created_at).toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    const statusText = order.status === 'paid' ? 'Pesanan Diproses / Selesai' : order.status;
    const badgeColor = order.status === 'paid' ? 'bg-success' : 'bg-warning';
    
    const itemsHtml = order.order_items.map(item => `
      <div class="d-flex align-items-center gap-3 mt-3 pt-3 border-top" style="border-color: var(--border-color) !important;">
        <img src="${sanitizeURL(item.product_image) || 'https://via.placeholder.com/60'}" alt="${escapeHTML(item.product_name)}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">
        <div class="flex-fill">
          <div class="fw-bold" style="font-size:0.9rem;">${escapeHTML(item.product_name)}</div>
          <div class="text-muted" style="font-size:0.85rem;">${item.quantity} barang x ${formatRupiah(item.price)}</div>
        </div>
        <div class="fw-bold text-primary">
          ${formatRupiah(item.quantity * item.price)}
        </div>
      </div>
    `).join('');
    
    return `
      <div class="card p-4 border-0 shadow-sm mb-4 fade-in-up delay-${(i % 4) + 1}" style="border-radius: var(--border-radius-lg);">
        <div class="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom" style="border-color: var(--border-color) !important;">
          <div>
            <div class="mb-1">
              <i class="bi bi-bag-check-fill text-success me-1"></i> 
              <span class="fw-bold">Belanja</span> &bull; <span class="text-muted small">${date}</span>
            </div>
            <span class="badge ${badgeColor}">${statusText}</span>
            <span class="text-muted small ms-2">ID: ${order.id.split('-')[0].toUpperCase()}</span>
          </div>
        </div>
        
        <div class="order-items-wrapper">
          ${itemsHtml}
        </div>
        
        <div class="mt-4 pt-3 border-top d-flex justify-content-between align-items-center" style="border-color: var(--border-color) !important;">
          <span class="text-muted small">Metode: <strong class="text-dark">${escapeHTML(order.payment_method || '-').toUpperCase()}</strong></span>
          <div class="text-end">
            <div class="text-muted small">Total Belanja</div>
            <div class="fw-bold text-primary" style="font-size:1.1rem;">${formatRupiah(order.total)}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
  await initPage();
  await loadProfile();
  await loadHistory();
});
