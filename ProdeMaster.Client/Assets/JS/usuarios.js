const API_USUARIOS_URL = "http://prodemaster-api.runasp.net/api/Usuarios"; 
let usuarioEdicionId = null;

document.addEventListener("DOMContentLoaded", async () => {
    
    protegerRuta(["ADMIN_SEGURIDAD"]);
    inicializarEncabezadosComunes();

    const tbody = document.querySelector("#tblUsers tbody");
    if (tbody) {
        cargarGrillaUsuarios();

        document.getElementById("btnSearch").addEventListener("click", () => {
            cargarGrillaUsuarios(document.getElementById("txtSearch").value.trim());
        });

        document.getElementById("txtSearch").addEventListener("keypress", (e) => {
            if (e.key === "Enter") cargarGrillaUsuarios(e.target.value.trim());
        });
    }

    // LÓGICA DE CONTROL DE VENTANA EMERGENTE (MODAL)
    const modal = document.getElementById("modalUsuario");
    
    document.getElementById("btnAbrirCrear").addEventListener("click", async () => {
        usuarioEdicionId = null;
        document.getElementById("formUsuario").reset();
        document.getElementById("form-title").textContent = "Registrar Usuario";
        document.getElementById("form-subtitle").textContent = "Parámetros operativos de la cuenta";
        document.getElementById("secPassword").classList.remove("display-none");
        document.getElementById("txtPassword").setAttribute("required", "required");
        document.getElementById("form-error").classList.remove("display-block");
        
        await cargarCheckboxesPrivilegios();
        modal.classList.add("modal-open");
    });

    document.getElementById("btnCerrarModal").addEventListener("click", () => {
        modal.classList.remove("modal-open");
    });

    document.getElementById("formUsuario").addEventListener("submit", guardarDatosUsuario);
});

function inicializarEncabezadosComunes() {
    const username = localStorage.getItem("username") || "Usuario";
    const lbl = document.getElementById("lblUsername");
    if (lbl) lbl.textContent = username;
    if (typeof renderizarMenuPrincipal === "function") renderizarMenuPrincipal();
}

async function cargarGrillaUsuarios(searchQuery = "") {
    const tbody = document.querySelector("#tblUsers tbody");
    let url = API_USUARIOS_URL;
    if (searchQuery) url += `?search=${encodeURIComponent(searchQuery)}`;

    try {
        const token = localStorage.getItem("token");
        const response = await fetch(url, {
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error();
        const usuarios = await response.json();
        tbody.innerHTML = "";

        if (usuarios.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="texto-bloqueado celda-centrada">No se encontraron operarios registrados.</td></tr>`;
            return;
        }

        usuarios.forEach(usuario => {
            const tr = document.createElement("tr");
            let privilegiosHtml = "";
            
            usuario.privilegios.forEach(priv => {
                const badgeClass = priv.includes("ADMIN") ? "badge-admin-blue" : "badge-user-green";
                privilegiosHtml += `<span class="badge-role ${badgeClass}">${priv}</span> `;
            });

            if (usuario.privilegios.length === 0) {
                privilegiosHtml = `<span class="badge-role" style="background:#e2e8f0; color:#475569;">SIN_PRIVILEGIOS</span>`;
            }

            tr.innerHTML = `
                <td class="col-id-center">${usuario.id}</td>
                <td><strong>${usuario.userName}</strong></td>
                <td>${privilegiosHtml}</td>
                <td>
                    <div class="row-actions-flex">
                        <button class="btn btn-secondary btn-row-pill" onclick="abrirEditarUsuario(${usuario.id})"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-logout btn-row-pill" onclick="eliminarUsuario(${usuario.id}, '${usuario.userName}')"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" class="texto-bloqueado celda-centrada" style="color:var(--color-red-passion);">Error de respuesta de la Web API.</td></tr>`;
    }
}

async function cargarCheckboxesPrivilegios() {
    const container = document.getElementById("containerPrivileges");
    try {
        const res = await fetch(`${API_USUARIOS_URL}/privilegios`);
        const privilegios = await res.json();
        
        container.innerHTML = "";
        privilegios.forEach(priv => {
            const label = document.createElement("label");
            label.className = "custom-check-row";
            label.innerHTML = `
                <input type="checkbox" name="privilegios" value="${priv.id}">
                <span>${priv.description}</span>
            `;
            container.appendChild(label);
        });
    } catch (err) {
        container.innerHTML = "<p class='texto-bloqueado'>Fallo al sincronizar privilegios.</p>";
    }
}

async function abrirEditarUsuario(id) {
    usuarioEdicionId = id;
    const modal = document.getElementById("modalUsuario");
    document.getElementById("formUsuario").reset();
    document.getElementById("form-title").textContent = "Modificar Usuario";
    document.getElementById("form-subtitle").textContent = `Editando registro ID: ${id}`;
    
    document.getElementById("secPassword").classList.add("display-none");
    document.getElementById("txtPassword").removeAttribute("required");
    document.getElementById("form-error").classList.remove("display-block");

    await cargarCheckboxesPrivilegios();

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_USUARIOS_URL}/${id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) return;
        const usuario = await res.json();

        document.getElementById("txtUsername").value = usuario.userName;

        const checkboxes = document.querySelectorAll('input[name="privilegios"]');
        checkboxes.forEach(cb => {
            if (usuario.privilegios.includes(cb.value)) {
                cb.checked = true;
            }
        });

        modal.classList.add("modal-open");
    } catch (err) {
        alert("Error de sincronización.");
    }
}

async function guardarDatosUsuario(e) {
    e.preventDefault();
    const errorDiv = document.getElementById("form-error");
    errorDiv.classList.remove("display-block");

    const username = document.getElementById("txtUsername").value.trim();
    const checkboxes = document.querySelectorAll('input[name="privilegios"]:checked');
    const privilegioIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    let url = API_USUARIOS_URL;
    let method = "POST";
    let bodyData = {};

    if (usuarioEdicionId) {
        method = "PUT";
        url += `/${usuarioEdicionId}`;
        bodyData = { username, privilegioIds };
    } else {
        const password = document.getElementById("txtPassword").value;
        if (password.length < 6) {
            errorDiv.textContent = "La contraseña debe tener un mínimo de 6 caracteres.";
            errorDiv.classList.add("display-block");
            return;
        }
        bodyData = { username, password, privilegioIds };
    }

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(bodyData)
        });

        const result = await res.json();

        if (res.ok) {
            document.getElementById("modalUsuario").classList.remove("modal-open");
            cargarGrillaUsuarios();
        } else {
            errorDiv.textContent = result.message;
            errorDiv.classList.add("display-block");
        }
    } catch (err) {
        errorDiv.textContent = "Error de comunicación con los servicios.";
        errorDiv.classList.add("display-block");
    }
}

async function eliminarUsuario(id, username) {
    if (id === 1) {
        alert("Operación denegada.");
        return;
    }
    if (!confirm(`¿Dar de baja a "${username}"?`)) return;

    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_USUARIOS_URL}/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) cargarGrillaUsuarios();
    } catch (error) {
        alert("Error de red.");
    }
}