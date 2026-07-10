using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProdeMaster.API.Data;
using ProdeMaster.API.Models;
using ProdeMaster.API.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProdeMaster.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PartidoController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly ProdeService _prodeService;

        public PartidoController(DataContext context, ProdeService prodeService)
        {
            _context = context;
            _prodeService = prodeService;
        }

        public class CrearPartidoDto
        {
            public int EquipoLocalId { get; set; }
            public int EquipoVisitanteId { get; set; }
            public DateTime FechaHora { get; set; }
        }

        public class ResultadoPartidoDto
        {
            public int GolesLocal { get; set; }
            public int GolesVisitante { get; set; }
        }

        // POST: api/Partido
        [HttpPost]
        public async Task<IActionResult> CrearPartido([FromBody] CrearPartidoDto dto)
        {
            if (dto.EquipoLocalId == dto.EquipoVisitanteId)
                return BadRequest(new { message = "Un equipo no puede jugar contra sí mismo." });

            var localExiste = await _context.Equipos.AnyAsync(e => e.Id == dto.EquipoLocalId);
            var visitanteExiste = await _context.Equipos.AnyAsync(e => e.Id == dto.EquipoVisitanteId);

            if (!localExiste || !visitanteExiste)
                return BadRequest(new { message = "Uno o ambos equipos especificados no existen." });

            var nuevoPartido = new Partido
            {
                EquipoLocalId = dto.EquipoLocalId,
                EquipoVisitanteId = dto.EquipoVisitanteId,
                FechaHora = dto.FechaHora,
                GolesLocal = 0,
                GolesVisitante = 0,
                Estado = "Pendiente"
            };

            await _context.Partidos.AddAsync(nuevoPartido);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Partido programado con éxito.", id = nuevoPartido.Id });
        }

        // GET: api/Partido
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Partido>>> ObtenerPartidos()
        {
            var partidos = await _context.Partidos
                .Include(p => p.EquipoLocal)
                .Include(p => p.EquipoVisitante)
                .OrderBy(p => p.FechaHora)
                .ToListAsync();

            return Ok(partidos);
        }

        // GET: api/Partido/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Partido>> ObtenerPartidoPorId(int id)
        {
            var partido = await _context.Partidos
                .Include(p => p.EquipoLocal)
                .Include(p => p.EquipoVisitante)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (partido == null)
                return NotFound(new { message = "El partido solicitado no existe." });

            return Ok(partido);
        }

        // PUT: api/Partido/5
        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarPartido(int id, [FromBody] CrearPartidoDto dto)
        {
            var partidoDb = await _context.Partidos.FindAsync(id);
            if (partidoDb == null)
                return NotFound(new { message = "Partido no encontrado." });

            if (partidoDb.Estado != "Pendiente")
                return BadRequest(new { message = "No se puede modificar un partido que ya comenzó o finalizó." });

            if (dto.EquipoLocalId == dto.EquipoVisitanteId)
                return BadRequest(new { message = "Un equipo no puede jugar contra sí mismo." });

            partidoDb.EquipoLocalId = dto.EquipoLocalId;
            partidoDb.EquipoVisitanteId = dto.EquipoVisitanteId;
            partidoDb.FechaHora = dto.FechaHora;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Datos del partido actualizados correctamente." });
        }

        // POST: api/Partido/5/resultado
        [HttpPost("{id}/resultado")]
        public async Task<IActionResult> CargarResultado(int id, [FromBody] ResultadoPartidoDto dto)
        {
            var partido = await _context.Partidos.FindAsync(id);
            if (partido == null)
                return NotFound(new { message = "Partido no encontrado." });

            partido.GolesLocal = dto.GolesLocal;
            partido.GolesVisitante = dto.GolesVisitante;
            partido.Estado = "Finalizado";

            await _prodeService.ProcesarPuntajesPartido(id);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Resultado registrado y puntos de usuarios procesados con éxito." });
        }

        // DELETE: api/Partido/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarPartido(int id)
        {
            var partido = await _context.Partidos.FindAsync(id);
            if (partido == null)
                return NotFound(new { message = "El partido no existe." });

            var existenPronosticos = await _context.Pronosticos.AnyAsync(pr => pr.PartidoId == id);
            if (existenPronosticos)
                return BadRequest(new { message = "No se puede eliminar el partido porque ya contiene pronósticos de usuarios asociados." });

            _context.Partidos.Remove(partido);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Partido removido del fixture correctamente." });
        }
    }
}