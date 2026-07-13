using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ProdeMaster.API.Data;
using ProdeMaster.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProdeMaster.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EquipoController : ControllerBase
    {
        private readonly DataContext _context;

        public EquipoController(DataContext context)
        {
            _context = context;
        }

        // POST: api/Equipo
        [HttpPost]
        [Authorize(Roles = "ADMIN_NEGOCIO")]
        public async Task<IActionResult> CrearEquipo([FromBody] Equipo equipo)
        {
            if (equipo == null)
                return BadRequest(new { message = "Los datos del equipo no son válidos." });

            if (string.IsNullOrWhiteSpace(equipo.Nombre))
                return BadRequest(new { message = "El nombre del equipo es obligatorio." });

            var nombreNormalizado = equipo.Nombre.Trim().ToUpper();
            var existe = await _context.Equipos.AnyAsync(e => e.Nombre.ToUpper() == nombreNormalizado);
            
            if (existe)
                return BadRequest(new { message = "Ya existe un equipo registrado con ese nombre." });

            equipo.Nombre = equipo.Nombre.Trim();
            if (!string.IsNullOrEmpty(equipo.Abreviatura))
                equipo.Abreviatura = equipo.Abreviatura.Trim().ToUpper();

            await _context.Equipos.AddAsync(equipo);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Equipo creado con éxito.", id = equipo.Id });
        }

        // GET: api/Equipo
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Equipo>>> ObtenerEquipos()
        {
            var equipos = await _context.Equipos
                .OrderBy(e => e.Nombre)
                .ToListAsync();

            return Ok(equipos);
        }

        // GET: api/Equipo/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Equipo>> ObtenerEquipoPorId(int id)
        {
            var equipo = await _context.Equipos.FindAsync(id);

            if (equipo == null)
                return NotFound(new { message = "El equipo solicitado no existe." });

            return Ok(equipo);
        }

        // PUT: api/Equipo/5
        [HttpPut("{id}")]
        [Authorize(Roles = "ADMIN_NEGOCIO")]
        public async Task<IActionResult> ActualizarEquipo(int id, [FromBody] Equipo equipo)
        {
            if (id != equipo.Id)
                return BadRequest(new { message = "El ID del parámetro no coincide con el del equipo." });

            if (string.IsNullOrWhiteSpace(equipo.Nombre))
                return BadRequest(new { message = "El nombre del equipo no puede estar vacío." });

            var equipoDb = await _context.Equipos.FindAsync(id);
            if (equipoDb == null)
                return NotFound(new { message = "Equipo no encontrado." });

            var nombreNormalizado = equipo.Nombre.Trim().ToUpper();
            var existeDuplicado = await _context.Equipos
                .AnyAsync(e => e.Nombre.ToUpper() == nombreNormalizado && e.Id != id);

            if (existeDuplicado)
                return BadRequest(new { message = "Ya existe otro equipo registrado con ese mismo nombre." });

            equipoDb.Nombre = equipo.Nombre.Trim();
            equipoDb.Abreviatura = !string.IsNullOrEmpty(equipo.Abreviatura) ? equipo.Abreviatura.Trim().ToUpper() : equipoDb.Abreviatura;
            equipoDb.EscudoUrl = !string.IsNullOrEmpty(equipo.EscudoUrl) ? equipo.EscudoUrl.Trim() : equipoDb.EscudoUrl;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return StatusCode(500, new { message = "Error de concurrencia al actualizar los datos." });
            }

            return Ok(new { message = "Equipo actualizado correctamente." });
        }

        // DELETE: api/Equipo/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "ADMIN_NEGOCIO")]
        public async Task<IActionResult> EliminarEquipo(int id)
        {
            var equipo = await _context.Equipos.FindAsync(id);
            if (equipo == null)
                return NotFound(new { message = "El equipo no existe." });

            var estaEnPartidos = await _context.Partidos
                .AnyAsync(p => p.EquipoLocalId == id || p.EquipoVisitanteId == id);

            if (estaEnPartidos)
            {
                return BadRequest(new { 
                    message = "No se puede eliminar el equipo porque ya cuenta con partidos asignados en el fixture." 
                });
            }

            _context.Equipos.Remove(equipo);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Equipo eliminado correctamente del sistema." });
        }
    }
}