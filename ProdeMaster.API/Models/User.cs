namespace ProdeMaster.API.Models
{
    public class User
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Salt { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;

        public ICollection<UserPrivilege> UserPrivileges { get; set; } = new List<UserPrivilege>();
        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    }
}