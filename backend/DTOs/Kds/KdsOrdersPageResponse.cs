namespace backend.DTOs.Kds;

public sealed record KdsOrdersPageResponse(
    IReadOnlyList<KdsOrderResponse> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages);
