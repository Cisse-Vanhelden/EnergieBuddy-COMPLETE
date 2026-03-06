import "dotenv/config";

(function(){
  const form = document.getElementById('register-form');
  const error = document.getElementById('register-error');
  function showError(msg){ error.textContent = msg; error.classList.add('show'); }
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.classList.remove('show');
    const displayName = document.getElementById('displayName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    try {
      await api('/register', { method:'POST', body: JSON.stringify({ displayName, email, password }) });
      window.location.href = 'index.html';
    } catch (err) {
      showError(err.message || 'Registratie mislukt.');
    }
  });
})();
