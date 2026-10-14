namespace backend.DTOs.Orders;

public class OrderResponse
{
    public int Id { get; set; }

    public string OrderCode { get; set; } = string.Empty;

    public int TableId { get; set; }

    public string TableNumber { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public decimal Subtotal { get; set; }

    public decimal Discount { get; set; }

    public decimal Tax { get; set; }

    public decimal TotalAmount { get; set; }

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public List<OrderItemResponse> Items { get; set; }
        = new();
}