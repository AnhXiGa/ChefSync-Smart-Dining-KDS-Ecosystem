using backend.DTOs.Payments;

namespace backend.Services.Interfaces;

public interface IPaymentService
{
    Task<PaymentResponse> CreatePaymentAsync(
        CreatePaymentRequest request);

    Task<PaymentResponse?> GetByIdAsync(int id);

    Task<PaymentResponse?> GetByOrderIdAsync(int orderId);

    Task<List<PaymentHistoryResponse>> GetHistoryAsync();

    Task<PaymentResponse> ConfirmCashPaymentAsync(int paymentId);

    Task<bool> CancelPaymentAsync(int paymentId);

    Task<bool> ProcessSePayWebhookAsync(
        SePayWebhookRequest request);
}