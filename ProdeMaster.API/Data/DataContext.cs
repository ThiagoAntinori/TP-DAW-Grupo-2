using Microsoft.EntityFrameworkCore;
using ProdeMaster.API.Models;
using System.Security.Cryptography;
using System.Text;

namespace ProdeMaster.API.Data
{
    public class DataContext : DbContext
    {
        public DataContext(DbContextOptions<DataContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Privilege> Privileges => Set<Privilege>();
        public DbSet<UserPrivilege> UsersPrivileges => Set<UserPrivilege>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
        public DbSet<Equipo> Equipos => Set<Equipo>();
        public DbSet<Partido> Partidos => Set<Partido>();
        public DbSet<Pronostico> Pronosticos => Set<Pronostico>();
        public DbSet<Puntaje> Puntajes => Set<Puntaje>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<Partido>()
                .HasOne(p => p.EquipoLocal)
                .WithMany()
                .HasForeignKey(p => p.EquipoLocalId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Partido>()
                .HasOne(p => p.EquipoVisitante)
                .WithMany()
                .HasForeignKey(p => p.EquipoVisitanteId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Pronostico>()
                .HasOne(p => p.Partido)
                .WithMany()
                .HasForeignKey(p => p.PartidoId)
                .OnDelete(DeleteBehavior.Restrict);
            var privAdminSeguridad = new Privilege { Id = 1, Description = "ADMIN_SEGURIDAD" };
            var privAdminNegocio = new Privilege { Id = 2, Description = "ADMIN_NEGOCIO" };
            var privParticiparProde = new Privilege { Id = 3, Description = "PARTICIPAR_PRODE" };

            modelBuilder.Entity<Privilege>().HasData(
                privAdminSeguridad,
                privAdminNegocio,
                privParticiparProde
            );

            string passwordPlana = "admin123";
            string passwordHash;
            string passwordSalt;

            using (var hmac = new HMACSHA512())
            {
                passwordSalt = Convert.ToBase64String(hmac.Key);
                passwordHash = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(passwordPlana)));
            }

            var adminUser = new User
            {
                Id = 1,
                UserName = "admin",
                Salt = passwordSalt,
                PasswordHash = passwordHash
            };

            modelBuilder.Entity<User>().HasData(adminUser);

            modelBuilder.Entity<UserPrivilege>().HasData(
                new UserPrivilege { Id = 1, UserId = 1, PrivilegeId = 1 },
                new UserPrivilege { Id = 2, UserId = 1, PrivilegeId = 2 }
            );
        }
    }
}