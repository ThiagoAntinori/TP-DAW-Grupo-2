using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProdeMaster.API.Data;
using System.Linq;
using System.Threading.Tasks;

namespace ProdeMaster.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RankingController : ControllerBase
    {
        private readonly DataContext _context;

        public RankingController(DataContext context)
        {
            _context = context;
        }

        // GET: api/Ranking
        [HttpGet]
        public async Task<IActionResult> ObtenerRankingGlobal()
        {
            var posiciones = await _context.Puntajes
                .Include(p => p.Usuario)
                .OrderByDescending(p => p.PuntosTotales)
                .ThenByDescending(p => p.AciertosExactos)
                .Select(p => new
                {
                    Usuario = p.Usuario != null ? p.Usuario.UserName : "Anónimo",
                    Puntos = p.PuntosTotales,
                    Plenos = p.AciertosExactos
                })
                .ToListAsync();

            return Ok(posiciones);
        }
    }
}