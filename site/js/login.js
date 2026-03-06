import { api } from "./api.js";

(function(){
  const form = document.getElementById("login-form");
  const error = document.getElementById("login-error");

  function showError(msg){
    error.textContent = msg;
    error.classList.add("show");
  }

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