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
    public async Task<NotificationPageResponse> GetNotificationsAsync(
        int userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var notificationsQuery = context.Notifications
            .AsNoTracking()
            .Where(notification =>
                notification.UserId == userId &&
                notification.CreatedAt >= DateTime.UtcNow.AddDays(-7));
        var totalCount = await notificationsQuery.CountAsync(cancellationToken);
        var unreadCount = await notificationsQuery.CountAsync(
            notification => !notification.IsRead,
            cancellationToken);
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        var currentPage = Math.Min(page, Math.Max(totalPages, 1));
        var notifications = await notificationsQuery
            .OrderByDescending(notification => notification.CreatedAt)
            .ThenByDescending(notification => notification.Id)
            .Skip((currentPage - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new NotificationPageResponse(
            notifications.Select(Map).ToList(),
            currentPage,
            pageSize,
            totalCount,
            totalPages,
            unreadCount);
    }

    public async Task<IReadOnlyList<NotificationResponse>> GetCustomerNotificationsAsync(
        int tableId,
        CancellationToken cancellationToken)
    {
        var notifications = await context.Notifications
            .AsNoTracking()
            .Where(notification =>
                notification.TableId == tableId &&
                notification.CreatedAt >= DateTime.UtcNow.AddDays(-7))
            .OrderByDescending(notification => notification.CreatedAt)
            .Take(50)
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

    public async Task<NotificationResponse?> MarkCustomerNotificationAsReadAsync(
        int id,
        int tableId,
        CancellationToken cancellationToken)
    {
        var notification = await context.Notifications
            .FirstOrDefaultAsync(
                item => item.Id == id && item.TableId == tableId,
                cancellationToken);

        if (notification is null)
            return null;

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await context.SaveChangesAsync(cancellationToken);
            await NotifyTableAsync(
                tableId,
                "read",
                [notification.Id],
                cancellationToken);
        }

        return Map(notification);
    }

    public async Task<NotificationResponse> CreateForTableAsync(
        int tableId,
        string title,
        string message,
        string type,
        string? referenceType,
        int? referenceId,
        CancellationToken cancellationToken)
    {
        var notification = new Notification
        {
            TableId = tableId,
            Title = title,
            Message = message,
            Type = type,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            CreatedAt = DateTime.UtcNow
        };
        context.Notifications.Add(notification);
        await context.SaveChangesAsync(cancellationToken);

        var response = Map(notification);
        await notificationHub.Clients
            .Group(NotificationHub.GetTableGroup(tableId))
            .SendAsync(
                "NotificationsChanged",
                new { action = "created", notification = response },
                cancellationToken);
        return response;
    }

    public async Task CreateForRolesAsync(
        IReadOnlyCollection<string> roleNames,
        string title,
        string message,
        string type,
        string? referenceType,
        int? referenceId,
        CancellationToken cancellationToken)
    {
        if (roleNames.Count == 0)
            return;

        var userIds = await context.Users
            .Where(user => user.IsActive &&
                user.UserRoles.Any(userRole => roleNames.Contains(userRole.Role.Name)))
            .Select(user => user.Id)
            .Distinct()
            .ToArrayAsync(cancellationToken);

        if (userIds.Length == 0)
            return;

        var notifications = userIds.Select(userId => new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            CreatedAt = DateTime.UtcNow
        }).ToArray();

        context.Notifications.AddRange(notifications);
        await context.SaveChangesAsync(cancellationToken);

        await Task.WhenAll(userIds.Select(userId => notificationHub.Clients
            .Group(NotificationHub.GetUserGroup(userId))
            .SendAsync(
                "NotificationsChanged",
                new { action = "created" },
                cancellationToken)));
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

    private Task NotifyTableAsync(
        int tableId,
        string action,
        int[] notificationIds,
        CancellationToken cancellationToken) =>
        notificationHub.Clients
            .Group(NotificationHub.GetTableGroup(tableId))
            .SendAsync(
                "NotificationsChanged",
                new { action, notificationIds },
                cancellationToken);

    private static NotificationResponse Map(Notification notification) =>
        new(
            notification.Id,
            notification.UserId,
            notification.Title,
            notification.Message,
            notification.Type,
            notification.ReferenceType,
            notification.ReferenceId,
            notification.IsRead,
            notification.ReadAt.HasValue
                ? AsUtcOffset(notification.ReadAt.Value)
                : null,
            AsUtcOffset(notification.CreatedAt),
            notification.TableId);

    private static DateTimeOffset AsUtcOffset(DateTime value) =>
        new(DateTime.SpecifyKind(value, DateTimeKind.Utc));
}
