const API_URL = "http://localhost:5097/api"; 

document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.getElementById("formLogin");
    
    if (formLogin) {
        formLogin.addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = document.getElementById("txtUser").value.trim();
            const password = document.getElementById("txtPass").value;
            const errorDiv = document.getElementById("api-error");

            errorDiv.style.display = "none";

            const loginData = {
                username: username,
                password: password
            };

            try {
                const response = await fetch(`${API_URL}/Auth/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(loginData)
                });

                const result = await response.json();

                if (response.ok) {
                    localStorage.setItem("token", result.token);
                    localStorage.setItem("refreshToken", result.refreshToken);
                    localStorage.setItem("username", result.username);

                    window.location.href = "index.html";
                } else {
                    errorDiv.textContent = result.message || "Error al iniciar sesión.";
                    errorDiv.style.display = "block";
                }

            } catch (error) {
                errorDiv.textContent = "No se pudo conectar con el servidor. Verifique que la Web API esté ejecutándose.";
                errorDiv.style.display = "block";
                console.error("Error de conexión:", error);
            }
        });
    }
});

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");

    window.location.href = "login.html";
}