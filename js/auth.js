// ============================================
// ZeeStore — Authentication Module
// ============================================

// Check if user is logged in, redirect if not
async function requireAuth() {
  const { data: { session } } = await _supabase.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }
  return session;
}

// Get current session (no redirect)
async function getSession() {
  const { data: { session } } = await _supabase.auth.getSession();
  return session;
}

// Get current user profile
async function getUserProfile() {
  const session = await getSession();
  if (!session) return null;

  const { data, error } = await _supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return data;
}

// Sign up with email and password
async function signUp(email, password, fullName) {
  const { data, error } = await _supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  });

  if (error) throw error;
  return data;
}

// Sign in with email and password
async function signIn(email, password) {
  const { data, error } = await _supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

// Sign out
async function signOut() {
  try {
    await _supabase.auth.signOut();
  } catch (e) {
    console.warn('Sign out warning:', e);
  }
  // Clear all local storage to ensure the expired token is removed
  localStorage.clear();
  window.location.href = 'index.html';
}

// Update navbar user info
async function updateNavbarUser() {
  const session = await getSession();
  const userNameEl = document.getElementById('navUserName');
  const userMenuAuth = document.getElementById('userMenuAuth');
  const userMenuGuest = document.getElementById('userMenuGuest');

  if (session) {
    const profile = await getUserProfile();
    const name = profile?.full_name || session.user.email.split('@')[0];

    if (userNameEl) userNameEl.textContent = name;
    if (userMenuAuth) userMenuAuth.style.display = 'block';
    if (userMenuGuest) userMenuGuest.style.display = 'none';
  } else {
    if (userNameEl) userNameEl.textContent = 'Guest';
    if (userMenuAuth) userMenuAuth.style.display = 'none';
    if (userMenuGuest) userMenuGuest.style.display = 'block';
  }
}

// Update cart badge count
async function updateCartBadge() {
  const session = await getSession();
  const badge = document.getElementById('cartBadge');
  if (!badge) return;

  if (!session) {
    badge.style.display = 'none';
    return;
  }

  const { data, error } = await _supabase
    .from('cart_items')
    .select('quantity')
    .eq('user_id', session.user.id);

  if (data && data.length > 0) {
    const total = data.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = total;
    badge.style.display = total > 0 ? 'inline' : 'none';
  } else {
    badge.style.display = 'none';
  }
}

// Initialize common page elements
async function initPage() {
  await updateNavbarUser();
  await updateCartBadge();
}

// Listen for auth state changes
_supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    window.location.href = 'index.html';
  }
});
