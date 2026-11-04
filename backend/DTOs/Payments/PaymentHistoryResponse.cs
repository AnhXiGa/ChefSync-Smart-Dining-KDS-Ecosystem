namespace backend.DTOs.Payments;

public sealed class PaymentHistoryResponse
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string TableNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? TransactionCode { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
