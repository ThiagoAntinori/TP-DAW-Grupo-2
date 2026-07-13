const API_EQUIPO_URL = "http://prodemaster-api.runasp.net/api/Equipo";
let equipoEdicionId = null;

document.addEventListener("DOMContentLoaded", async () => {
    
    protegerRuta(["ADMIN_NEGOCIO"]);
    inicializarEncabezadosComunes();

    const tbody = document.querySelector("#tblTeams tbody");
    if (tbody) {
        cargarGrillaEquipos();

        document.getElementById("btnSearch").addEventListener("click", () => {
            filtrarTablaEquipos();
        });

        document.getElementById("txtSearch").addEventListener("keypress", (e) => {
            if (e.key === "Enter") filtrarTablaEquipos();
        });
    }

    const modal = document.getElementById("modalEquipo");

    document.getElementById("btnAbrirCrear").addEventListener("click", () => {
        equipoEdicionId = null;
        document.getElementById("formEquipo").reset();
        document.getElementById("form-title").textContent = "Crear Nuevo Equipo";
        document.getElementById("form-subtitle").textContent = "Complete los datos institucionales del club";
        document.getElementById("form-error").classList.remove("display-block");
        modal.classList.add("modal-open");
    });

    document.getElementById("btnCerrarModal").addEventListener("click", () => {
        modal.classList.remove("modal-open");
    });

    document.getElementById("formEquipo").addEventListener("submit", guardarDatosEquipo);
});

function inicializarEncabezadosComunes() {
    const username = localStorage.getItem("username") || "Usuario";
    const lbl = document.getElementById("lblUsername");
    if (lbl) lbl.textContent = username;
    if (typeof renderizarMenuPrincipal === "function") renderizarMenuPrincipal();
}

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
            tbody.innerHTML = `<tr><td colspan="5" class="texto-bloqueado celda-centrada">No hay equipos registrados.</td></tr>`;
            return;
        }

        renderizarFilasEquipos(equipos);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" class="texto-bloqueado celda-centrada" style="color:var(--color-red-passion);">Error de conexión con la Web API.</td></tr>`;
    }
}

function renderizarFilasEquipos(equipos) {
    const tbody = document.querySelector("#tblTeams tbody");
    tbody.innerHTML = "";
    equipos.forEach(eq => {
        const tr = document.createElement("tr");
        const escudoHtml = eq.escudoUrl ? `<img src="${eq.escudoUrl}" alt="${eq.nombre}" class="team-escudo-thumbnail">` : `<span>-</span>`;
        tr.innerHTML = `
            <td class="col-id-center">${eq.id}</td>
            <td class="col-escudo-center">${escudoHtml}</td>
            <td><strong>${eq.nombre}</strong></td>
            <td><span class="badge-abbreviation">${eq.abreviatura}</span></td>
            <td>
                <div class="row-actions-flex">
                    <button class="btn btn-secondary btn-row-pill" onclick="abrirEditarEquipo(${eq.id})"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-logout btn-row-pill" onclick="eliminarEquipo(${eq.id}, '${eq.nombre}')"><i class="fa-solid fa-trash-can"></i></button>
                </div>
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
            fila.classList.remove("display-none");
        } else if (filas.length > 1 || fila.children.length > 1) {
            fila.classList.add("display-none");
        }
    });
}

async function abrirEditarEquipo(id) {
    equipoEdicionId = id;
    const modal = document.getElementById("modalEquipo");
    document.getElementById("formEquipo").reset();
    document.getElementById("form-title").textContent = "Modificar Equipo";
    document.getElementById("form-subtitle").textContent = `Editando ID: ${id}`;
    document.getElementById("form-error").classList.remove("display-block");

    try {
        const res = await fetch(`${API_EQUIPO_URL}/${id}`);
        if (!res.ok) return;
        const eq = await res.json();

        document.getElementById("txtNombre").value = eq.nombre;
        document.getElementById("txtAbreviatura").value = eq.abreviatura;
        document.getElementById("txtEscudoUrl").value = eq.escudoUrl;

        modal.classList.add("modal-open");
    } catch (err) {
        alert("Fallo al recuperar datos.");
    }
}

async function guardarDatosEquipo(e) {
    e.preventDefault();
    const errorDiv = document.getElementById("form-error");
    errorDiv.classList.remove("display-block");

    const nombre = document.getElementById("txtNombre").value.trim();
    const abreviatura = document.getElementById("txtAbreviatura").value.trim().toUpperCase();
    const escudoUrl = document.getElementById("txtEscudoUrl").value.trim();

    let url = API_EQUIPO_URL;
    let method = "POST";
    let bodyData = { nombre, abreviatura, escudoUrl };

    if (equipoEdicionId) {
        method = "PUT";
        url += `/${equipoEdicionId}`;
        bodyData.id = parseInt(equipoEdicionId);
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
            document.getElementById("modalEquipo").classList.remove("modal-open");
            cargarGrillaEquipos();
        } else {
            errorDiv.textContent = result.message;
            errorDiv.classList.add("display-block");
        }
    } catch (err) {
        errorDiv.textContent = "Error de conexión con la Web API.";
        errorDiv.classList.add("display-block");
    }
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
            cargarGrillaEquipos();
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert("Error de red al conectar con la Web API.");
    }
}