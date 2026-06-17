using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProdeMaster.API.Data;
using ProdeMaster.API.Models;
using ProdeMaster.API.Services;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProdeMaster.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly DataContext _context;

        public UsuariosController(DataContext context)
        {
            _context = context;
        }

        public class UserDto
        {
            public int Id { get; set; }
            public string UserName { get; set; } = string.Empty;
            public List<string> Privilegios { get; set; } = new List<string>();
        }

        public class CrearUsuarioDto
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public List<int> PrivilegioIds { get; set; } = new List<int>();
        }

        public class EditarUsuarioDto
        {
            public string Username { get; set; } = string.Empty;
            public List<int> PrivilegioIds { get; set; } = new List<int>();
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsuarios([FromQuery] string? search)
        {
            var query = _context.Users
                .Include(u => u.UserPrivileges)
                .ThenInclude(up => up.Privilege)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(u => u.UserName.Contains(search));
            }

            var usuarios = await query.ToListAsync();

            // Mapeamos las entidades al DTO de salida
            var resultadoDto = usuarios.Select(u => new UserDto
            {
                Id = u.Id,
                UserName = u.UserName,
                Privilegios = u.UserPrivileges
                    .Where(up => up.Privilege != null)
                    .Select(up => up.Privilege!.Description)
                    .ToList()
            });

            return Ok(resultadoDto);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUsuario(int id)
        {
            var user = await _context.Users
                .Include(u => u.UserPrivileges)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                return NotFound(new { message = "Usuario no encontrado." });

            var userDto = new UserDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Privilegios = user.UserPrivileges.Select(up => up.PrivilegeId.ToString()).ToList() // Mandamos los IDs para pre-marcar los checkboxes
            };

            return Ok(userDto);
        }

        [HttpPost]
        public async Task<IActionResult> CrearUsuario([FromBody] CrearUsuarioDto dto)
        {
            var existe = await _context.Users.AnyAsync(u => u.UserName == dto.Username);
            if (existe)
                return BadRequest(new { message = "El nombre de usuario ya se encuentra registrado." });

            AuthService.CrearPasswordHash(dto.Password, out string hash, out string salt);

            var nuevoUsuario = new User
            {
                UserName = dto.Username,
                PasswordHash = hash,
                Salt = salt
            };

            await _context.Users.AddAsync(nuevoUsuario);
            await _context.SaveChangesAsync();

            if (dto.PrivilegioIds != null && dto.PrivilegioIds.Count > 0)
            {
                foreach (var privId in dto.PrivilegioIds)
                {
                    var userPrivilege = new UserPrivilege
                    {
                        UserId = nuevoUsuario.Id,
                        PrivilegeId = privId
                    };
                    await _context.UsersPrivileges.AddAsync(userPrivilege);
                }
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Usuario creado exitosamente." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> EditarUsuario(int id, [FromBody] EditarUsuarioDto dto)
        {
            var user = await _context.Users
                .Include(u => u.UserPrivileges)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                return NotFound(new { message = "Usuario no encontrado." });

            user.UserName = dto.Username;

            var privilegiosViejos = _context.UsersPrivileges.Where(up => up.UserId == id);
            _context.UsersPrivileges.RemoveRange(privilegiosViejos);

            if (dto.PrivilegioIds != null)
            {
                foreach (var privId in dto.PrivilegioIds)
                {
                    _context.UsersPrivileges.Add(new UserPrivilege
                    {
                        UserId = id,
                        PrivilegeId = privId
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Usuario y privilegios actualizados con éxito." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarUsuario(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "Usuario no encontrado." });

            if (id == 1)
                return BadRequest(new { message = "No se puede dar de baja al administrador principal del sistema." });

            var tokensAsociados = _context.RefreshTokens.Where(rt => rt.UserId == id);
            _context.RefreshTokens.RemoveRange(tokensAsociados);

            var privilegiosAsociados = _context.UsersPrivileges.Where(up => up.UserId == id);
            _context.UsersPrivileges.RemoveRange(privilegiosAsociados);

            _context.Users.Remove(user);
            
            await _context.SaveChangesAsync();
            return Ok(new { message = "Usuario eliminado correctamente del sistema." });
        }

        [HttpGet("privilegios")]
        public async Task<ActionResult<IEnumerable<Privilege>>> GetPrivilegios()
        {
            var privilegios = await _context.Privileges.ToListAsync();
            return Ok(privilegios);
        }
    }
}