using backend.Data;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Hubs;

public sealed class OrderHub(AppDbContext context) : Hub
{
    public const string KitchenGroupName = "kitchen";
    public const string PosGroupName = "pos";

    public async Task JoinOrder(int orderId)
    {
        if (orderId <= 0 ||
            !await context.Orders.AnyAsync(
                order => order.Id == orderId,
                Context.ConnectionAborted))
        {
            throw new HubException("Không tìm thấy đơn hàng.");
        }

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            GetOrderGroup(orderId),
            Context.ConnectionAborted);
    }

    public Task LeaveOrder(int orderId)
    {
        if (orderId <= 0)
            throw new HubException("Mã đơn hàng không hợp lệ.");

        return Groups.RemoveFromGroupAsync(
            Context.ConnectionId,
            GetOrderGroup(orderId),
            Context.ConnectionAborted);
    }

    public Task JoinKitchen() =>
        Groups.AddToGroupAsync(
            Context.ConnectionId,
            KitchenGroupName,
            Context.ConnectionAborted);

    public Task LeaveKitchen() =>
        Groups.RemoveFromGroupAsync(
            Context.ConnectionId,
            KitchenGroupName,
            Context.ConnectionAborted);

    public Task JoinPos() =>
        Groups.AddToGroupAsync(
            Context.ConnectionId,
            PosGroupName,
            Context.ConnectionAborted);

    public Task LeavePos() =>
        Groups.RemoveFromGroupAsync(
            Context.ConnectionId,
            PosGroupName,
            Context.ConnectionAborted);

    public async Task JoinTable(string qrToken)
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

    public Task LeaveTable(int tableId)
    {
        if (tableId <= 0)
            throw new HubException("Mã bàn không hợp lệ.");

        return Groups.RemoveFromGroupAsync(
            Context.ConnectionId,
            GetTableGroup(tableId),
            Context.ConnectionAborted);
    }

    public static string GetOrderGroup(int orderId) => $"order:{orderId}";

    public static string GetTableGroup(int tableId) => $"table:{tableId}";
}
