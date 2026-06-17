using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProdeMaster.API.Data;
using ProdeMaster.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProdeMaster.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PronosticoController : ControllerBase
    {
        private readonly DataContext _context;

        public PronosticoController(DataContext context)
        {
            _context = context;
        }

        public class GuardarPronosticoDto
        {
            public int PartidoId { get; set; }
            public int GolesLocal { get; set; }
            public int GolesVisitante { get; set; }
        }

        // POST: api/Pronostico
        [HttpPost]
        public async Task<IActionResult> GuardarPronostico([FromBody] GuardarPronosticoDto dto)
        {
            var usuarioIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioIdClaim) || !int.TryParse(usuarioIdClaim, out int usuarioId))
            {
                return Unauthorized(new { message = "Usuario no válido o sesión expirada." });
            }

            var partido = await _context.Partidos.FindAsync(dto.PartidoId);
            if (partido == null)
                return NotFound(new { message = "El partido especificado no existe." });

            if (partido.Estado != "Pendiente" || partido.FechaHora <= DateTime.Now)
            {
                return BadRequest(new { message = "El tiempo para registrar o modificar este pronóstico ha expirado." });
            }

            var pronosticoDb = await _context.Pronosticos
                .FirstOrDefaultAsync(p => p.UsuarioId == usuarioId && p.PartidoId == dto.PartidoId);

            if (pronosticoDb == null)
            {
                var nuevoPronostico = new Pronostico
                {
                    UsuarioId = usuarioId,
                    PartidoId = dto.PartidoId,
                    GolesLocal = dto.GolesLocal,
                    GolesVisitante = dto.GolesVisitante,
                    Procesado = false
                };
                await _context.Pronosticos.AddAsync(nuevoPronostico);
            }
            else
            {
                pronosticoDb.GolesLocal = dto.GolesLocal;
                pronosticoDb.GolesVisitante = dto.GolesVisitante;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Pronóstico guardado correctamente." });
        }

        [HttpGet("MisPronosticos")]
        public async Task<ActionResult<IEnumerable<object>>> ObtenerMisPronosticos()
        {
            var usuarioIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(usuarioIdClaim) || !int.TryParse(usuarioIdClaim, out int usuarioId))
            {
                return Unauthorized(new { message = "Usuario no válido." });
            }

            var pronosticos = await _context.Pronosticos
                .Where(p => p.UsuarioId == usuarioId)
                .Select(p => new
                {
                    p.PartidoId,
                    p.GolesLocal,
                    p.GolesVisitante
                })
                .ToListAsync();

            return Ok(pronosticos);
        }
    }
}