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

// ── Login log (once per user per day) ───────────────────────
async function logLogin(userId) {
  const todayStr = new Date().toISOString().slice(0, 10); // e.g. "2026-03-15"

  // Check if already logged today
  const { data: existing } = await _supabase
    .from('login_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('login_date', todayStr)
    .limit(1);

  if (!existing || existing.length === 0) {
    await _supabase.from('login_logs').insert({
      user_id: userId,
      login_date: todayStr
    });
  }

  await _supabase.from('profiles')
    .update({ last_login: new Date().toISOString() })
    .eq('id', userId);
}

// ── Download log ────────────────────────────────────────────
async function logDownload(documentId, userId) {
  await _supabase.from('download_logs').insert({
    document_id: documentId,
    user_id: userId
  });
}

// ── Get signed URL for a document ───────────────────────────
async function getDocumentURL(filePath) {
  const { data, error } = await _supabase.storage
    .from('cics-documents')
    .createSignedUrl(filePath, 60);
  if (error) throw error;
  return data.signedUrl;
}

// ── Auto logout after 5 minutes of inactivity ───────────────
function startIdleTimer() {
  const IDLE_LIMIT = 5 * 60 * 1000;
  let timer = null;

  function resetTimer() {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const session = await getSession();
      if (session) {
        await signOut();
        alert('You have been logged out due to 5 minutes of inactivity.');
        window.location.href = window.location.pathname.includes('/pages/')
          ? '../index.html'
          : 'index.html';
      }
    }, IDLE_LIMIT);
  }

  ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'].forEach(event => {
    document.addEventListener(event, resetTimer, true);
  });

  resetTimer();
}

// Only start idle timer on authenticated pages
(async () => {
  const session = await getSession();
  if (session) startIdleTimer();
})();
