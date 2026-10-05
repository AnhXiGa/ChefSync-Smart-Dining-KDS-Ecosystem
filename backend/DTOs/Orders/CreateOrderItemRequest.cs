namespace backend.DTOs.Orders;

public class CreateOrderItemRequest
{
    public int ProductId { get; set; }

    public int Quantity { get; set; }

    public string? Note { get; set; }
}