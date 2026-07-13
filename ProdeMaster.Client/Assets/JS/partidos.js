const API_PARTIDO_URL = "https://prodemaster-api.runasp.net/api/Partido";
const API_AUX_EQUIPOS = "https://prodemaster-api.runasp.net/api/Equipo";
let partidoEdicionId = null;

document.addEventListener("DOMContentLoaded", async () => {
    
    protegerRuta(["ADMIN_NEGOCIO"]);
    inicializarEncabezadosComunes();

    const tbody = document.querySelector("#tblMatches tbody");
    if (tbody) {
        cargarGrillaPartidos();
    }

    const modal = document.getElementById("modalPartido");

    document.getElementById("btnAbrirCrear").addEventListener("click", async () => {
        partidoEdicionId = null;
        document.getElementById("formPartido").reset();
        document.getElementById("form-title").textContent = "Programar Partido";
        document.getElementById("form-subtitle").textContent = "Defina los contrincantes y el horario del encuentro";
        document.getElementById("section-resultado-admin").classList.add("display-none");
        document.getElementById("btnGuardar").textContent = "Guardar Partido";
        document.getElementById("form-error").classList.remove("display-block");

        desbloquearCamposFormulario();
        await cargarSelectsEquipos();
        modal.classList.add("modal-open");
    });

    document.getElementById("btnCerrarModal").addEventListener("click", () => {
        modal.classList.remove("modal-open");
    });

    document.getElementById("formPartido").addEventListener("submit", guardarDatosPartido);
});

function inicializarEncabezadosComunes() {
    const username = localStorage.getItem("username") || "Usuario";
    const lbl = document.getElementById("lblUsername");
    if (lbl) lbl.textContent = username;
    if (typeof renderizarMenuPrincipal === "function") renderizarMenuPrincipal();
}

async function cargarGrillaPartidos() {
    const tbody = document.querySelector("#tblMatches tbody");
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(API_PARTIDO_URL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            manejarSesionExpirada();
            return;
        }

        if (!response.ok) throw new Error();
        const partidos = await response.json();
        tbody.innerHTML = "";

        if (partidos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="texto-bloqueado celda-centrada">No hay partidos programados en el fixture.</td></tr>`;
            return;
        }

        partidos.forEach(p => {
            const tr = document.createElement("tr");
            const fechaFormateada = new Date(p.fechaHora).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            
            let resultadoTexto = "vs";
            let badgeClass = "badge-user-green";
            if (p.estado === "Finalizado") {
                resultadoTexto = `${p.golesLocal} - ${p.golesVisitante}`;
                badgeClass = "badge-admin-blue";
            }

            let accionesHtml = "";
            if (p.estado === "Pendiente") {
                accionesHtml = `
                    <button class="btn btn-secondary btn-row-pill" onclick="abrirEditarPartido(${p.id})"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn btn-logout btn-row-pill" onclick="eliminarPartido(${p.id})"><i class="fa-solid fa-trash-can"></i></button>
                `;
            } else if (p.estado === "Finalizado") {
                accionesHtml = `
                    <button class="btn btn-secondary btn-row-pill" onclick="abrirEditarPartido(${p.id})"><i class="fa-solid fa-rotate-left"></i></button>
                `;
            }

            tr.innerHTML = `
                <td>${fechaFormateada}</td>
                <td><strong>${p.equipoLocal.nombre}</strong> vs <strong>${p.equipoVisitante.nombre}</strong></td>
                <td class="celda-centrada"><strong>${resultadoTexto}</strong></td>
                <td><span class="badge-role ${badgeClass}">${p.estado.toUpperCase()}</span></td>
                <td>
                    <div class="row-actions-flex">
                        ${accionesHtml}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" class="texto-bloqueado celda-centrada" style="color:var(--color-red-passion);">Error al cargar el fixture.</td></tr>`;
    }
}

async function cargarSelectsEquipos() {
    const ddlLocal = document.getElementById("ddlLocal");
    const ddlVisitante = document.getElementById("ddlVisitante");
    
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(API_AUX_EQUIPOS, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const equipos = await res.json();

        ddlLocal.innerHTML = '<option value="">-- Seleccionar Local --</option>';
        ddlVisitante.innerHTML = '<option value="">-- Seleccionar Visitante --</option>';

        equipos.forEach(e => {
            const opt = `<option value="${e.id}">${e.nombre}</option>`;
            ddlLocal.innerHTML += opt;
            ddlVisitante.innerHTML += opt;
        });
    } catch (err) {
        console.error("Error cargando catálogos de equipos:", err);
    }
}

async function abrirEditarPartido(id) {
    partidoEdicionId = id;
    const modal = document.getElementById("modalPartido");
    document.getElementById("formPartido").reset();
    document.getElementById("form-title").textContent = "Cierre o Edición de Partido";
    document.getElementById("section-resultado-admin").classList.remove("display-none");
    document.getElementById("btnGuardar").textContent = "Procesar Cambios";
    document.getElementById("form-error").classList.remove("display-block");

    desbloquearCamposFormulario();
    await cargarSelectsEquipos();

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_PARTIDO_URL}/${id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.status === 401) {
            manejarSesionExpirada();
            return;
        }
        if (!res.ok) return;
        const p = await res.json();

        document.getElementById("ddlLocal").value = p.equipoLocalId;
        document.getElementById("ddlVisitante").value = p.equipoVisitanteId;
        
        const dateObj = new Date(p.fechaHora);
        dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
        document.getElementById("txtFechaHora").value = dateObj.toISOString().slice(0, 16);

        if (p.estado === "Finalizado") {
            document.getElementById("ddlLocal").disabled = true;
            document.getElementById("ddlVisitante").disabled = true;
            document.getElementById("txtFechaHora").disabled = true;
            
            document.getElementById("numGolesLocal").value = p.golesLocal;
            document.getElementById("numGolesVisitante").value = p.golesVisitante;
            document.getElementById("form-title").textContent = "Corregir Marcador Oficial";
        }
        
        modal.classList.add("modal-open");
    } catch (err) {
        alert("Fallo al recuperar partido.");
    }
}

function desbloquearCamposFormulario() {
    document.getElementById("ddlLocal").disabled = false;
    document.getElementById("ddlVisitante").disabled = false;
    document.getElementById("txtFechaHora").disabled = false;
}

async function guardarDatosPartido(e) {
    e.preventDefault();
    const errorDiv = document.getElementById("form-error");
    errorDiv.classList.remove("display-block");

    const equipoLocalId = parseInt(document.getElementById("ddlLocal").value);
    const equipoVisitanteId = parseInt(document.getElementById("ddlVisitante").value);
    const fechaHora = document.getElementById("txtFechaHora").value;

    if (equipoLocalId === equipoVisitanteId) {
        errorDiv.textContent = "Un equipo no puede enfrentarse a sí mismo.";
        errorDiv.classList.add("display-block");
        return;
    }

    const fechaSeleccionada = new Date(fechaHora);
    const fechaActual = new Date();
    if (fechaSeleccionada <= fechaActual) {
        errorDiv.textContent = "La fecha del partido debe ser posterior a la fecha y hora actual.";
        errorDiv.classList.add("display-block");
        return;
    }

    const token = localStorage.getItem("token");
    let url = API_PARTIDO_URL;
    let method = partidoEdicionId ? "PUT" : "POST";
    let bodyData = { equipoLocalId, equipoVisitanteId, fechaHora };

    try {
        if (partidoEdicionId) {
            url += `/${partidoEdicionId}`;
            const golesL = parseInt(document.getElementById("numGolesLocal").value);
            const golesV = parseInt(document.getElementById("numGolesVisitante").value);

            const panelResultadoVisible = !document.getElementById("section-resultado-admin").classList.contains("display-none");

            if (golesL >= 0 && golesV >= 0 && panelResultadoVisible && confirm("¿Desea registrar este resultado oficial? En caso de pasar a Finalizado se congelarán las apuestas.")) {
                const resResultado = await fetch(`${API_PARTIDO_URL}/${partidoEdicionId}/resultado`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ golesLocal: golesL, golesVisitante: golesV })
                });

                if (resResultado.status === 401) {
                    manejarSesionExpirada();
                    return;
                }
                
                if (resResultado.ok) {
                    document.getElementById("modalPartido").classList.remove("modal-open");
                    cargarGrillaPartidos();
                    return;
                }
            }
        }

        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(bodyData)
        });

        if (res.status === 401) {
            manejarSesionExpirada();
            return;
        }

        if (res.ok) {
            document.getElementById("modalPartido").classList.remove("modal-open");
            await cargarGrillaPartidos();
        } else {
            const result = await res.json();
            errorDiv.textContent = result.message;
            errorDiv.classList.add("display-block");
        }
    } catch (err) {
        errorDiv.textContent = "Error de red en el controlador de partidos.";
        errorDiv.classList.add("display-block");
    }
}

async function eliminarPartido(id) {
    if (!confirm("¿Está seguro de remover este partido del fixture?")) return;
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_PARTIDO_URL}/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.status === 401) {
            manejarSesionExpirada();
            return;
        }
        if (response.ok) {
            await cargarGrillaPartidos();
        }
    } catch (err) {
        alert("Error de conexión.");
    }
}