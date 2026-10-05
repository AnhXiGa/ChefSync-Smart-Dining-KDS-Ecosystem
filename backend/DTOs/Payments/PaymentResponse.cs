namespace backend.DTOs.Payments;

public class PaymentResponse
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    public decimal Amount { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public decimal? ReceivedAmount { get; set; }

    public decimal? ChangeAmount { get; set; }

    public string? TransactionCode { get; set; }

    public string? TransferContent { get; set; }

    public string? QrCodeUrl { get; set; }

    public DateTime? PaidAt { get; set; }

    public DateTime CreatedAt { get; set; }
}