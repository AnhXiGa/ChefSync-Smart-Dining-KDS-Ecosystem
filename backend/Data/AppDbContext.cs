using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    // =====================================================
    // DBSETS
    // =====================================================

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<Notification> Notifications => Set<Notification>();

    public DbSet<RestaurantTable> RestaurantTables => Set<RestaurantTable>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Ingredient> Ingredients => Set<Ingredient>();
    public DbSet<ProductIngredient> ProductIngredients => Set<ProductIngredient>();

    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    public DbSet<InventoryTransaction> InventoryTransactions
        => Set<InventoryTransaction>();

    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<PurchaseOrderItem> PurchaseOrderItems
        => Set<PurchaseOrderItem>();

    public DbSet<Payment> Payments => Set<Payment>();


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);


        // =====================================================
        // USERS
        // =====================================================

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.FullName)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.Email)
                .HasMaxLength(150)
                .IsRequired();

            entity.HasIndex(x => x.Email)
                .IsUnique();

            entity.Property(x => x.PasswordHash)
                .IsRequired();

            entity.Property(x => x.Phone)
                .HasMaxLength(20);

            entity.Property(x => x.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
        });


        // =====================================================
        // ROLES
        // =====================================================

        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("Roles");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(x => x.Description)
                .HasMaxLength(255);

            entity.HasIndex(x => x.Name)
                .IsUnique();
        });


        // =====================================================
        // USER ROLES
        // =====================================================

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.ToTable("UserRoles");

            entity.HasKey(x => new
            {
                x.UserId,
                x.RoleId
            });

            entity.HasOne(x => x.User)
                .WithMany(x => x.UserRoles)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Role)
                .WithMany(x => x.UserRoles)
                .HasForeignKey(x => x.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.ToTable("RolePermissions");

            entity.HasKey(x => new
            {
                x.RoleId,
                x.PermissionKey
            });

            entity.Property(x => x.PermissionKey)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(x => x.AccessLevel)
                .HasMaxLength(20)
                .IsRequired();

            entity.HasOne(x => x.Role)
                .WithMany(x => x.Permissions)
                .HasForeignKey(x => x.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
        });


        // =====================================================
        // NOTIFICATIONS
        // =====================================================

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("Notifications");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(x => x.Message)
                .HasMaxLength(1000)
                .IsRequired();

            entity.Property(x => x.Type)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(x => x.ReferenceType)
                .HasMaxLength(50);

            entity.Property(x => x.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(x => x.User)
                .WithMany(x => x.Notifications)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(x => x.TableId);
        });


        // =====================================================
        // RESTAURANT TABLES
        // =====================================================

        modelBuilder.Entity<RestaurantTable>(entity =>
        {
            entity.ToTable("RestaurantTables");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.TableNumber)
                .HasMaxLength(20)
                .IsRequired();

            entity.HasIndex(x => x.TableNumber)
                .IsUnique();

            entity.Property(x => x.Capacity)
                .IsRequired();

            entity.Property(x => x.Status)
                .HasMaxLength(30)
                .IsRequired();

            entity.HasIndex(x => x.QrToken)
                .IsUnique();

            entity.Property(x => x.QrToken)
                .HasDefaultValueSql("gen_random_uuid()");

            entity.Property(x => x.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
        });


        // =====================================================
        // CATEGORIES
        // =====================================================

        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("Categories");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.Description)
                .HasMaxLength(500);
        });


        // =====================================================
        // PRODUCTS
        // =====================================================

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("Products");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.Description)
                .HasMaxLength(1000);

            entity.Property(x => x.Price)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(x => x.ImageUrl)
                .HasMaxLength(500);

            entity.HasOne(x => x.Category)
                .WithMany(x => x.Products)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        // =====================================================
        // INGREDIENTS
        // =====================================================

        modelBuilder.Entity<Ingredient>(entity =>
        {
            entity.ToTable("Ingredients");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.Unit)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(x => x.CurrentStock)
                .HasPrecision(18, 3)
                .IsRequired();

            entity.Property(x => x.MinStock)
                .HasPrecision(18, 3)
                .IsRequired();

            entity.Property(x => x.CostPerUnit)
                .HasPrecision(18, 2)
                .IsRequired();
        });


        // =====================================================
        // PRODUCT INGREDIENTS
        // =====================================================

        modelBuilder.Entity<ProductIngredient>(entity =>
        {
            entity.ToTable("ProductIngredients");

            entity.HasKey(x => new
            {
                x.ProductId,
                x.IngredientId
            });

            entity.Property(x => x.Quantity)
                .HasPrecision(18, 3)
                .IsRequired();

            entity.HasOne(x => x.Product)
                .WithMany(x => x.ProductIngredients)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Ingredient)
                .WithMany(x => x.ProductIngredients)
                .HasForeignKey(x => x.IngredientId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        // =====================================================
        // ORDERS
        // =====================================================

        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("Orders");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.OrderCode)
                .HasMaxLength(50)
                .IsRequired();

            entity.HasIndex(x => x.OrderCode)
                .IsUnique();

            entity.Property(x => x.Status)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(x => x.Subtotal)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(x => x.Discount)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(x => x.Tax)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(x => x.TotalAmount)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(x => x.Note)
                .HasMaxLength(500);

            entity.HasOne(x => x.Table)
                .WithMany(x => x.Orders)
                .HasForeignKey(x => x.TableId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.Property(x => x.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
        });


        // =====================================================
        // ORDER ITEMS
        // =====================================================

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("OrderItems");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.ProductName)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.Quantity)
                .IsRequired();

            entity.Property(x => x.UnitPrice)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(x => x.Subtotal)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(x => x.Note)
                .HasMaxLength(500);

            entity.Property(x => x.Status)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(x => x.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(x => x.Order)
                .WithMany(x => x.OrderItems)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Product)
                .WithMany(x => x.OrderItems)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        // =====================================================
        // INVENTORY TRANSACTIONS
        // =====================================================

        modelBuilder.Entity<InventoryTransaction>(entity =>
        {
            entity.ToTable("InventoryTransactions");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Type)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(x => x.Quantity)
                .HasPrecision(18, 3)
                .IsRequired();

            entity.Property(x => x.BeforeStock)
                .HasPrecision(18, 3)
                .IsRequired();

            entity.Property(x => x.AfterStock)
                .HasPrecision(18, 3)
                .IsRequired();

            entity.Property(x => x.ReferenceType)
                .HasMaxLength(50);

            entity.Property(x => x.Note)
                .HasMaxLength(500);

            entity.HasOne(x => x.Ingredient)
                .WithMany(x => x.InventoryTransactions)
                .HasForeignKey(x => x.IngredientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.CreatedByUser)
                .WithMany(x => x.InventoryTransactions)
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });


        // =====================================================
        // SUPPLIERS
        // =====================================================

        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.ToTable("Suppliers");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.Phone)
                .HasMaxLength(20);

            entity.Property(x => x.Email)
                .HasMaxLength(150);

            entity.Property(x => x.Address)
                .HasMaxLength(300);
        });


        // =====================================================
        // PURCHASE ORDERS
        // =====================================================

        modelBuilder.Entity<PurchaseOrder>(entity =>
        {
            entity.ToTable("PurchaseOrders");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.PurchaseCode)
                .HasMaxLength(50)
                .IsRequired();

            entity.HasIndex(x => x.PurchaseCode)
                .IsUnique();

            entity.Property(x => x.Status)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(x => x.TotalAmount)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(x => x.Note)
                .HasMaxLength(500);

            entity.HasOne(x => x.Supplier)
                .WithMany(x => x.PurchaseOrders)
                .HasForeignKey(x => x.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.CreatedByUser)
                .WithMany(x => x.PurchaseOrders)
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        // =====================================================
        // PURCHASE ORDER ITEMS
        // =====================================================

        modelBuilder.Entity<PurchaseOrderItem>(entity =>
        {
            entity.ToTable("PurchaseOrderItems");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Quantity)
                .HasPrecision(18, 3)
                .IsRequired();

            entity.Property(x => x.UnitPrice)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(x => x.Subtotal)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.HasOne(x => x.PurchaseOrder)
                .WithMany(x => x.PurchaseOrderItems)
                .HasForeignKey(x => x.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Ingredient)
                .WithMany(x => x.PurchaseOrderItems)
                .HasForeignKey(x => x.IngredientId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        // =====================================================
        // PAYMENTS
        // =====================================================

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.ToTable("Payments");

            entity.HasKey(x => x.Id);


            // -------------------------------------------------
            // BASIC
            // -------------------------------------------------

            entity.Property(x => x.Amount)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(x => x.PaymentMethod)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(x => x.Status)
                .HasMaxLength(30)
                .IsRequired();


            // -------------------------------------------------
            // CASH PAYMENT
            // -------------------------------------------------

            entity.Property(x => x.ReceivedAmount)
                .HasPrecision(18, 2);

            entity.Property(x => x.ChangeAmount)
                .HasPrecision(18, 2);


            // -------------------------------------------------
            // BANK TRANSFER
            // -------------------------------------------------

            entity.Property(x => x.TransactionCode)
                .HasMaxLength(100);

            entity.Property(x => x.TransferContent)
                .HasMaxLength(200);

            entity.Property(x => x.QrCodeUrl)
                .HasMaxLength(1000);


            // -------------------------------------------------
            // DATETIME
            // -------------------------------------------------

            entity.Property(x => x.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");


            // -------------------------------------------------
            // INDEX
            // -------------------------------------------------

            entity.HasIndex(x => x.TransactionCode)
                .IsUnique();


            // -------------------------------------------------
            // RELATIONSHIP
            // -------------------------------------------------

            entity.HasOne(x => x.Order)
                .WithMany(x => x.Payments)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}