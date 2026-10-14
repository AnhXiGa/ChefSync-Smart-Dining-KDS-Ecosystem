namespace backend.DTOs.Orders;

public class CreateOrderRequest
{
    public int TableId { get; set; }

    public string? Note { get; set; }

    public decimal Discount { get; set; } = 0;

    public decimal Tax { get; set; } = 0;

    public List<CreateOrderItemRequest> Items { get; set; }
        = new();
}