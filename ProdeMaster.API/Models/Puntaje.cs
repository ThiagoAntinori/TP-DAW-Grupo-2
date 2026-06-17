using System;

namespace ProdeMaster.API.Models
{
    public class Puntaje
    {
        public int Id { get; set; }
        public int UsuarioId { get; set; }
        public int PuntosTotales { get; set; } = 0;
        public int AciertosExactos { get; set; } = 0;

        public User? Usuario { get; set; }
    }
}