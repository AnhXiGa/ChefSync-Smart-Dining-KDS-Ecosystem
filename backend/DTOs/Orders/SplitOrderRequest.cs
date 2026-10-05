namespace backend.DTOs.Orders;

public class SplitOrderRequest
{
    public int TargetTableId { get; set; }

    public string? Note { get; set; }

    public List<SplitOrderItemRequest> Items { get; set; }
        = new();
}