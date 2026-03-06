
async function getMeSafe() {
  try { return await api('/me'); } catch { return null; }
}
async function requireAuth() {
  const data = await getMeSafe();
  if (!data?.user) {
    window.location.href = 'login.html';
    return null;
  }
  return data.user;
}
async function logoutUser() {
  try { await api('/logout', { method: 'POST' }); } catch {}
  localStorage.removeItem('eb_chat_history');
  window.location.href = 'login.html';
}
window.EBAuth = { getMeSafe, requireAuth, logoutUser };
