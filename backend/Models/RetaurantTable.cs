namespace backend.Models;

public class RestaurantTable
{
    public int Id { get; set; }

    public string TableNumber { get; set; } = string.Empty;

    public int Capacity { get; set; }

    public string Status { get; set; } = "Available";

    public Guid QrToken { get; set; } = Guid.NewGuid();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public DateTime? OccupiedAt { get; set; }

    public DateTime? VacatedAt { get; set; }

    // Navigation
    public ICollection<Order> Orders { get; set; }
        = new List<Order>();
}