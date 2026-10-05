using backend.DTOs.Orders;

namespace backend.Services.Interfaces;

public interface IOrderService
{
    Task<OrderResponse> CreateOrderAsync(CreateOrderRequest request);

    Task<OrderResponse?> GetByIdAsync(int id);

    Task<List<OrderResponse>> GetAllAsync();

    Task<List<OrderResponse>> GetByTableIdAsync(int tableId);

    Task<OrderResponse> UpdateStatusAsync(
        int orderId,
        UpdateOrderStatusRequest request);

    Task<OrderResponse> TransferTableAsync(
        int orderId,
        TransferTableRequest request);

    Task<OrderResponse> MergeOrdersAsync(
        MergeOrderRequest request);

    Task<OrderResponse> SplitOrderAsync(
        int orderId,
        SplitOrderRequest request);

    Task<bool> CancelOrderAsync(int orderId);
}