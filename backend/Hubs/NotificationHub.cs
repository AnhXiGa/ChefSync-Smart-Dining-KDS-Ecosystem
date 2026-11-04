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

    public async Task JoinCustomerNotifications(string qrToken)
    {
        if (!Guid.TryParse(qrToken, out var token))
            throw new HubException("Mã QR không hợp lệ.");

        var tableId = await context.RestaurantTables
            .Where(table => table.QrToken == token)
            .Select(table => (int?)table.Id)
            .FirstOrDefaultAsync(Context.ConnectionAborted);

        if (tableId is null)
            throw new HubException("Không tìm thấy bàn.");

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            GetTableGroup(tableId.Value),
            Context.ConnectionAborted);
    }

    public Task LeaveCustomerNotifications(int tableId)
    {
        if (tableId <= 0)
            throw new HubException("Mã bàn không hợp lệ.");

        return Groups.RemoveFromGroupAsync(
            Context.ConnectionId,
            GetTableGroup(tableId),
            Context.ConnectionAborted);
    }

    public static string GetUserGroup(int userId) => $"user:{userId}";

    public static string GetTableGroup(int tableId) => $"table:{tableId}";
}
