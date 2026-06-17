const API_PARTIDO_URL = "http://localhost:5097/api/Partido";
const API_AUX_EQUIPOS = "http://localhost:5097/api/Equipo";

document.addEventListener("DOMContentLoaded", async () => {
    protegerRuta(["ADMIN_NEGOCIO"]);

    const tbody = document.querySelector("#tblMatches tbody");
    if (tbody) {
        cargarGrillaPartidos();
    }

    const formPartido = document.getElementById("formPartido");
    if (formPartido) {
        const urlParams = new URLSearchParams(window.location.search);
        const partidoId = urlParams.get('id');

        await cargarSelectsEquipos();

        if (partidoId) {
            configurarModoEdicionPartido(partidoId);
        }

        formPartido.addEventListener("submit", (e) => guardarDatosPartido(e, partidoId));
    }
});

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

        if (!response.ok) throw new Error();
        const partidos = await response.json();
        tbody.innerHTML = "";

        if (partidos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b;">No hay partidos programados en el fixture.</td></tr>`;
            return;
        }

        partidos.forEach(p => {
            const tr = document.createElement("tr");
            const fechaFormateada = new Date(p.fechaHora).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            
            let resultadoTexto = "vs";
            let badgeClass = "badge-user";
            if (p.estado === "Finalizado") {
                resultadoTexto = `${p.golesLocal} - ${p.golesVisitante}`;
                badgeClass = "badge-admin";
            }

            let accionesHtml = "";
            if (p.estado === "Pendiente") {
                accionesHtml = `
                    <button class="btn-action btn-edit" onclick="location.href='form.html?id=${p.id}'">Cambiar Fecha / Cargar Fin</button>
                    <button class="btn-action btn-delete" onclick="eliminarPartido(${p.id})">Eliminar</button>
                `;
            } else if (p.estado === "Finalizado") {
                accionesHtml = `
                    <button class="btn-action btn-edit" style="background-color: #f59e0b;" onclick="location.href='form.html?id=${p.id}'">Corregir Resultado</button>
                `;
            }

            tr.innerHTML = `
                <td>${fechaFormateada}</td>
                <td><strong>${p.equipoLocal.nombre}</strong> vs <strong>${p.equipoVisitante.nombre}</strong></td>
                <td style="text-align:center; font-weight:bold; font-size:1.1rem;">${resultadoTexto}</td>
                <td><span class="badge ${badgeClass}">${p.estado.toUpperCase()}</span></td>
                <td>${accionesHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#ef4444; font-weight:600;">Error al cargar el fixture.</td></tr>`;
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

async function configurarModoEdicionPartido(id) {
    document.getElementById("form-title").textContent = "Cierre o Edición de Partido";
    document.getElementById("section-resultado-admin").style.display = "block";
    document.getElementById("btnGuardar").textContent = "Procesar Cambios";

    try {
        const res = await fetch(`${API_PARTIDO_URL}/${id}`);
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
    } catch (err) {
        console.error(err);
    }
}

async function guardarDatosPartido(e, idAlterar) {
    e.preventDefault();
    const errorDiv = document.getElementById("form-error");
    errorDiv.style.display = "none";

    const equipoLocalId = parseInt(document.getElementById("ddlLocal").value);
    const equipoVisitanteId = parseInt(document.getElementById("ddlVisitante").value);
    const fechaHora = document.getElementById("txtFechaHora").value;

    if (equipoLocalId === equipoVisitanteId) {
        errorDiv.textContent = "Un equipo no puede enfrentarse a sí mismo.";
        errorDiv.style.display = "block";
        return;
    }

    const token = localStorage.getItem("token");
    let url = API_PARTIDO_URL;
    let method = idAlterar ? "PUT" : "POST";
    let bodyData = { equipoLocalId, equipoVisitanteId, fechaHora };

    try {
        if (idAlterar) {
            url += `/${idAlterar}`;
            const golesL = parseInt(document.getElementById("numGolesLocal").value);
            const golesV = parseInt(document.getElementById("numGolesVisitante").value);

            if (golesL >= 0 && golesV >= 0 && document.getElementById("section-resultado-admin").style.display === "block" && confirm("¿Desea cerrar el partido y cargar el resultado final? Esto bloqueará modificaciones posteriores.")) {
                const resResultado = await fetch(`${API_PARTIDO_URL}/${idAlterar}/resultado`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ golesLocal: golesL, golesVisitante: golesV })
                });
                
                if (resResultado.ok) {
                    alert("Partido cerrado y marcador oficial registrado.");
                    window.location.href = "index.html";
                    return;
                }
            }
        }

        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(bodyData)
        });

        const result = await res.json();
        if (res.ok) {
            alert(result.message || "Operación exitosa.");
            window.location.href = "index.html";
        } else {
            errorDiv.textContent = result.message;
            errorDiv.style.display = "block";
        }
    } catch (err) {
        errorDiv.textContent = "Error de red en el controlador de partidos.";
        errorDiv.style.display = "block";
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
        const res = await response.json();
        if (response.ok) {
            alert(res.message || "Partido eliminado.");
            cargarGrillaPartidos();
        } else {
            alert(res.message);
        }
    } catch (err) {
        alert("Error de conexión.");
    }
}