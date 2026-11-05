using backend.DTOs.Notifications;

namespace backend.Services.Interfaces;

public interface INotificationService
{
    Task<NotificationPageResponse> GetNotificationsAsync(
        int userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<NotificationResponse?> GetNotificationAsync(
        int id,
        int userId,
        CancellationToken cancellationToken);

    Task<NotificationResponse?> MarkAsReadAsync(
        int id,
        int userId,
        CancellationToken cancellationToken);

    Task<int> MarkAllAsReadAsync(
        int userId,
        CancellationToken cancellationToken);

    Task<bool> DeleteNotificationAsync(
        int id,
        int userId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<NotificationResponse>> GetCustomerNotificationsAsync(
        int tableId,
        CancellationToken cancellationToken);

    Task<NotificationResponse?> MarkCustomerNotificationAsReadAsync(
        int id,
        int tableId,
        CancellationToken cancellationToken);

    Task<NotificationResponse> CreateForTableAsync(
        int tableId,
        string title,
        string message,
        string type,
        string? referenceType,
        int? referenceId,
        CancellationToken cancellationToken);

    Task CreateForRolesAsync(
        IReadOnlyCollection<string> roleNames,
        string title,
        string message,
        string type,
        string? referenceType,
        int? referenceId,
        CancellationToken cancellationToken);
}
