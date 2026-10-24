using backend.DTOs.Notifications;

namespace backend.Services.Interfaces;

public interface INotificationService
{
    Task<IReadOnlyList<NotificationResponse>> GetNotificationsAsync(
        int userId,
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
}
