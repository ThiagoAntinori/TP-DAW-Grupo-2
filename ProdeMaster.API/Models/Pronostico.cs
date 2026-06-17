namespace ProdeMaster.API.Models
{
    public class Pronostico
    {
        public int Id { get; set; }
        public int UsuarioId { get; set; }
        public int PartidoId { get; set; }
        public int GolesLocal { get; set; }
        public int GolesVisitante { get; set; }
        public bool Procesado { get; set; } = false;

        public User? Usuario { get; set; }
        public Partido? Partido { get; set; }
    }
}