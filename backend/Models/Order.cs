namespace backend.Models;

public class Order
{
    public int Id { get; set; }

    public string OrderCode { get; set; } = string.Empty;

    public int TableId { get; set; }

    public string Status { get; set; } = "Pending";

    public decimal Subtotal { get; set; }

    public decimal Discount { get; set; }

    public decimal Tax { get; set; }

    public decimal TotalAmount { get; set; }

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    // Navigation
    public RestaurantTable Table { get; set; } = null!;

    public ICollection<OrderItem> OrderItems { get; set; }
        = new List<OrderItem>();

    public ICollection<Payment> Payments { get; set; }
        = new List<Payment>();
}