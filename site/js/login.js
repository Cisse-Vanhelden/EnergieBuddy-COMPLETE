(function(){
  const form = document.getElementById("login-form");
  const error = document.getElementById("login-error");
  const demoBtn = document.getElementById("demo-login");

  function showError(msg){
    error.textContent = msg;
    error.classList.add("show");
  }

  demoBtn?.addEventListener("click", () => {
    document.getElementById("email").value = "demo@energiebuddy.app";
    document.getElementById("password").value = "Demo123!";
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    error.classList.remove("show");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      await api("/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      window.location.href = "dashboard.html";
    } catch (err) {
      showError(err.message || "Login mislukt.");
    }
  });
})();