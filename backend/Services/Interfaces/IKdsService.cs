using backend.DTOs.Kds;

namespace backend.Services.Interfaces;

public interface IKdsService
{
    Task<IReadOnlyList<KdsOrderResponse>> GetOrdersAsync(
        CancellationToken cancellationToken);

    Task<IReadOnlyList<KdsOrderItemResponse>> GetOrderItemsAsync(
        string? status,
        CancellationToken cancellationToken);

    Task<KdsOrderItemResponse?> UpdateItemStatusAsync(
        int itemId,
        string targetStatus,
        CancellationToken cancellationToken);

    Task<KdsSummaryResponse> GetSummaryAsync(
        CancellationToken cancellationToken);
}
