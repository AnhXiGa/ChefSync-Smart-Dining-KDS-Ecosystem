using backend.Data;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Hubs;

public sealed class OrderHub(AppDbContext context) : Hub
{
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

    public static string GetOrderGroup(int orderId) => $"order:{orderId}";
}
