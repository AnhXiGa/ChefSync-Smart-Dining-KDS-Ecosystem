namespace backend.DTOs.Kds;

/// <summary>Represents an active order and its items for the kitchen display.</summary>
public sealed record KdsOrderResponse(
    int Id,
    string OrderCode,
    int TableId,
    string TableNumber,
    string Status,
    string? Note,
    DateTimeOffset CreatedAt,
    IReadOnlyList<KdsOrderItemResponse> Items);
