namespace backend.DTOs.Kds;

/// <summary>Summarizes active kitchen orders and item counts by status.</summary>
public sealed record KdsSummaryResponse(
    int ActiveOrders,
    int PendingItems,
    int AcceptedItems,
    int PreparingItems,
    int ReadyItems,
    int ServedItems);
