using Microsoft.EntityFrameworkCore;
using ProdeMaster.API.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Agregar soporte para Controladores y Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 2. Configurar el contexto de SQL Server apuntando a tu Base de Datos local
builder.Services.AddDbContext<DataContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 3. Habilitar CORS para que tu Frontend en HTML/JS (puro) pueda consultar la API sin bloqueos
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configurar el pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(); // Esto te abrirá la interfaz de Swagger en el navegador
}

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

app.Run();