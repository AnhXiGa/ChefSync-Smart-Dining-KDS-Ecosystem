namespace backend.Configuration;

public class PaymentOptions
{
    public string SePayApiUrl { get; set; } = string.Empty;

    public string SePayWebhookUrl { get; set; } = string.Empty;

    public string SePayAccessToken { get; set; } = string.Empty;

    public string BankCode { get; set; } = string.Empty;

    public string BankAccount { get; set; } = string.Empty;

    public string AccountName { get; set; } = string.Empty;

    public string SePayWebhookSecret { get; set; } = string.Empty;
}