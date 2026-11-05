namespace backend.DTOs.Notifications;

/// <summary>Represents a notification belonging to a user.</summary>
public sealed record NotificationResponse(
    int Id,
    int? UserId,
    string Title,
    string Message,
    string Type,
    string? ReferenceType,
    int? ReferenceId,
    bool IsRead,
    DateTimeOffset? ReadAt,
    DateTimeOffset CreatedAt,
    int? TableId);

public sealed record NotificationPageResponse(
    IReadOnlyList<NotificationResponse> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages,
    int UnreadCount);
