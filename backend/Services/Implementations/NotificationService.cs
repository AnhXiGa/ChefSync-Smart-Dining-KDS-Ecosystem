using backend.Data;
using backend.DTOs.Notifications;
using backend.Hubs;
using backend.Models;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public sealed class NotificationService(
    AppDbContext context,
    IHubContext<NotificationHub> notificationHub)
    : INotificationService
{
    public async Task<IReadOnlyList<NotificationResponse>> GetNotificationsAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        var notifications = await context.Notifications
            .AsNoTracking()
            .Where(notification => notification.UserId == userId)
            .OrderByDescending(notification => notification.CreatedAt)
            .ToListAsync(cancellationToken);

        return notifications.Select(Map).ToList();
    }

    public async Task<NotificationResponse?> GetNotificationAsync(
        int id,
        int userId,
        CancellationToken cancellationToken)
    {
        var notification = await context.Notifications
            .AsNoTracking()
            .FirstOrDefaultAsync(
                item => item.Id == id && item.UserId == userId,
                cancellationToken);

        return notification is null ? null : Map(notification);
    }

    public async Task<NotificationResponse?> MarkAsReadAsync(
        int id,
        int userId,
        CancellationToken cancellationToken)
    {
        var notification = await context.Notifications
            .FirstOrDefaultAsync(
                item => item.Id == id && item.UserId == userId,
                cancellationToken);

        if (notification is null)
            return null;

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await context.SaveChangesAsync(cancellationToken);
            await NotifyUserAsync(
                userId,
                "read",
                [notification.Id],
                cancellationToken);
        }

        return Map(notification);
    }

    public async Task<int> MarkAllAsReadAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        var unreadNotifications = await context.Notifications
            .Where(notification =>
                notification.UserId == userId &&
                !notification.IsRead)
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow;
        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
            notification.ReadAt = now;
        }

        if (unreadNotifications.Count > 0)
        {
            await context.SaveChangesAsync(cancellationToken);
            await NotifyUserAsync(
                userId,
                "read-all",
                unreadNotifications.Select(item => item.Id).ToArray(),
                cancellationToken);
        }

        return unreadNotifications.Count;
    }

    public async Task<bool> DeleteNotificationAsync(
        int id,
        int userId,
        CancellationToken cancellationToken)
    {
        var notification = await context.Notifications
            .FirstOrDefaultAsync(
                item => item.Id == id && item.UserId == userId,
                cancellationToken);

        if (notification is null)
            return false;

        context.Notifications.Remove(notification);
        await context.SaveChangesAsync(cancellationToken);
        await NotifyUserAsync(
            userId,
            "deleted",
            [notification.Id],
            cancellationToken);
        return true;
    }

    private Task NotifyUserAsync(
        int userId,
        string action,
        int[] notificationIds,
        CancellationToken cancellationToken) =>
        notificationHub.Clients
            .Group(NotificationHub.GetUserGroup(userId))
            .SendAsync(
                "NotificationsChanged",
                new { action, notificationIds },
                cancellationToken);

    private static NotificationResponse Map(Notification notification) =>
        new(
            notification.Id,
            notification.UserId!.Value,
            notification.Title,
            notification.Message,
            notification.Type,
            notification.ReferenceType,
            notification.ReferenceId,
            notification.IsRead,
            notification.ReadAt.HasValue
                ? AsUtcOffset(notification.ReadAt.Value)
                : null,
            AsUtcOffset(notification.CreatedAt));

    private static DateTimeOffset AsUtcOffset(DateTime value) =>
        new(DateTime.SpecifyKind(value, DateTimeKind.Utc));
}
