namespace backend.DTOs.Kds;

/// <summary>Represents an order item shown on the kitchen display.</summary>
public sealed record KdsOrderItemResponse(
    int Id,
    int OrderId,
    string OrderCode,
    string TableNumber,
    int ProductId,
    string ProductName,
    int Quantity,
    string? Note,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? StartedAt,
    DateTimeOffset? ReadyAt);
