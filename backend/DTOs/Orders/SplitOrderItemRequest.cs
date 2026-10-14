namespace backend.DTOs.Orders;

public class SplitOrderItemRequest
{
    public int OrderItemId { get; set; }

    public int Quantity { get; set; }
}