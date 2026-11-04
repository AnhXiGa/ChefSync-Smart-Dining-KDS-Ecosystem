using backend.Data;
using backend.DTOs.Kds;
using backend.Hubs;
using backend.Models;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public sealed class KdsService(
    AppDbContext context,
    IHubContext<OrderHub> orderHub) : IKdsService
{
    private static readonly string[] ActiveOrderStatuses =
    [
        "Pending",
        "Confirmed",
        "Preparing",
        "Ready"
    ];

    private static readonly string[] ItemStatuses =
    [
        "Pending",
        "Accepted",
        "Preparing",
        "Ready",
        "Served"
    ];

    public async Task<IReadOnlyList<KdsOrderResponse>> GetOrdersAsync(
        CancellationToken cancellationToken)
    {
        var orders = await context.Orders
            .AsNoTracking()
            .Where(order => ActiveOrderStatuses.Contains(order.Status))
            .Include(order => order.Table)
            .Include(order => order.OrderItems)
            .OrderBy(order => order.CreatedAt)
            .ToListAsync(cancellationToken);

        return orders
            .Select(order => new KdsOrderResponse(
                order.Id,
                order.OrderCode,
                order.TableId,
                order.Table.TableNumber,
                order.Status,
                order.Note,
                AsUtcOffset(order.CreatedAt),
                order.OrderItems
                    .OrderBy(item => item.CreatedAt)
                    .Select(item => MapOrderItem(item, order))
                    .ToList()))
            .ToList();
    }

    public async Task<IReadOnlyList<KdsOrderItemResponse>> GetOrderItemsAsync(
        string? status,
        CancellationToken cancellationToken)
    {
        var query = context.OrderItems
            .AsNoTracking()
            .Where(item => ActiveOrderStatuses.Contains(item.Order.Status))
            .Include(item => item.Order)
                .ThenInclude(order => order.Table)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalizedStatus = NormalizeStatus(status);
            if (!ItemStatuses.Contains(normalizedStatus))
                throw new ArgumentException("Trạng thái món không hợp lệ.");

            query = query.Where(item => item.Status == normalizedStatus);
        }

        var items = await query
            .OrderBy(item => item.Order.CreatedAt)
            .ThenBy(item => item.CreatedAt)
            .ToListAsync(cancellationToken);

        return items.Select(item => MapOrderItem(item, item.Order)).ToList();
    }

    public async Task<KdsOrderItemResponse?> UpdateItemStatusAsync(
        int itemId,
        string targetStatus,
        CancellationToken cancellationToken)
    {
        var item = await context.OrderItems
            .Include(orderItem => orderItem.Order)
                .ThenInclude(order => order.Table)
            .FirstOrDefaultAsync(
                orderItem => orderItem.Id == itemId,
                cancellationToken);

        if (item is null)
            return null;

        if (!ActiveOrderStatuses.Contains(item.Order.Status))
            throw new InvalidOperationException(
                "Không thể cập nhật món thuộc đơn hàng đã kết thúc.");

        var normalizedTarget = NormalizeStatus(targetStatus);
        var expectedStatus = normalizedTarget switch
        {
            "Accepted" => "Pending",
            "Preparing" => "Accepted",
            "Ready" => "Preparing",
            "Served" => "Ready",
            _ => throw new ArgumentException(
                "Trạng thái đích không hợp lệ.")
        };

        if (item.Status != expectedStatus && item.Status != normalizedTarget)
        {
            throw new InvalidOperationException(
                $"Không thể chuyển món từ {item.Status} sang {normalizedTarget}.");
        }

        if (item.Status != normalizedTarget)
        {
            item.Status = normalizedTarget;
            var now = DateTime.UtcNow;

            if (normalizedTarget == "Preparing")
                item.StartedAt = now;
            else if (normalizedTarget == "Ready")
                item.ReadyAt = now;

            await context.SaveChangesAsync(cancellationToken);
        }

        var response = MapOrderItem(item, item.Order);
        await Task.WhenAll(
            orderHub.Clients
                .Group(OrderHub.GetOrderGroup(item.OrderId))
                .SendAsync(
                    "OrderItemStatusChanged",
                    response,
                    cancellationToken),
            orderHub.Clients
                .Group(OrderHub.KitchenGroupName)
                .SendAsync(
                    "OrderItemStatusChanged",
                    response,
                    cancellationToken));

        return response;
    }

    public async Task<KdsSummaryResponse> GetSummaryAsync(
        CancellationToken cancellationToken)
    {
        var activeOrders = await context.Orders
            .CountAsync(
                order => ActiveOrderStatuses.Contains(order.Status),
                cancellationToken);

        var counts = await context.OrderItems
            .Where(item => ActiveOrderStatuses.Contains(item.Order.Status))
            .GroupBy(item => item.Status)
            .Select(group => new
            {
                Status = group.Key,
                Count = group.Count()
            })
            .ToDictionaryAsync(
                item => item.Status,
                item => item.Count,
                cancellationToken);

        return new KdsSummaryResponse(
            activeOrders,
            GetCount(counts, "Pending"),
            GetCount(counts, "Accepted"),
            GetCount(counts, "Preparing"),
            GetCount(counts, "Ready"),
            GetCount(counts, "Served"));
    }

    private static KdsOrderItemResponse MapOrderItem(
        OrderItem item,
        Order order) =>
        new(
            item.Id,
            item.OrderId,
            order.OrderCode,
            order.Table.TableNumber,
            item.ProductId,
            item.ProductName,
            item.Quantity,
            item.Note,
            item.Status,
            AsUtcOffset(item.CreatedAt),
            item.StartedAt.HasValue
                ? AsUtcOffset(item.StartedAt.Value)
                : null,
            item.ReadyAt.HasValue
                ? AsUtcOffset(item.ReadyAt.Value)
                : null);

    private static DateTimeOffset AsUtcOffset(DateTime value) =>
        new(DateTime.SpecifyKind(value, DateTimeKind.Utc));

    private static string NormalizeStatus(string status) =>
        status.Trim().ToUpperInvariant() switch
        {
            "PENDING" => "Pending",
            "ACCEPTED" => "Accepted",
            "PREPARING" => "Preparing",
            "READY" => "Ready",
            "SERVED" => "Served",
            _ => status.Trim()
        };

    private static int GetCount(
        IReadOnlyDictionary<string, int> counts,
        string status) =>
        counts.TryGetValue(status, out var count) ? count : 0;
}
