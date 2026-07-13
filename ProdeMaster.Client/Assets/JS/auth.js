const API_URL = "https://prodemaster-api.runasp.net/api";

document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.getElementById("loginForm");
    
    if (formLogin) {
        formLogin.addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value;
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
                    localStorage.setItem("puntaje", result.puntaje ?? 0);

                    const baseCliente = obtenerUrlBaseCliente();
                    window.location.href = `${baseCliente}/index.html`; 
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
    localStorage.removeItem("puntaje");

    const baseCliente = obtenerUrlBaseCliente();

    window.location.href = `${baseCliente}/login.html`;
}

function decodificarJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

function obtenerPrivilegiosUsuario() {
    const token = localStorage.getItem("token");
    if (!token) return [];
    
    const payload = decodificarJWT(token);
    if (!payload) return [];

    const roles = payload.role;

    if (!roles) return [];
    return Array.isArray(roles) ? roles : [roles];
}

function obtenerUrlBaseCliente() {
    const origin = window.location.origin;
    const pathName = window.location.pathname;

    if (pathName.startsWith("/ProdeMaster.Client/")) {
        return `${origin}/ProdeMaster.Client`;
    }

    return origin;
}

function protegerRuta(privilegiosRequeridos = []) {
    const token = localStorage.getItem("token");
    const baseCliente = obtenerUrlBaseCliente();

    if (!token) {
        window.location.href = `${baseCliente}/login.html`;
        return;
    }

    if (privilegiosRequeridos.length === 0) return;

    const privilegiosUsuario = obtenerPrivilegiosUsuario();
    const tienePermiso = privilegiosRequeridos.some(priv => privilegiosUsuario.includes(priv));

    if (!tienePermiso) {
        alert("Acceso denegado: No posee los privilegios requeridos para visualizar este módulo.");
        window.location.href = `${baseCliente}/index.html`;
    }
}

function renderizarMenuPrincipal() {
    const privilegios = obtenerPrivilegiosUsuario();

    const secSeguridad = document.getElementById("menu-seguridad-section");
    const secNegocio = document.getElementById("menu-negocio-section");
    const secUsuario = document.getElementById("menu-user-section");

    if (secSeguridad && privilegios.includes("ADMIN_SEGURIDAD")) {
        secSeguridad.style.display = "block";
    }

    if (secNegocio && privilegios.includes("ADMIN_NEGOCIO")) {
        secNegocio.style.display = "block";
    }

    if (secUsuario && (privilegios.includes("PARTICIPAR_PRODE") || privilegios.includes("ADMIN_NEGOCIO") || privilegios.includes("ADMIN_SEGURIDAD"))) {
        secUsuario.style.display = "block";
    } else if (secUsuario) {
        secUsuario.style.display = "none";
    }
}

function protegerRuta(privilegiosRequeridos = []) {
    const token = localStorage.getItem("token");
    const baseCliente = obtenerUrlBaseCliente();

    if (!token) {
        window.location.href = "../../login.html";
        return;
    }

    if (privilegiosRequeridos.length === 0) return;

    const privilegiosUsuario = obtenerPrivilegiosUsuario();
    const tienePermiso = privilegiosRequeridos.some(priv => privilegiosUsuario.includes(priv));

    if (!tienePermiso) {
        alert("Acceso denegado: No posee los privilegios requeridos para visualizar este módulo.");
        window.location.href = "../../index.html";
    }
}

function manejarSesionExpirada() {
    alert("Su sesion ha expirado o no tiene permisos. Por favor, inicie sesion nuevamente.");
    localStorage.clear();
    const origin = window.location.origin;
    const pathName = window.location.pathname;
    const baseCliente = pathName.startsWith("/ProdeMaster.Client/") ? `${origin}/ProdeMaster.Client` : origin;
    window.location.href = `${baseCliente}/login.html`;
}