namespace backend.DTOs.Orders;

public class MergeOrderRequest
{
    public int TargetOrderId { get; set; }

    public List<int> SourceOrderIds { get; set; }
        = new();
}