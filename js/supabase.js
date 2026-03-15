// ============================================================
// js/supabase.js  –  Supabase client + shared helpers
// ============================================================

const SUPABASE_URL  = 'https://nvzwwgfnumcjnqxixdso.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52end3Z2ZudW1jam5xeGl4ZHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0ODA5NDksImV4cCI6MjA4OTA1Njk0OX0.L_46KyZO6V_msGvwf_uoSy_lV7_VHYS0g4o24qbOGyI';
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// ── Auth helpers ────────────────────────────────────────────
async function signInWithGoogle() {
  const origin = window.location.href
    .replace(/\/pages\/.*$/, '')
    .replace(/\/index\.html$/, '');
  const redirectTo = origin + '/pages/auth-callback.html';
  console.log('Redirecting to:', redirectTo);

  return _supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  });
}

async function signOut() {
  return _supabase.auth.signOut();
}

async function getSession() {
  const { data } = await _supabase.auth.getSession();
  return data.session;
}

async function getProfile(userId) {
  const { data, error } = await _supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// ── Auth guard ───────────────────────────────────────────────
function rootPath() {
  const p = window.location.pathname;
  if (p.includes('/pages/')) return p.replace(/\/pages\/.*$/, '');
  return p.replace(/\/index\.html$/, '') || '';
}

async function requireAuth(adminOnly = false) {
  const session = await getSession();
  if (!session) {
    window.location.href = rootPath() + '/index.html';
    return null;
  }

  let profile;
  try { profile = await getProfile(session.user.id); }
  catch {
    await _supabase.from('profiles').upsert({
      id: session.user.id,
      email: session.user.email,
      full_name: session.user.user_metadata?.full_name || session.user.email,
      role: 'student'
    });
    profile = await getProfile(session.user.id);
  }

  if (profile.is_blocked) {
    alert('Your account has been blocked. Please contact the administrator.');
    await signOut();
    window.location.href = rootPath() + '/index.html';
    return null;
  }

  if (adminOnly && profile.role !== 'admin') {
    window.location.href = rootPath() + '/pages/student-dashboard.html';
    return null;
  }

  if (!adminOnly && profile.role === 'admin') {
    window.location.href = rootPath() + '/pages/admin-dashboard.html';
    return null;
  }

  return { session, profile };
}

// ── Login log ───────────────────────────────────────────────
async function logLogin(userId) {
  // Only log once per user per day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: existing } = await _supabase
    .from('login_logs')
    .select('id')
    .eq('user_id', userId)
    .gte('logged_in_at', today.toISOString())
    .lt('logged_in_at', tomorrow.toISOString())
    .limit(1);

  if (!existing || existing.length === 0) {
    await _supabase.from('login_logs').insert({ user_id: userId });
  }

  await _supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', userId);
}

// ── Download log ────────────────────────────────────────────
async function logDownload(documentId, userId) {
  await _supabase.from('download_logs').insert({ document_id: documentId, user_id: userId });
}

// ── Get signed URL for a document ───────────────────────────
async function getDocumentURL(filePath) {
  const { data, error } = await _supabase.storage
    .from('cics-documents')
    .createSignedUrl(filePath, 60);
  if (error) throw error;
  return data.signedUrl;
}
