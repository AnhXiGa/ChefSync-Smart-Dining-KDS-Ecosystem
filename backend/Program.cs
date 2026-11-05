using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Configuration;
using backend.Hubs;
using backend.Services.Implementations;
using backend.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// =====================================================
// DATABASE
// =====================================================

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration
            .GetConnectionString("DefaultConnection")
    )
);

// =====================================================
// CONTROLLERS
// =====================================================

builder.Services.AddControllers();
builder.Services.AddSignalR();

// =====================================================
// SWAGGER
// =====================================================

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// =====================================================
// CORS
// =====================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:3000",
                "http://172.20.10.2:5173"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// =====================================================
// PAYMENT CONFIGURATION
// =====================================================

builder.Services.Configure<PaymentOptions>(
    builder.Configuration
        .GetSection("Payment")
);

// =====================================================
// SERVICES
// =====================================================

builder.Services.AddScoped<IPaymentService, PaymentService>();

builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IKdsService, KdsService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddHostedService<NotificationCleanupService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();

// =====================================================
// BUILD
// =====================================================

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await context.Database.MigrateAsync();
    await AccountSeeder.SeedManagerAsync(scope.ServiceProvider);
    await SmartPosSeeder.SeedAsync(context);
    await SmartPosSeeder.SeedPurchaseOrdersAsync(context);
    await SmartPosSeeder.SeedInventoryTransactionsAsync(context);
    await SmartPosSeeder.SeedFinancialReportDataAsync(context);
}

// =====================================================
// SWAGGER
// =====================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// =====================================================
// HTTPS
// =====================================================

app.UseHttpsRedirection();

// =====================================================
// CORS
// =====================================================

app.UseCors("AllowReact");

// =====================================================
// AUTHORIZATION
// =====================================================

app.UseAuthorization();

// =====================================================
// CONTROLLERS
// =====================================================

app.MapControllers();
app.MapHub<OrderHub>("/hubs/orders");
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();
