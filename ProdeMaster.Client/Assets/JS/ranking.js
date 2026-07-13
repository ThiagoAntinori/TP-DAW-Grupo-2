const API_RANKING = "https://prodemaster-api.runasp.net/api/Ranking";

document.addEventListener("DOMContentLoaded", () => {
    protegerRuta(["PARTICIPAR_PRODE", "ADMIN_NEGOCIO", "ADMIN_SEGURIDAD"]);
    cargarTablaRanking();
});

async function cargarTablaRanking() {
    const tbody = document.querySelector("#tblRanking tbody");
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(API_RANKING, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error();
        const datos = await response.json();
        tbody.innerHTML = "";

        if (datos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="texto-bloqueado celda-centrada">Aún no se han computado puntos en el torneo.</td></tr>`;
            return;
        }

        datos.forEach((fila, indice) => {
            const tr = document.createElement("tr");
            const puesto = indice + 1;
            
            let puestoHtml = `<span class="puesto-podio">${puesto}º</span>`;
            if (puesto === 1) puestoHtml = `<span class="puesto-podio puesto-oro"><i class="fa-solid fa-award"></i> 1º</span>`;
            if (puesto === 2) puestoHtml = `<span class="puesto-podio puesto-plata"><i class="fa-solid fa-award"></i> 2º</span>`;
            if (puesto === 3) puestoHtml = `<span class="puesto-podio puesto-bronce"><i class="fa-solid fa-award"></i> 3º</span>`;

            tr.innerHTML = `
                <td class="celda-centrada">${puestoHtml}</td>
                <td><strong>${fila.usuario}</strong></td>
                <td class="celda-centrada"><span class="badge">${fila.plenos}</span></td>
                <td class="puntos-destacados">${fila.puntos} pts</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" class="texto-bloqueado celda-centrada">Error al sincronizar el ranking con la base de datos.</td></tr>`;
    }
}