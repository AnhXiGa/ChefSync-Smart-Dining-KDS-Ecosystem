namespace backend.Models;

public class Payment
{
    public int Id { get; set; }

    public int OrderId { get; set; }

    // Số tiền cần thanh toán
    public decimal Amount { get; set; }

    // Cash / BankTransfer
    public string PaymentMethod { get; set; } = "Cash";

    // Pending / Paid / Cancelled
    public string Status { get; set; } = "Pending";

    // =========================
    // CASH PAYMENT
    // =========================

    // Tiền khách đưa
    public decimal? ReceivedAmount { get; set; }

    // Tiền thối
    public decimal? ChangeAmount { get; set; }

    // =========================
    // BANK TRANSFER
    // =========================

    // Mã giao dịch ngân hàng
    public string? TransactionCode { get; set; }

    // Nội dung chuyển khoản
    public string? TransferContent { get; set; }

    // URL QR động
    public string? QrCodeUrl { get; set; }

    // =========================

    public DateTime? PaidAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Order Order { get; set; } = null!;
}