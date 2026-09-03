async function getCurrentUser() {
  const sb = requireSupabase();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

async function logout() {
  const sb = requireSupabase();
  await sb.auth.signOut();
  window.location.href = 'index.html';
}

function showMessage(id, text, error=false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = `message ${error ? 'error' : 'success'}`;
}
