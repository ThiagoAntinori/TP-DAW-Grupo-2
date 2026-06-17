const API_EQUIPO_URL = "http://localhost:5097/api/Equipo";

document.addEventListener("DOMContentLoaded", async () => {
    protegerRuta(["ADMIN_NEGOCIO"]);

    const tbody = document.querySelector("#tblTeams tbody");
    if (tbody) {
        cargarGrillaEquipos();

        const btnSearch = document.getElementById("btnSearch");
        if (btnSearch) {
            btnSearch.addEventListener("click", () => {
                filtrarTablaEquipos();
            });
        }

        const txtSearch = document.getElementById("txtSearch");
        if (txtSearch) {
            txtSearch.addEventListener("keypress", (e) => {
                if (e.key === "Enter") filtrarTablaEquipos();
            });
        }
    }

    const formEquipo = document.getElementById("formEquipo");
    if (formEquipo) {
        const urlParams = new URLSearchParams(window.location.search);
        const equipoId = urlParams.get('id');

        if (equipoId) {
            configurarModoEdicionEquipo(equipoId);
        }

        formEquipo.addEventListener("submit", (e) => guardarDatosEquipo(e, equipoId));
    }
});

async function cargarGrillaEquipos() {
    const tbody = document.querySelector("#tblTeams tbody");
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(API_EQUIPO_URL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error();
        const equipos = await response.json();
        tbody.innerHTML = "";

        if (equipos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b;">No hay equipos registrados.</td></tr>`;
            return;
        }

        renderizarFilasEquipos(equipos);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#ef4444; font-weight:600;">Error de conexión con el servidor.</td></tr>`;
    }
}

function renderizarFilasEquipos(equipos) {
    const tbody = document.querySelector("#tblTeams tbody");
    tbody.innerHTML = "";
    equipos.forEach(eq => {
        const tr = document.createElement("tr");
        const escudoHtml = eq.escudoUrl ? `<img src="${eq.escudoUrl}" alt="${eq.nombre}" style="width:32px; height:32px; object-fit:contain;">` : `<span>-</span>`;
        tr.innerHTML = `
            <td>${eq.id}</td>
            <td style="text-align:center;">${escudoHtml}</td>
            <td><strong>${eq.nombre}</strong></td>
            <td><span class="badge">${eq.abreviatura}</span></td>
            <td>
                <button class="btn-action btn-edit" onclick="location.href='form.html?id=${eq.id}'">✏️ Editar</button>
                <button class="btn-action btn-delete" onclick="eliminarEquipo(${eq.id}, '${eq.nombre}')">🗑️ Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarTablaEquipos() {
    const query = document.getElementById("txtSearch").value.trim().toLowerCase();
    const filas = document.querySelectorAll("#tblTeams tbody tr");
    
    filas.forEach(fila => {
        const nombreCelda = fila.children[2]?.textContent.toLowerCase() || "";
        if (nombreCelda.includes(query)) {
            fila.style.display = "";
        } else if(filas.length > 1 || fila.children.length > 1) {
            fila.style.display = "none";
        }
    });
}

async function eliminarEquipo(id, nombre) {
    if (!confirm(`¿Desea eliminar al equipo "${nombre}"?`)) return;

    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_EQUIPO_URL}/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message || "Equipo eliminado.");
            cargarGrillaEquipos();
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert("Error de red al conectar con la Web API.");
    }
}

async function configurarModoEdicionEquipo(id) {
    document.getElementById("form-title").textContent = "Modificar Equipo";
    document.getElementById("form-subtitle").textContent = `Editando ID: ${id}`;

    try {
        const res = await fetch(`${API_EQUIPO_URL}/${id}`);
        if (!res.ok) return;
        const eq = await res.json();

        document.getElementById("txtNombre").value = eq.nombre;
        document.getElementById("txtAbreviatura").value = eq.abreviatura;
        document.getElementById("txtEscudoUrl").value = eq.escudoUrl;
    } catch (err) {
        console.error(err);
    }
}

async function guardarDatosEquipo(e, idAlterar) {
    e.preventDefault();
    const errorDiv = document.getElementById("form-error");
    errorDiv.style.display = "none";

    const nombre = document.getElementById("txtNombre").value.trim();
    const abreviatura = document.getElementById("txtAbreviatura").value.trim().toUpperCase();
    const escudoUrl = document.getElementById("txtEscudoUrl").value.trim();

    let url = API_EQUIPO_URL;
    let method = "POST";
    let bodyData = { nombre, abreviatura, escudoUrl };

    if (idAlterar) {
        method = "PUT";
        url += `/${idAlterar}`;
        bodyData.id = parseInt(idAlterar);
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