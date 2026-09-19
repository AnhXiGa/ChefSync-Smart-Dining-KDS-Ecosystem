namespace backend.Models;

public class UserRole
{
    public int UserId { get; set; }

    public int RoleId { get; set; }

    // Navigation
    public User User { get; set; } = null!;

    public Role Role { get; set; } = null!;
}