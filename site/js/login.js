import "dotenv/config";

(function(){
  const form = document.getElementById('login-form');
  const error = document.getElementById('login-error');
  const demoBtn = document.getElementById('demo-login');
  if (new URLSearchParams(location.search).get('demo') === '1') {
    document.getElementById('email').value = 'demo@energiebuddy.app';
    document.getElementById('password').value = 'Demo123!';
  }
  function showError(msg){ error.textContent = msg; error.classList.add('show'); }
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.classList.remove('show');
    try {
      await api('/login', { method:'POST', body: JSON.stringify({ email: email.value, password: password.value }) });
      window.location.href = 'index.html';
    } catch (err) {
      showError(err.message || 'Login mislukt.');
    }
  });
  demoBtn?.addEventListener('click', () => {
    document.getElementById('email').value = 'demo@energiebuddy.app';
    document.getElementById('password').value = 'Demo123!';
  });
})();
