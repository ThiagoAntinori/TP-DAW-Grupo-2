const API_PARTIDOS = "https://prodemaster-api.runasp.net/api/Partido";
const API_PRONOSTICOS = "https://prodemaster-api.runasp.net/api/Pronostico";

document.addEventListener("DOMContentLoaded", () => {
    protegerRuta(["PARTICIPAR_PRODE", "ADMIN_NEGOCIO", "ADMIN_SEGURIDAD"]);
    inicializarEncabezadosComunes();
    cargarPantallaProde();
});

function inicializarEncabezadosComunes() {
    const username = localStorage.getItem("username") || "Usuario";
    const lbl = document.getElementById("lblUsername");
    if (lbl) lbl.textContent = username;
    if (typeof renderizarMenuPrincipal === "function") renderizarMenuPrincipal();
}

async function cargarPantallaProde() {
    const contenedor = document.getElementById("panel-fixture");
    const errorDiv = document.getElementById("fixture-error");
    
    try {
        const token = localStorage.getItem("token");

        const [resPartidos, resMisPronosticos] = await Promise.all([
            fetch(API_PARTIDOS, { headers: { "Authorization": `Bearer ${token}` } }),
            fetch(`${API_PRONOSTICOS}/MisPronosticos`, { headers: { "Authorization": `Bearer ${token}` } })
        ]);
        
        if (resPartidos.status === 401 || resMisPronosticos.status === 401) {
            manejarSesionExpirada();
            return;
        }

        if (!resPartidos.ok || !resMisPronosticos.ok) throw new Error();

        const partidos = await resPartidos.json();
        const misPronosticos = await resMisPronosticos.json();

        contenedor.innerHTML = "";

        if (partidos.length === 0) {
            contenedor.innerHTML = `
                <div class="loading-state-card">
                    <i class="fa-solid fa-calendar-xmark loading-spinner-icon"></i>
                    <p class="texto-bloqueado celda-centrada">No hay partidos programados en el fixture de esta jornada.</p>
                </div>
            `;
            return;
        }

        partidos.forEach(partido => {
            const jugadaPrevia = misPronosticos.find(up => up.partidoId === partido.id);
            const tarjeta = crearTarjetaPartido(partido, jugadaPrevia);
            contenedor.appendChild(tarjeta);
        });

    } catch (err) {
        errorDiv.textContent = "No se pudo conectar con el servidor de pronósticos.";
        errorDiv.classList.add("display-block");
        contenedor.innerHTML = `
            <div class="loading-state-card">
                <i class="fa-solid fa-triangle-exclamation loading-spinner-icon"></i>
                <p class="texto-bloqueado celda-centrada">El servicio de apuestas no se encuentra disponible.</p>
            </div>
        `;
    }
}

function crearTarjetaPartido(p, jugada) {
    const div = document.createElement("div");
    div.className = "partido-card-premium";

    const fechaObj = new Date(p.fechaHora);
    const fechaTexto = fechaObj.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    
    const esBloqueado = p.estado !== "Pendiente" || new Date() >= fechaObj;

    const golesLocalVal = jugada ? jugada.golesLocal : (esBloqueado ? p.golesLocal : 0);
    const golesVisitanteVal = jugada ? jugada.golesVisitante : (esBloqueado ? p.golesVisitante : 0);

    let estadoBadge = `<span class="badge-status-prode badge-status-available">DISPONIBLE</span>`;
    let botonHtml = `<button class="btn btn-success" onclick="enviarPronostico(${p.id}, this)"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>`;

    if (esBloqueado) {
        if (p.estado === "Finalizado") {
            estadoBadge = `<span class="badge-status-prode badge-status-finalized">FINALIZADO (${p.golesLocal}-${p.golesVisitante})</span>`;
        } else {
            estadoBadge = `<span class="badge-status-prode badge-status-closed">CERRADO</span>`;
        }
        botonHtml = `<span class="texto-bloqueado"><i class="fa-solid fa-lock"></i> No modificable</span>`;
    }

    div.innerHTML = `
        <div class="partido-info-meta-row">
            <span class="partido-fecha-badge"><i class="fa-solid fa-calendar-day"></i> ${fechaTexto}</span>
            ${estadoBadge}
        </div>
        <div class="partido-equipos-vs-grid">
            <div class="equipo-voto-bloque-premium local">
                <span class="nombre-equipo-prode-bold">${p.equipoLocal.nombre}</span>
                <input type="number" id="local-${p.id}" class="input-goles-prode-circle" min="0" value="${golesLocalVal}" ${esBloqueado ? 'disabled' : ''}>
            </div>
            <span class="vs-separador-circle">vs</span>
            <div class="equipo-voto-bloque-premium visitante">
                <input type="number" id="visitante-${p.id}" class="input-goles-prode-circle" min="0" value="${golesVisitanteVal}" ${esBloqueado ? 'disabled' : ''}>
                <span class="nombre-equipo-prode-bold">${p.equipoVisitante.nombre}</span>
            </div>
        </div>
        <div class="partido-acciones-prode-footer">
            ${botonHtml}
        </div>
    `;

    return div;
}

async function enviarPronostico(partidoId, boton) {
    const errorDiv = document.getElementById("fixture-error");
    errorDiv.classList.remove("display-block");

    const golesLocal = parseInt(document.getElementById(`local-${partidoId}`).value);
    const golesVisitante = parseInt(document.getElementById(`visitante-${partidoId}`).value);

    if (isNaN(golesLocal) || isNaN(golesVisitante) || golesLocal < 0 || golesVisitante < 0) {
        alert("Por favor ingrese marcadores válidos.");
        return;
    }

    boton.disabled = true;
    const botonOriginalContent = boton.innerHTML;
    boton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Enviando...`;

    try {
        const token = localStorage.getItem("token");
        const response = await fetch(API_PRONOSTICOS, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ partidoId, golesLocal, golesVisitante })
        });

        if (response.status === 401) {
            manejarSesionExpirada();
            return;
        }

        if (response.ok) {
            alert("Pronóstico guardado correctamente.");
        } else {
            const result = await response.json();
            errorDiv.textContent = result.message;
            errorDiv.classList.add("display-block");
        }
    } catch (err) {
        errorDiv.textContent = "Error al intentar registrar el pronóstico en el servidor.";
        errorDiv.classList.add("display-block");
    } finally {
        boton.disabled = false;
        boton.innerHTML = botonOriginalContent;
    }
}