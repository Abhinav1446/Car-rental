document.addEventListener("DOMContentLoaded", async () => {
  // If already logged in, skip straight to the dashboard.
  try {
    await api.get("/auth/me");
    window.location.href = "admin-dashboard.html";
    return;
  } catch {
    // Not logged in -- show the form as normal.
  }

  const form = document.getElementById("loginForm");
  const errorBox = document.getElementById("loginError");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.innerHTML = "";

    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in\u2026";

    try {
      await api.post("/auth/login", {
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value,
      });
      window.location.href = "admin-dashboard.html";
    } catch (err) {
      errorBox.innerHTML = `<p class="form-error">${escapeHtml(err.message)}</p>`;
      submitBtn.disabled = false;
      submitBtn.textContent = "Log in";
    }
  });
});
