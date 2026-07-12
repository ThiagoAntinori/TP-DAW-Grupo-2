document.addEventListener("DOMContentLoaded", () => {
    
    const token = localStorage.getItem("token");
    if (!token) {
        const origin = window.location.origin;
        const pathName = window.location.pathname;
        const baseCliente = pathName.startsWith("/ProdeMaster.Client/") ? `${origin}/ProdeMaster.Client` : origin;
        window.location.href = `${baseCliente}/login.html`;
        return;
    }

    const username = localStorage.getItem("username") || "Usuario";
    const lblUsername = document.getElementById("lblUsername");
    if (lblUsername) {
        lblUsername.textContent = username;
    }

    const userPoints = localStorage.getItem("userPoints");
    const lblUserPoints = document.getElementById("lblUserPoints");
    if (lblUserPoints) {
        lblUserPoints.textContent = userPoints !== null ? userPoints : "0";
    }

    ejecutarRenderizadoMenu();

    const btnHamburger = document.getElementById("btnHamburger");
    const navbarLinks = document.getElementById("navbarLinks");
    if (btnHamburger && navbarLinks) {
        btnHamburger.addEventListener("click", () => {
            navbarLinks.classList.toggle("responsive-open");
        });
    }

    const btnLogout = document.getElementById("btnLogout");
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            if (typeof logout === "function") {
                logout();
            } else {
                localStorage.clear();
                const origin = window.location.origin;
                const pathName = window.location.pathname;
                const baseCliente = pathName.startsWith("/ProdeMaster.Client/") ? `${origin}/ProdeMaster.Client` : origin;
                window.location.href = `${baseCliente}/login.html`;
            }
        });
    }
});

function ejecutarRenderizadoMenu() {
    const token = localStorage.getItem("token");
    if (!token) return;

    let privilegios = [];
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(window.atob(base64).split("").map(function(c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(""));
        
        const payload = JSON.parse(jsonPayload);
        const roles = payload.role;
        if (roles) {
            privilegios = Array.isArray(roles) ? roles : [roles];
        }
    } catch (e) {
        privilegios = [];
    }

    const secSeguridad = document.getElementById("menu-seguridad-section");
    const secProde = document.getElementById("menu-prode-section");
    const secUsuario = document.getElementById("menu-user-section");

    if (secSeguridad && privilegios.includes("ADMIN_SEGURIDAD")) {
        secSeguridad.classList.remove("display-none");
    }

    if (secProde && privilegios.includes("ADMIN_NEGOCIO")) {
        secProde.classList.remove("display-none");
    }

    if (secUsuario && (privilegios.includes("PARTICIPAR_PRODE") || privilegios.includes("ADMIN_NEGOCIO") || privilegios.includes("ADMIN_SEGURIDAD"))) {
        secUsuario.classList.remove("display-none");
    }
}