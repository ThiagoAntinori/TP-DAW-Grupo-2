namespace ProdeMaster.API.Models
{
    public class Partido
    {
        public int Id { get; set; }
        public int EquipoLocalId { get; set; }
        public int EquipoVisitanteId { get; set; }
        public DateTime FechaHora { get; set; }
        public int GolesLocal { get; set; }
        public int GolesVisitante { get; set; }
        public string Estado { get; set; } = string.Empty;

        public Equipo? EquipoLocal { get; set; }
        public Equipo? EquipoVisitante { get; set; }
    }
}