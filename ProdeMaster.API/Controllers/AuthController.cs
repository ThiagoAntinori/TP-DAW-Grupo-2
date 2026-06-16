using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProdeMaster.API.Data;
using ProdeMaster.API.Services; // Importamos el servicio criptográfico

namespace ProdeMaster.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly DataContext _context;

        public AuthController(DataContext context)
        {
            _context = context;
        }

        public class LoginRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // 1. Buscar el usuario en la base de datos por su UserName
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserName == request.Username);

            // 2. Si no existe, rechazamos con un mensaje genérico por seguridad
            if (user == null)
                return BadRequest(new { message = "El usuario o la contraseña son incorrectos." });

            // 3. Validar el Hash usando el Salt almacenado en el registro
            bool passwordCorrecto = AuthService.VerificarPasswordHash(
                request.Password, 
                user.PasswordHash, 
                user.Salt
            );

            if (!passwordCorrecto)
                return BadRequest(new { message = "El usuario o la contraseña son incorrectos." });

            // 4. Generación simulada de Tokens (Próximo paso: implementar JWT real)
            var dummyAccessToken = "access_token_real_user_" + user.Id;
            var dummyRefreshToken = Guid.NewGuid().ToString();

            return Ok(new {
                token = dummyAccessToken,
                refreshToken = dummyRefreshToken,
                username = user.UserName
            });
        }
    }
}