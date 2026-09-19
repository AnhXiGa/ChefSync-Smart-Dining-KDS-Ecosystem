namespace backend.Models;

public class User
{
    public int Id { get; set; }

    public string EmployeeCode { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string? Phone { get; set; }

    public string? Address { get; set; }

    public DateTime? DateOfBirth { get; set; }

    public string? Gender { get; set; }

    public string? AvatarUrl { get; set; }

    public string? Position { get; set; }

    public DateTime? HireDate { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public ICollection<UserRole> UserRoles { get; set; }
        = new List<UserRole>();

    public ICollection<Notification> Notifications { get; set; }
        = new List<Notification>();

    public ICollection<InventoryTransaction> InventoryTransactions { get; set; }
        = new List<InventoryTransaction>();

    public ICollection<PurchaseOrder> PurchaseOrders { get; set; }
        = new List<PurchaseOrder>();
}