const API_USUARIOS_URL = "http://localhost:5097/api/Usuarios"; 

document.addEventListener("DOMContentLoaded", async () => {
    
    protegerRuta(["ADMIN_SEGURIDAD"]);
    
    const tbody = document.querySelector("#tblUsers tbody");
    if (tbody) {
        cargarGrillaUsuarios();

        const btnSearch = document.getElementById("btnSearch");
        if (btnSearch) {
            btnSearch.addEventListener("click", () => {
                const query = document.getElementById("txtSearch").value.trim();
                cargarGrillaUsuarios(query);
            });
        }

        const txtSearch = document.getElementById("txtSearch");
        if (txtSearch) {
            txtSearch.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    cargarGrillaUsuarios(txtSearch.value.trim());
                }
            });
        }
    }

    const formUsuario = document.getElementById("formUsuario");
    if (formUsuario) {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('id');

        await cargarCheckboxesPrivilegios();

        if (userId) {
            configurarModoEdicion(userId);
        }

        formUsuario.addEventListener("submit", (e) => guardarDatosUsuario(e, userId));
    }
});

async function cargarGrillaUsuarios(searchQuery = "") {
    const tbody = document.querySelector("#tblUsers tbody");
    let url = API_USUARIOS_URL;
    if (searchQuery) {
        url += `?search=${encodeURIComponent(searchQuery)}`;
    }

    try {
        const token = localStorage.getItem("token");
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            }
        });

        if (!response.ok) throw new Error();
        const usuarios = await response.json();
        tbody.innerHTML = "";

        if (usuarios.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b;">No se encontraron usuarios registrados.</td></tr>`;
            return;
        }

        usuarios.forEach(usuario => {
            const tr = document.createElement("tr");
            let privilegiosHtml = "";
            usuario.privilegios.forEach(priv => {
                const badgeClass = priv.includes("ADMIN") ? "badge-admin" : "badge-user";
                privilegiosHtml += `<span class="badge ${badgeClass}">${priv}</span> `;
            });

            if (usuario.privilegios.length === 0) {
                privilegiosHtml = `<span class="badge" style="background:#e2e8f0; color:#475569;">SIN_PRIVILEGIOS</span>`;
            }

            tr.innerHTML = `
                <td>${usuario.id}</td>
                <td><strong>${usuario.userName}</strong></td>
                <td>${privilegiosHtml}</td>
                <td>
                    <button class="btn-action btn-edit" onclick="location.href='form.html?id=${usuario.id}'">✏️ Editar</button>
                    <button class="btn-action btn-delete" onclick="eliminarUsuario(${usuario.id}, '${usuario.userName}')">🗑️ Dar de Baja</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#ef4444; font-weight:600;">Error de conexión con el servidor.</td></tr>`;
    }
}

async function eliminarUsuario(id, username) {
    if (id === 1) {
        alert("Operación denegada: No se puede eliminar al administrador principal.");
        return;
    }
    if (!confirm(`¿Está seguro de que desea dar de baja al usuario "${username}"?`)) return;

    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_USUARIOS_URL}/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message || "Usuario eliminado.");
            cargarGrillaUsuarios();
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert("Error de red al conectar con la Web API.");
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
            label.className = "checkbox-group";
            label.innerHTML = `
                <input type="checkbox" name="privilegios" value="${priv.id}">
                <span>${priv.description}</span>
            `;
            container.appendChild(label);
        });
    } catch (err) {
        container.innerHTML = "<p style='color:#ef4444;'>Error al cargar los privilegios.</p>";
    }
}

async function configurarModoEdicion(id) {
    document.getElementById("form-title").textContent = "Modificar Privilegios";
    document.getElementById("form-subtitle").textContent = `Editando usuario con ID: ${id}`;
    
    document.getElementById("secPassword").style.display = "none";
    document.getElementById("txtPassword").removeAttribute("required");

    try {
        const res = await fetch(`${API_USUARIOS_URL}/${id}`);
        if(!res.ok) return;
        const usuario = await res.json();

        document.getElementById("txtUsername").value = usuario.userName;

        const checkboxes = document.querySelectorAll('input[name="privilegios"]');
        checkboxes.forEach(cb => {
            if (usuario.privilegios.includes(cb.value)) {
                cb.checked = true;
            }
        });
    } catch (err) {
        console.error(err);
    }
}

async function guardarDatosUsuario(e, idALterar) {
    e.preventDefault();
    const errorDiv = document.getElementById("form-error");
    errorDiv.style.display = "none";

    const username = document.getElementById("txtUsername").value.trim();
    const checkboxes = document.querySelectorAll('input[name="privilegios"]:checked');
    const privilegioIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    let url = API_USUARIOS_URL;
    let method = "POST";
    let bodyData = {};

    if (idALterar) {
        method = "PUT";
        url += `/${idALterar}`;
        bodyData = { username, privilegioIds };
    } else {
        const password = document.getElementById("txtPassword").value;
        if (password.length < 6) {
            errorDiv.textContent = "La contraseña debe tener un mínimo de 6 caracteres.";
            errorDiv.style.display = "block";
            return;
        }
        bodyData = { username, password, privilegioIds };
    }

    try {
        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyData)
        });

        const result = await res.json();

        if (res.ok) {
            alert(result.message || "Operación realizada con éxito.");
            window.location.href = "index.html";
        } else {
            errorDiv.textContent = result.message;
            errorDiv.style.display = "block";
        }
    } catch (err) {
        errorDiv.textContent = "Error de conexión con la Web API.";
        errorDiv.style.display = "block";
    }
}