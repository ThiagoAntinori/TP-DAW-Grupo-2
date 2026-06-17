const API_PRIVILEGIOS_URL = "http://localhost:5097/api/Usuarios/privilegios"; 

document.addEventListener("DOMContentLoaded", async () => {
    
    const tbody = document.querySelector("#tblPrivileges tbody");
    if (tbody) {
        cargarGrillaPrivilegios();

        const btnSearch = document.getElementById("btnSearch");
        if (btnSearch) {
            btnSearch.addEventListener("click", () => {
                const query = document.getElementById("txtSearch").value.trim();
                cargarGrillaPrivilegios(query);
            });
        }

        const txtSearch = document.getElementById("txtSearch");
        if (txtSearch) {
            txtSearch.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    cargarGrillaPrivilegios(txtSearch.value.trim());
                }
            });
        }
    }

    const formPrivilegio = document.getElementById("formPrivilegio");
    if (formPrivilegio) {
        const urlParams = new URLSearchParams(window.location.search);
        const privilegeId = urlParams.get('id');

        if (privilegeId) {
            configurarModoEdicionPrivilegio(privilegeId);
        }

        formPrivilegio.addEventListener("submit", (e) => guardarDatosPrivilegio(e, privilegeId));
    }
});

async function cargarGrillaPrivilegios(searchQuery = "") {
    const tbody = document.querySelector("#tblPrivileges tbody");
    let url = API_PRIVILEGIOS_URL;
    if (searchQuery) {
        url = `http://localhost:5097/api/Usuarios/privilegios/buscar?search=${encodeURIComponent(searchQuery)}`;
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
        const privilegios = await response.json();
        tbody.innerHTML = "";

        if (privilegios.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#64748b;">No se encontraron privilegios registrados.</td></tr>`;
            return;
        }

        privilegios.forEach(priv => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${priv.id}</td>
                <td><strong>${priv.description}</strong></td>
                <td>
                    <button class="btn-action btn-edit" onclick="location.href='form.html?id=${priv.id}'">✏️ Editar</button>
                    <button class="btn-action btn-delete" onclick="eliminarPrivilegio(${priv.id}, '${priv.description}')">🗑️ Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#ef4444; font-weight:600;">Error de conexión con el servidor.</td></tr>`;
    }
}

async function eliminarPrivilegio(id, description) {
    if (id === 1 || id === 2 || id === 3) {
        alert("Operación denegada: No se pueden eliminar los privilegios base del sistema.");
        return;
    }
    if (!confirm(`¿Está seguro de que desea eliminar el privilegio "${description}"?`)) return;

    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_PRIVILEGIOS_URL}/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message || "Privilegio eliminado.");
            cargarGrillaPrivilegios();
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert("Error de red al conectar con la Web API.");
    }
}

async function configurarModoEdicionPrivilegio(id) {
    document.getElementById("form-title").textContent = "Modificar Privilegio";
    document.getElementById("form-subtitle").textContent = `Editando privilegio con ID: ${id}`;

    try {
        const res = await fetch(`${API_PRIVILEGIOS_URL}/${id}`);
        if(!res.ok) return;
        const privilegio = await res.json();

        document.getElementById("txtDescription").value = privilegio.description;
    } catch (err) {
        console.error(err);
    }
}

async function guardarDatosPrivilegio(e, idAlterar) {
    e.preventDefault();
    const errorDiv = document.getElementById("form-error");
    errorDiv.style.display = "none";

    const description = document.getElementById("txtDescription").value.trim().toUpperCase();
    
    let url = API_PRIVILEGIOS_URL;
    let method = "POST";
    let bodyData = { description };

    if (idAlterar) {
        method = "PUT";
        url += `/${idAlterar}`;
    }

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(url, {
            method: method,
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
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