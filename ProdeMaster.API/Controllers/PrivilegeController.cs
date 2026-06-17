using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProdeMaster.API.Data;
using ProdeMaster.API.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProdeMaster.API.Controllers
{
    [ApiController]
    [Route("api/Usuarios/privilegios")]
    public class PrivilegeController : ControllerBase
    {
        private readonly DataContext _context;

        public PrivilegeController(DataContext context)
        {
            _context = context;
        }

        public class CrearPrivilegioDto
        {
            public string Description { get; set; } = string.Empty;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Privilege>>> GetPrivilegios()
        {
            var privilegios = await _context.Privileges.ToListAsync();
            return Ok(privilegios);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Privilege>> GetPrivilegio(int id)
        {
            var privilegio = await _context.Privileges.FindAsync(id);

            if (privilegio == null)
                return NotFound(new { message = "Privilegio no encontrado." });

            return Ok(privilegio);
        }

        [HttpGet("buscar")]
        public async Task<ActionResult<IEnumerable<Privilege>>> BuscarPrivilegios([FromQuery] string search)
        {
            if (string.IsNullOrEmpty(search))
            {
                return Ok(await _context.Privileges.ToListAsync());
            }

            var resultados = await _context.Privileges
                .Where(p => p.Description.Contains(search))
                .ToListAsync();

            return Ok(resultados);
        }

        [HttpPost]
        public async Task<IActionResult> CrearPrivilegio([FromBody] CrearPrivilegioDto dto)
        {
            var existe = await _context.Privileges.AnyAsync(p => p.Description == dto.Description);
            if (existe)
                return BadRequest(new { message = "El privilegio ya se encuentra registrado." });

            var nuevoPrivilegio = new Privilege
            {
                Description = dto.Description
            };

            await _context.Privileges.AddAsync(nuevoPrivilegio);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Privilegio creado exitosamente." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> EditarPrivilegio(int id, [FromBody] CrearPrivilegioDto dto)
        {
            var privilegio = await _context.Privileges.FindAsync(id);

            if (privilegio == null)
                return NotFound(new { message = "Privilegio no encontrado." });

            var existe = await _context.Privileges.AnyAsync(p => p.Description == dto.Description && p.Id != id);
            if (existe)
                return BadRequest(new { message = "Ya existe otro privilegio con esa misma descripción." });

            privilegio.Description = dto.Description;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Privilegio actualizado con éxito." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarPrivilegio(int id)
        {
            if (id == 1 || id == 2 || id == 3)
                return BadRequest(new { message = "No se pueden eliminar los privilegios base del sistema." });

            var privilegio = await _context.Privileges.FindAsync(id);
            if (privilegio == null)
                return NotFound(new { message = "Privilegio no encontrado." });

            var asignado = await _context.UsersPrivileges.AnyAsync(up => up.PrivilegeId == id);
            if (asignado)
                return BadRequest(new { message = "No se puede eliminar el privilegio porque está asignado a uno o más usuarios." });

            _context.Privileges.Remove(privilegio);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Privilegio eliminado correctamente." });
        }
    }
}