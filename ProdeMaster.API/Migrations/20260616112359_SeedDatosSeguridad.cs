using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ProdeMaster.API.Migrations
{
    /// <inheritdoc />
    public partial class SeedDatosSeguridad : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Privileges",
                columns: new[] { "Id", "Description" },
                values: new object[,]
                {
                    { 1, "ADMIN_SEGURIDAD" },
                    { 2, "ADMIN_NEGOCIO" },
                    { 3, "PARTICIPAR_PRODE" }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "PasswordHash", "Salt", "UserName" },
                values: new object[] { 1, "79xh/2dupKgeYYOMqj9F3vVD9G/8/Dkqmg8QpYZS5KoendcDio8PWWAnoK+VXmz2Kc6Ms65p0dOWqHGeetDWEw==", "aUJFXU52QxHD6iWZZK6k4Pv7S5SN3ewMjzbpT+JaavEUf2/HoqNqL8IKbW3uP/ab4gDnkk3/woRcb5g8jBCLhksiuYItiwyjkzlYCEEeB9LsdGlLxiE5FVTlQVl7KKF7MzPzbEaktMoELjC+YL8ZXD+1NKe00C2P0en3gO6lroE=", "admin" });

            migrationBuilder.InsertData(
                table: "UsersPrivileges",
                columns: new[] { "Id", "PrivilegeId", "UserId" },
                values: new object[,]
                {
                    { 1, 1, 1 },
                    { 2, 2, 1 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Privileges",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "UsersPrivileges",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "UsersPrivileges",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Privileges",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Privileges",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1);
        }
    }
}
