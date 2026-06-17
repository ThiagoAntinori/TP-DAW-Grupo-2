const API_PARTIDOS = "http://localhost:5097/api/Partido";
const API_PRONOSTICOS = "http://localhost:5097/api/Pronostico";

document.addEventListener("DOMContentLoaded", () => {
    protegerRuta(["PARTICIPAR_PRODE", "ADMIN_NEGOCIO", "ADMIN_SEGURIDAD"]);
    cargarPantallaProde();
});

async function cargarPantallaProde() {
    const contenedor = document.getElementById("panel-fixture");
    const errorDiv = document.getElementById("fixture-error");
    
    try {
        const token = localStorage.getItem("token");

        const [resPartidos, resMisPronosticos] = await Promise.all([
            fetch(API_PARTIDOS, { headers: { "Authorization": `Bearer ${token}` } }),
            fetch(`${API_PRONOSTICOS}/MisPronosticos`, { headers: { "Authorization": `Bearer ${token}` } })
        ]);

        if (!resPartidos.ok || !resMisPronosticos.ok) throw new Error("Error al recuperar catálogos.");

        const partidos = await resPartidos.json();
        const misPronosticos = await resMisPronosticos.ok ? await resMisPronosticos.json() : [];

        contenedor.innerHTML = "";

        if (partidos.length === 0) {
            contenedor.innerHTML = `<p class="texto-bloqueado celda-centrada">No hay partidos agendados en el fixture para esta temporada.</p>`;
            return;
        }

        partidos.forEach(partido => {
            const jugadaPrevia = misPronosticos.find(up => up.partidoId === partido.id);
            
            const tarjeta = crearTarjetaPartido(partido, jugadaPrevia);
            contenedor.appendChild(tarjeta);
        });

    } catch (err) {
        errorDiv.textContent = "Incapacidad para conectar con el motor de apuestas.";
        errorDiv.style.display = "block";
        contenedor.innerHTML = `<p class="texto-bloqueado celda-centrada">Servicio temporalmente interrumpido.</p>`;
    }
}

function crearTarjetaPartido(p, jugada) {
    const div = document.createElement("div");
    div.className = "partido-card";

    const fechaObj = new Date(p.fechaHora);
    const fechaTexto = fechaObj.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    
    const esBloqueado = p.estado !== "Pendiente" || new Date() >= fechaObj;

    const golesLocalVal = jugada ? jugada.golesLocal : (esBloqueado ? p.golesLocal : 0);
    const golesVisitanteVal = jugada ? jugada.golesVisitante : (esBloqueado ? p.golesVisitante : 0);

    let estadoBadge = `<span class="badge badge-user">DISPONIBLE</span>`;
    let botonHtml = `<button class="btn-guardar-prode" onclick="enviarPronostico(${p.id}, this)">Guardar</button>`;

    if (esBloqueado) {
        estadoBadge = p.estado === "Finalizado" 
            ? `<span class="badge badge-admin">FINALIZADO (${p.golesLocal}-${p.golesVisitante})</span>` 
            : `<span class="badge" style="background-color:#64748b; color:white;">CERRADO</span>`;
        botonHtml = `<span class="texto-bloqueado">No modificable</span>`;
    }

    div.innerHTML = `
        <div class="partido-info-meta">
            <span class="fecha">📅 ${fechaTexto}</span>
            ${estadoBadge}
        </div>
        <div class="partido-equipos-layout">
            <div class="equipo-voto-bloque local">
                <span class="nombre-equipo-prode">${p.equipoLocal.nombre}</span>
                <input type="number" id="local-${p.id}" class="input-goles-prode" min="0" value="${golesLocalVal}" ${esBloqueado ? 'disabled' : ''}>
            </div>
            <span class="vs-separador">vs</span>
            <div class="equipo-voto-bloque visitante">
                <input type="number" id="visitante-${p.id}" class="input-goles-prode" min="0" value="${golesVisitanteVal}" ${esBloqueado ? 'disabled' : ''}>
                <span class="nombre-equipo-prode">${p.equipoVisitante.nombre}</span>
            </div>
        </div>
        <div class="partido-acciones-prode">
            ${botonHtml}
        </div>
    `;

    return div;
}

async function enviarPronostico(partidoId, boton) {
    const errorDiv = document.getElementById("fixture-error");
    errorDiv.style.display = "none";

    const golesLocal = parseInt(document.getElementById(`local-${partidoId}`).value);
    const golesVisitante = parseInt(document.getElementById(`visitante-${partidoId}`).value);

    if (isNaN(golesLocal) || isNaN(golesVisitante) || golesLocal < 0 || golesVisitante < 0) {
        alert("Por favor ingrese marcadores válidos (mayores o iguales a 0).");
        return;
    }

    boton.disabled = true;
    boton.textContent = "Enviando...";

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

        const result = await response.json();

        if (response.ok) {
            alert(result.message || "Pronóstico almacenado.");
        } else {
            errorDiv.textContent = result.message;
            errorDiv.style.display = "block";
        }
    } catch (err) {
        errorDiv.textContent = "Fallo de comunicación con los servicios del Prode.";
        errorDiv.style.display = "block";
    } finally {
        boton.disabled = false;
        boton.textContent = "Guardar";
    }
}