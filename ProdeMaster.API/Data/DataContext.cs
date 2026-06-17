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
            // 1. Seed de Privilegios (Mapeamos los permisos requeridos por el sistema)
            var privAdminSeguridad = new Privilege { Id = 1, Description = "ADMIN_SEGURIDAD" };
            var privAdminNegocio = new Privilege { Id = 2, Description = "ADMIN_NEGOCIO" };
            var privParticiparProde = new Privilege { Id = 3, Description = "PARTICIPAR_PRODE" };

            modelBuilder.Entity<Privilege>().HasData(
                privAdminSeguridad,
                privAdminNegocio,
                privParticiparProde
            );

            // 2. Generar Hash y Salt criptográfico para el usuario Administrador inicial (Contraseña: admin123)
            string passwordPlana = "admin123";
            string passwordHash;
            string passwordSalt;

            using (var hmac = new HMACSHA512())
            {
                passwordSalt = Convert.ToBase64String(hmac.Key);
                passwordHash = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(passwordPlana)));
            }

            // 3. Seed del Usuario Administrador
            var adminUser = new User
            {
                Id = 1,
                UserName = "admin",
                Salt = passwordSalt,
                PasswordHash = passwordHash
            };

            modelBuilder.Entity<User>().HasData(adminUser);

            // 4. Vincular al Administrador con sus privilegios en la tabla intermedia
            modelBuilder.Entity<UserPrivilege>().HasData(
                new UserPrivilege { Id = 1, UserId = 1, PrivilegeId = 1 }, // ADMIN_SEGURIDAD
                new UserPrivilege { Id = 2, UserId = 1, PrivilegeId = 2 }  // ADMIN_NEGOCIO
            );
        }
    }
}