// ============================================
// ZeeStore — Supabase Configuration
// ============================================
// PENTING: Ganti values di bawah dengan credentials dari
// Supabase Dashboard > Settings > API
// ============================================

const SUPABASE_URL = 'https://lcfogykaazmqtnyiumvp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjZm9neWthYXptcXRueWl1bXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTI5OTksImV4cCI6MjA5NjY2ODk5OX0.lLlm_t7Gv-9HtCqK9DpKHxv_ZvbWlbSB1IyJH7DipNQ';

// Initialize Supabase client
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper: Format Rupiah
function formatRupiah(num) {
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

// Helper: Get URL params
function getParam(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

// Helper: Show toast notification
function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) return;

  const id = 'toast-' + Date.now();
  const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-warning';
  const icon = type === 'success' ? 'bi-check-circle' : type === 'error' ? 'bi-x-circle' : 'bi-exclamation-circle';

  const toastHTML = `
    <div id="${id}" class="toast align-items-center text-white ${bgClass} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi ${icon} me-2"></i>${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>`;

  toastContainer.insertAdjacentHTML('beforeend', toastHTML);
  const toastEl = document.getElementById(id);
  const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
  toast.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

// Helper: Loading spinner
function showLoading(container) {
  container.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 text-muted">Memuat data...</p>
    </div>`;
}

// Helper: Truncate text
function truncate(str, maxLen = 50) {
  if (!str) return '';
  return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
}
