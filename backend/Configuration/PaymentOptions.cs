namespace backend.Configuration;

public class PaymentOptions
{
    public string BankCode { get; set; } = string.Empty;

    public string BankAccount { get; set; } = string.Empty;

    public string AccountName { get; set; } = string.Empty;

    public string SePayWebhookSecret { get; set; } = string.Empty;
}