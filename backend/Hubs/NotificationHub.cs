using backend.Data;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Hubs;

public sealed class NotificationHub(AppDbContext context) : Hub
{
    public async Task JoinUserNotifications(int userId)
    {
        if (userId <= 0 ||
            !await context.Users.AnyAsync(
                user => user.Id == userId,
                Context.ConnectionAborted))
        {
            throw new HubException("Không tìm thấy người dùng.");
        }

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            GetUserGroup(userId),
            Context.ConnectionAborted);
    }

    public Task LeaveUserNotifications(int userId)
    {
        if (userId <= 0)
            throw new HubException("Mã người dùng không hợp lệ.");

        return Groups.RemoveFromGroupAsync(
            Context.ConnectionId,
            GetUserGroup(userId),
            Context.ConnectionAborted);
    }

    public static string GetUserGroup(int userId) => $"user:{userId}";
}
