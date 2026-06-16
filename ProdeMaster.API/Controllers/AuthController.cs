using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProdeMaster.API.Data;
using ProdeMaster.API.Models;
using ProdeMaster.API.Services;
using System;
using System.Threading.Tasks;

namespace ProdeMaster.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(DataContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public class LoginRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users
                .Include(u => u.UserPrivileges)
                .ThenInclude(up => up.Privilege)
                .FirstOrDefaultAsync(u => u.UserName == request.Username);

            if (user == null)
                return BadRequest(new { message = "El usuario o la contraseña son incorrectos." });

            bool passwordCorrecto = AuthService.VerificarPasswordHash(
                request.Password, 
                user.PasswordHash, 
                user.Salt
            );

            if (!passwordCorrecto)
                return BadRequest(new { message = "El usuario o la contraseña son incorrectos." });

            string claveSecreta = _configuration.GetSection("AppSettings:TokenSecreto").Value 
                ?? throw new InvalidOperationException("La clave secreta no fue configurada.");

            string tokenRealJWT = AuthService.CrearTokenJWT(user, claveSecreta);

            var nuevoRefreshToken = AuthService.GenerarRefreshToken(user.Id);
            
            var tokensViejos = _context.RefreshTokens.Where(rt => rt.UserId == user.Id);
            _context.RefreshTokens.RemoveRange(tokensViejos);

            await _context.RefreshTokens.AddAsync(nuevoRefreshToken);
            await _context.SaveChangesAsync();

            return Ok(new {
                token = tokenRealJWT,
                refreshToken = nuevoRefreshToken.Token,
                username = user.UserName
            });
        }
    }
}