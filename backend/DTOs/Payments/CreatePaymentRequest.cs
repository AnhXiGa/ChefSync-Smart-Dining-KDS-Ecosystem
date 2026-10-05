namespace backend.DTOs.Payments;

public class CreatePaymentRequest
{
    public int OrderId { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;

    // Chỉ sử dụng khi PaymentMethod = Cash
    public decimal? ReceivedAmount { get; set; }
}