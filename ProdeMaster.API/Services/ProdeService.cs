using Microsoft.EntityFrameworkCore;
using ProdeMaster.API.Data;
using ProdeMaster.API.Models;
using System.Linq;
using System.Threading.Tasks;

namespace ProdeMaster.API.Services
{
    public class ProdeService
    {
        private readonly DataContext _context;

        public ProdeService(DataContext context)
        {
            _context = context;
        }

        public async Task ProcesarPuntajesPartido(int partidoId)
        {
            var partido = await _context.Partidos.FindAsync(partidoId);
            if (partido == null || partido.Estado != "Finalizado") return;

            var pronosticos = await _context.Pronosticos
                .Where(p => p.PartidoId == partidoId && !p.Procesado)
                .ToListAsync();

            if (!pronosticos.Any()) return;

            foreach (var pronostico in pronosticos)
            {
                int puntosGanados = 0;
                bool esAciertoExacto = false;

                int diferenciaReal = partido.GolesLocal - partido.GolesVisitante;
                int diferenciaPronostico = pronostico.GolesLocal - pronostico.GolesVisitante;

                if (pronostico.GolesLocal == partido.GolesLocal && pronostico.GolesVisitante == partido.GolesVisitante)
                {
                    puntosGanados = 3;
                    esAciertoExacto = true;
                }
                else if ((diferenciaReal > 0 && diferenciaPronostico > 0) || 
                         (diferenciaReal < 0 && diferenciaPronostico < 0) || 
                         (diferenciaReal == 0 && diferenciaPronostico == 0))
                {
                    puntosGanados = 1;
                }

                var puntajeUsuario = await _context.Puntajes
                    .FirstOrDefaultAsync(p => p.UsuarioId == pronostico.UsuarioId);

                if (puntajeUsuario == null)
                {
                    puntajeUsuario = new Puntaje
                    {
                        UsuarioId = pronostico.UsuarioId,
                        PuntosTotales = puntosGanados,
                        AciertosExactos = esAciertoExacto ? 1 : 0
                    };
                    await _context.Puntajes.AddAsync(puntajeUsuario);
                }
                else
                {
                    puntajeUsuario.PuntosTotales += puntosGanados;
                    if (esAciertoExacto)
                    {
                        puntajeUsuario.AciertosExactos += 1;
                    }
                }

                pronostico.Procesado = true;
            }

            await _context.SaveChangesAsync();
        }
    }
}