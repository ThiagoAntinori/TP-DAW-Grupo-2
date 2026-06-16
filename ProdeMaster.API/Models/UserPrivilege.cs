namespace ProdeMaster.API.Models
{
    public class UserPrivilege
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int PrivilegeId { get; set; }

        public User? User { get; set; }
        public Privilege? Privilege { get; set; }
    }
}