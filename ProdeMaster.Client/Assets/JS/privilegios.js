const API_PRIVILEGIOS_URL = "https://prodemaster-api.runasp.net/api/Usuarios/privilegios";  
let privilegioEdicionId = null;

document.addEventListener("DOMContentLoaded", async () => {
    
    protegerRuta(["ADMIN_SEGURIDAD"]);
    inicializarEncabezadosComunes();

    const tbody = document.querySelector("#tblPrivileges tbody");
    if (tbody) {
        cargarGrillaPrivilegios();

        document.getElementById("btnSearch").addEventListener("click", () => {
            cargarGrillaPrivilegios(document.getElementById("txtSearch").value.trim());
        });

        document.getElementById("txtSearch").addEventListener("keypress", (e) => {
            if (e.key === "Enter") cargarGrillaPrivilegios(e.target.value.trim());
        });
    }

    // CONTROL DEL MODAL
    const modal = document.getElementById("modalPrivilegio");

    document.getElementById("btnAbrirCrear").addEventListener("click", () => {
        privilegioEdicionId = null;
        document.getElementById("formPrivilegio").reset();
        document.getElementById("form-title").textContent = "Registrar Privilegio";
        document.getElementById("form-subtitle").textContent = "Defina un nuevo permiso operativo";
        document.getElementById("form-error").classList.remove("display-block");
        modal.classList.add("modal-open");
    });

    document.getElementById("btnCerrarModal").addEventListener("click", () => {
        modal.classList.remove("modal-open");
    });

    document.getElementById("formPrivilegio").addEventListener("submit", guardarDatosPrivilegio);
});

function inicializarEncabezadosComunes() {
    const username = localStorage.getItem("username") || "Usuario";
    const lbl = document.getElementById("lblUsername");
    if (lbl) lbl.textContent = username;
    if (typeof renderizarMenuPrincipal === "function") renderizarMenuPrincipal();
}

async function cargarGrillaPrivilegios(searchQuery = "") {
    const tbody = document.querySelector("#tblPrivileges tbody");
    let url = API_PRIVILEGIOS_URL;
    if (searchQuery) {
        url = `https://prodemaster-api.runasp.net/api/Usuarios/privilegios/buscar?search=${encodeURIComponent(searchQuery)}`;
    }

    try {
        const token = localStorage.getItem("token");
        const response = await fetch(url, {
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
        });

        if (response.status === 401) {
            manejarSesionExpirada();
            return;
        }

        if (!response.ok) throw new Error();
        const privilegios = await response.json();
        tbody.innerHTML = "";

        if (privilegios.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="texto-bloqueado celda-centrada">No se encontraron registros asociados.</td></tr>`;
            return;
        }

        privilegios.forEach(priv => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="col-id-center">${priv.id}</td>
                <td><strong>${priv.description}</strong></td>
                <td>
                    <div class="row-actions-flex">
                        <button class="btn btn-secondary btn-row-pill" onclick="abrirEditarPrivilegio(${priv.id})"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-logout btn-row-pill" onclick="eliminarPrivilegio(${priv.id}, '${priv.description}')"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="3" class="texto-bloqueado celda-centrada" style="color:var(--color-red-passion);">Error de sincronización de catálogos.</td></tr>`;
    }
}

async function abrirEditarPrivilegio(id) {
    privilegioEdicionId = id;
    const modal = document.getElementById("modalPrivilegio");
    document.getElementById("formPrivilegio").reset();
    document.getElementById("form-title").textContent = "Modificar Privilegio";
    document.getElementById("form-subtitle").textContent = `Editando privilegio ID: ${id}`;
    document.getElementById("form-error").classList.remove("display-block");

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_PRIVILEGIOS_URL}/${id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401) {
            manejarSesionExpirada();
            return;
        }

        if (!res.ok) return;
        const privilegio = await res.json();

        document.getElementById("txtDescription").value = privilegio.description;
        modal.classList.add("modal-open");
    } catch (err) {
        alert("Fallo de comunicación interna.");
    }
}

async function guardarDatosPrivilegio(e) {
    e.preventDefault();
    const errorDiv = document.getElementById("form-error");
    errorDiv.classList.remove("display-block");

    const description = document.getElementById("txtDescription").value.trim().toUpperCase();
    let url = API_PRIVILEGIOS_URL;
    let method = "POST";
    let bodyData = { description };

    if (privilegioEdicionId) {
        method = "PUT";
        url += `/${privilegioEdicionId}`;
    }

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(bodyData)
        });

        const result = await res.json();

        if (res.status === 401) {
            manejarSesionExpirada();
            return;
        }

        if (res.ok) {
            document.getElementById("modalPrivilegio").classList.remove("modal-open");
            cargarGrillaPrivilegios();
        } else {
            errorDiv.textContent = result.message;
            errorDiv.classList.add("display-block");
        }
    } catch (err) {
        errorDiv.textContent = "Error de red en el motor de seguridad.";
        errorDiv.classList.add("display-block");
    }
}

async function eliminarPrivilegio(id, description) {
    if (id === 1 || id === 2 || id === 3) {
        alert("Operación denegada: Bloque base del sistema.");
        return;
    }
    if (!confirm(`¿Remover privilegio "${description}"?`)) return;

    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_PRIVILEGIOS_URL}/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.status === 401) {
            manejarSesionExpirada();
            return;
        }

        const result = await response.json();
        if (response.ok) {
            cargarGrillaPrivilegios();
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert("Error de red.");
    }
}