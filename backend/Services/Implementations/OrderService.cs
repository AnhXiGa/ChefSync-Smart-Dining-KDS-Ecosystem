using backend.Data;
using backend.DTOs.Orders;
using backend.Hubs;
using backend.Models;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace backend.Services.Implementations;

public class OrderService : IOrderService
{
    private readonly AppDbContext _context;
    private readonly IHubContext<OrderHub> _orderHub;

    public OrderService(
        AppDbContext context,
        IHubContext<OrderHub> orderHub)
    {
        _context = context;
        _orderHub = orderHub;
    }

    // =========================================================
    // CREATE ORDER
    // =========================================================

    public async Task<OrderResponse> CreateOrderAsync(
        CreateOrderRequest request)
    {
        if (request.Items == null ||
            request.Items.Count == 0)
        {
            throw new Exception(
                "Đơn hàng phải có ít nhất một món.");
        }

        var table = await _context.RestaurantTables
            .FirstOrDefaultAsync(x => x.Id == request.TableId);

        if (table == null)
            throw new Exception("Không tìm thấy bàn.");

        if (table.Status == "Maintenance")
            throw new Exception(
                "Bàn đang bảo trì.");

        // Không cho tạo order mới nếu bàn đang có order
        var existingOrder = await _context.Orders
            .AnyAsync(x =>
                x.TableId == request.TableId &&
                x.Status != "Completed" &&
                x.Status != "Cancelled");

        if (existingOrder)
        {
            throw new Exception(
                "Bàn đang có đơn hàng chưa hoàn thành.");
        }

        var productIds = request.Items
            .Select(x => x.ProductId)
            .Distinct()
            .ToList();

        var products = await _context.Products
            .Where(x => productIds.Contains(x.Id))
            .ToListAsync();

        if (products.Count != productIds.Count)
        {
            throw new Exception(
                "Một hoặc nhiều món không tồn tại.");
        }

        var order = new Order
        {
            OrderCode = GenerateOrderCode(),
            TableId = table.Id,
            Status = "Pending",
            Discount = request.Discount,
            Tax = request.Tax,
            Note = request.Note,
            CreatedAt = DateTime.UtcNow
        };

        decimal subtotal = 0;

        foreach (var requestItem in request.Items)
        {
            if (requestItem.Quantity <= 0)
            {
                throw new Exception(
                    "Số lượng món phải lớn hơn 0.");
            }

            var product = products.First(
                x => x.Id == requestItem.ProductId);

            if (!product.IsAvailable)
            {
                throw new Exception(
                    $"Món '{product.Name}' hiện không khả dụng.");
            }

            var itemSubtotal =
                product.Price * requestItem.Quantity;

            var orderItem = new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Quantity = requestItem.Quantity,
                UnitPrice = product.Price,
                Subtotal = itemSubtotal,
                Note = requestItem.Note,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            order.OrderItems.Add(orderItem);

            subtotal += itemSubtotal;
        }

        order.Subtotal = subtotal;

        order.TotalAmount =
            subtotal
            - order.Discount
            + order.Tax;

        if (order.TotalAmount < 0)
        {
            throw new Exception(
                "Tổng tiền đơn hàng không hợp lệ.");
        }

        _context.Orders.Add(order);

        var occupancyStartedAt = DateTime.UtcNow;
        if (table.Status != "Occupied")
        {
            table.OccupiedAt = occupancyStartedAt;
        }

        table.Status = "Occupied";
        table.VacatedAt = null;
        table.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var createdOrder = await GetByIdAsync(order.Id)
            ?? throw new Exception(
                "Không thể lấy đơn hàng vừa tạo.");

        await PublishOrderChangedAsync(createdOrder.Id, createdOrder.TableId);

        return createdOrder;
    }

    // =========================================================
    // GET BY ID
    // =========================================================

    public async Task<OrderResponse?> GetByIdAsync(int id)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .Include(x => x.Table)
            .Include(x => x.OrderItems)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (order == null)
            return null;

        return MapToResponse(order);
    }

    // =========================================================
    // GET ALL
    // =========================================================

    public async Task<List<OrderResponse>> GetAllAsync()
    {
        var orders = await _context.Orders
            .AsNoTracking()
            .Include(x => x.Table)
            .Include(x => x.OrderItems)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return orders
            .Select(MapToResponse)
            .ToList();
    }

    // =========================================================
    // GET BY TABLE
    // =========================================================

    public async Task<List<OrderResponse>> GetByTableIdAsync(
        int tableId)
    {
        var orders = await _context.Orders
            .AsNoTracking()
            .Include(x => x.Table)
            .Include(x => x.OrderItems)
            .Where(x => x.TableId == tableId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return orders
            .Select(MapToResponse)
            .ToList();
    }

    // =========================================================
    // UPDATE STATUS
    // =========================================================

    public async Task<OrderResponse> UpdateStatusAsync(
        int orderId,
        UpdateOrderStatusRequest request)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(
            IsolationLevel.Serializable);

        var order = await _context.Orders
            .Include(x => x.Table)
            .Include(x => x.OrderItems)
            .FirstOrDefaultAsync(x => x.Id == orderId);

        if (order == null)
            throw new Exception(
                "Không tìm thấy đơn hàng.");

        var status = request.Status.Trim();

        var validStatuses = new[]
        {
            "Pending",
            "Accepted",
            "Confirmed",
            "Preparing",
            "Ready",
            "Completed",
            "Cancelled"
        };

        if (!validStatuses.Contains(status))
        {
            throw new Exception(
                "Trạng thái đơn hàng không hợp lệ.");
        }

        if (order.Status == "Completed" ||
            order.Status == "Cancelled")
        {
            throw new Exception(
                "Không thể thay đổi đơn hàng đã kết thúc.");
        }

        order.Status = status;
        order.UpdatedAt = DateTime.UtcNow;

        if (status == "Completed")
        {
            order.CompletedAt = DateTime.UtcNow;

            order.Table.Status = "Available";
            order.Table.VacatedAt = DateTime.UtcNow;
            order.Table.UpdatedAt = DateTime.UtcNow;
        }

        if (status == "Cancelled")
        {
            order.Table.Status = "Available";
            order.Table.VacatedAt = DateTime.UtcNow;
            order.Table.UpdatedAt = DateTime.UtcNow;

            foreach (var item in order.OrderItems)
            {
                item.Status = "Cancelled";
            }
        }

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        var response = MapToResponse(order);
        await PublishOrderChangedAsync(response.Id, response.TableId);
        return response;
    }

    public async Task<OrderResponse> UpdateDiscountAsync(
        int orderId,
        UpdateOrderDiscountRequest request)
    {
        var percentage = request.Percentage;
        if (percentage < 0 || percentage > 100)
            throw new Exception("Phần trăm giảm giá phải từ 0 đến 100.");

        var order = await _context.Orders
            .Include(x => x.Table)
            .Include(x => x.OrderItems)
            .FirstOrDefaultAsync(x => x.Id == orderId);

        if (order == null)
            throw new Exception("Không tìm thấy đơn hàng.");
        if (order.Status is "Completed" or "Cancelled")
            throw new Exception("Không thể sửa giảm giá cho đơn đã kết thúc.");

        var pendingPayment = await _context.Payments.AnyAsync(payment =>
            payment.OrderId == orderId && payment.Status == "Pending");
        if (pendingPayment)
            throw new Exception("Hãy hủy giao dịch thanh toán đang chờ trước khi sửa giảm giá.");

        order.Discount = Math.Round(order.Subtotal * percentage / 100m, 2);
        order.TotalAmount = Math.Max(0, order.Subtotal + order.Tax - order.Discount);
        order.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        var response = MapToResponse(order);
        await PublishOrderChangedAsync(response.Id, response.TableId);
        return response;
    }

    // =========================================================
    // TRANSFER TABLE
    // =========================================================

    public async Task<OrderResponse> TransferTableAsync(
        int orderId,
        TransferTableRequest request)
    {
        var order = await _context.Orders
            .Include(x => x.Table)
            .Include(x => x.OrderItems)
            .FirstOrDefaultAsync(x => x.Id == orderId);

        if (order == null)
            throw new Exception(
                "Không tìm thấy đơn hàng.");

        if (order.Status == "Completed" ||
            order.Status == "Cancelled")
        {
            throw new Exception(
                "Không thể chuyển bàn cho đơn đã kết thúc.");
        }

        if (order.TableId == request.TargetTableId)
        {
            throw new Exception(
                "Bàn đích giống bàn hiện tại.");
        }

        var targetTable = await _context.RestaurantTables
            .FirstOrDefaultAsync(
                x => x.Id == request.TargetTableId);

        if (targetTable == null)
            throw new Exception(
                "Không tìm thấy bàn đích.");

        if (targetTable.Status == "Maintenance")
            throw new Exception(
                "Bàn đích đang bảo trì.");

        var targetHasOrder = await _context.Orders
            .AnyAsync(x =>
                x.TableId == targetTable.Id &&
                x.Status != "Completed" &&
                x.Status != "Cancelled");

        if (targetHasOrder)
        {
            throw new Exception(
                "Bàn đích đang có đơn hàng.");
        }

        var oldTable = order.Table;
        var oldTableId = oldTable.Id;

        order.TableId = targetTable.Id;
        order.Table = targetTable;
        order.UpdatedAt = DateTime.UtcNow;

        oldTable.Status = "Available";
        oldTable.UpdatedAt = DateTime.UtcNow;

        targetTable.Status = "Occupied";
        targetTable.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var response = MapToResponse(order);
        await PublishOrderChangedAsync(response.Id, response.TableId, oldTableId);
        return response;
    }

    // =========================================================
    // MERGE ORDERS
    // =========================================================

    public async Task<OrderResponse> MergeOrdersAsync(
        MergeOrderRequest request)
    {
        var sourceIds = request.SourceOrderIds
            .Distinct()
            .Where(x => x != request.TargetOrderId)
            .ToList();

        if (sourceIds.Count == 0)
        {
            throw new Exception(
                "Không có đơn hàng cần gộp.");
        }

        var allIds = sourceIds
            .Append(request.TargetOrderId)
            .Distinct()
            .ToList();

        var orders = await _context.Orders
            .Include(x => x.Table)
            .Include(x => x.OrderItems)
            .Where(x => allIds.Contains(x.Id))
            .ToListAsync();

        if (orders.Count != allIds.Count)
        {
            throw new Exception(
                "Một hoặc nhiều đơn hàng không tồn tại.");
        }

        var targetOrder = orders.First(
            x => x.Id == request.TargetOrderId);

        if (targetOrder.Status == "Completed" ||
            targetOrder.Status == "Cancelled")
        {
            throw new Exception(
                "Không thể gộp vào đơn đã kết thúc.");
        }

        foreach (var sourceOrder in orders.Where(
                     x => x.Id != targetOrder.Id))
        {
            if (sourceOrder.Status == "Completed" ||
                sourceOrder.Status == "Cancelled")
            {
                throw new Exception(
                    $"Không thể gộp đơn {sourceOrder.OrderCode}.");
            }
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            foreach (var sourceOrder in orders.Where(
                         x => x.Id != targetOrder.Id))
            {
                foreach (var sourceItem in sourceOrder.OrderItems)
                {
                    // Nếu cùng Product + cùng giá + cùng note
                    // thì cộng quantity vào item hiện tại.
                    var existingItem =
                        targetOrder.OrderItems.FirstOrDefault(
                            x =>
                                x.ProductId ==
                                sourceItem.ProductId &&
                                x.UnitPrice ==
                                sourceItem.UnitPrice &&
                                x.Note == sourceItem.Note &&
                                x.Status == sourceItem.Status);

                    if (existingItem != null)
                    {
                        existingItem.Quantity +=
                            sourceItem.Quantity;

                        existingItem.Subtotal =
                            existingItem.Quantity *
                            existingItem.UnitPrice;

                        _context.OrderItems.Remove(sourceItem);
                    }
                    else
                    {
                        sourceItem.OrderId =
                            targetOrder.Id;

                        targetOrder.OrderItems.Add(sourceItem);
                    }
                }

                sourceOrder.Status = "Cancelled";
                sourceOrder.UpdatedAt = DateTime.UtcNow;

                sourceOrder.Table.Status = "Available";
                sourceOrder.Table.UpdatedAt = DateTime.UtcNow;
            }

            RecalculateOrder(targetOrder);

            targetOrder.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            var response = await GetByIdAsync(targetOrder.Id)
                ?? throw new Exception(
                    "Không thể lấy đơn sau khi gộp.");
            await PublishOrdersChangedAsync(
                orders.Select(order => (order.Id, order.TableId)));
            return response;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // =========================================================
    // SPLIT ORDER
    // =========================================================

    public async Task<OrderResponse> SplitOrderAsync(
        int orderId,
        SplitOrderRequest request)
    {
        if (request.Items == null ||
            request.Items.Count == 0)
        {
            throw new Exception(
                "Chưa chọn món để tách.");
        }

        var order = await _context.Orders
            .Include(x => x.Table)
            .Include(x => x.OrderItems)
            .FirstOrDefaultAsync(x => x.Id == orderId);

        if (order == null)
            throw new Exception(
                "Không tìm thấy đơn hàng.");

        if (order.Status == "Completed" ||
            order.Status == "Cancelled")
        {
            throw new Exception(
                "Không thể tách đơn đã kết thúc.");
        }

        var targetTable =
            await _context.RestaurantTables
                .FirstOrDefaultAsync(
                    x => x.Id == request.TargetTableId);

        if (targetTable == null)
            throw new Exception(
                "Không tìm thấy bàn đích.");

        if (targetTable.Status == "Maintenance")
            throw new Exception(
                "Bàn đích đang bảo trì.");

        var targetHasOrder = await _context.Orders
            .AnyAsync(x =>
                x.TableId == targetTable.Id &&
                x.Status != "Completed" &&
                x.Status != "Cancelled");

        if (targetHasOrder)
        {
            throw new Exception(
                "Bàn đích đang có đơn hàng.");
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            var newOrder = new Order
            {
                OrderCode = GenerateOrderCode(),
                TableId = targetTable.Id,
                Status = "Pending",
                Discount = 0,
                Tax = 0,
                Note = request.Note,
                CreatedAt = DateTime.UtcNow
            };

            decimal newSubtotal = 0;

            foreach (var splitRequest in request.Items)
            {
                if (splitRequest.Quantity <= 0)
                {
                    throw new Exception(
                        "Số lượng tách phải lớn hơn 0.");
                }

                var originalItem =
                    order.OrderItems.FirstOrDefault(
                        x => x.Id ==
                             splitRequest.OrderItemId);

                if (originalItem == null)
                {
                    throw new Exception(
                        $"Không tìm thấy OrderItem {splitRequest.OrderItemId}.");
                }

                if (splitRequest.Quantity >
                    originalItem.Quantity)
                {
                    throw new Exception(
                        $"Số lượng tách món '{originalItem.ProductName}' vượt quá số lượng hiện có.");
                }

                if (splitRequest.Quantity ==
                    originalItem.Quantity)
                {
                    originalItem.OrderId =
                        newOrder.Id;

                    newOrder.OrderItems.Add(
                        originalItem);

                    newSubtotal +=
                        originalItem.Subtotal;
                }
                else
                {
                    var newItem = new OrderItem
                    {
                        ProductId =
                            originalItem.ProductId,

                        ProductName =
                            originalItem.ProductName,

                        Quantity =
                            splitRequest.Quantity,

                        UnitPrice =
                            originalItem.UnitPrice,

                        Subtotal =
                            originalItem.UnitPrice *
                            splitRequest.Quantity,

                        Note =
                            originalItem.Note,

                        Status =
                            originalItem.Status,

                        CreatedAt =
                            DateTime.UtcNow
                    };

                    originalItem.Quantity -=
                        splitRequest.Quantity;

                    originalItem.Subtotal =
                        originalItem.Quantity *
                        originalItem.UnitPrice;

                    newOrder.OrderItems.Add(newItem);

                    newSubtotal +=
                        newItem.Subtotal;
                }
            }

            if (!newOrder.OrderItems.Any())
            {
                throw new Exception(
                    "Không có món nào được tách.");
            }

            newOrder.Subtotal = newSubtotal;

            newOrder.TotalAmount =
                newSubtotal
                - newOrder.Discount
                + newOrder.Tax;

            _context.Orders.Add(newOrder);

            targetTable.Status = "Occupied";
            targetTable.UpdatedAt = DateTime.UtcNow;

            RecalculateOrder(order);

            order.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            var response = await GetByIdAsync(newOrder.Id)
                ?? throw new Exception(
                    "Không thể lấy đơn mới sau khi tách.");
            await PublishOrdersChangedAsync(
                [(order.Id, order.TableId), (response.Id, response.TableId)]);
            return response;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // =========================================================
    // CANCEL ORDER
    // =========================================================

    public async Task<bool> CancelOrderAsync(int orderId)
    {
        var order = await _context.Orders
            .Include(x => x.Table)
            .Include(x => x.OrderItems)
            .FirstOrDefaultAsync(x => x.Id == orderId);

        if (order == null)
            return false;

        if (order.Status == "Completed")
        {
            throw new Exception(
                "Không thể hủy đơn đã hoàn thành.");
        }

        if (order.Status == "Cancelled")
            return true;

        order.Status = "Cancelled";
        order.UpdatedAt = DateTime.UtcNow;

        foreach (var item in order.OrderItems)
        {
            item.Status = "Cancelled";
        }

        order.Table.Status = "Available";
        order.Table.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await PublishOrderChangedAsync(order.Id, order.TableId);

        return true;
    }

    // =========================================================
    // HELPERS
    // =========================================================

    private Task PublishOrdersChangedAsync(
        IEnumerable<(int OrderId, int TableId)> orders)
    {
        var distinctOrders = orders.Distinct().ToArray();
        var tasks = new List<Task>
        {
            _orderHub.Clients
                .Group(OrderHub.PosGroupName)
                .SendAsync("OrdersChanged")
        };

        foreach (var orderId in distinctOrders.Select(order => order.OrderId).Distinct())
        {
            tasks.Add(_orderHub.Clients
                .Group(OrderHub.GetOrderGroup(orderId))
                .SendAsync("OrderChanged"));
        }

        foreach (var (orderId, tableId) in distinctOrders)
        {
            var payload = new { orderId, tableId };
            tasks.Add(_orderHub.Clients
                .Group(OrderHub.GetTableGroup(tableId))
                .SendAsync("OrderChanged", payload));
        }

        tasks.Add(_orderHub.Clients
            .Group(OrderHub.KitchenGroupName)
            .SendAsync("KdsOrdersChanged"));

        return Task.WhenAll(tasks);
    }

    private Task PublishOrderChangedAsync(
        int orderId,
        int tableId,
        int? previousTableId = null)
    {
        var tables = previousTableId.HasValue
            ? new[] { (orderId, tableId), (orderId, previousTableId.Value) }
            : [(orderId, tableId)];
        return PublishOrdersChangedAsync(tables);
    }

    private static void RecalculateOrder(Order order)
    {
        order.Subtotal =
            order.OrderItems
                .Where(x => x.Status != "Cancelled")
                .Sum(x => x.Subtotal);

        order.TotalAmount =
            order.Subtotal
            - order.Discount
            + order.Tax;

        if (order.TotalAmount < 0)
        {
            order.TotalAmount = 0;
        }
    }

    private static string GenerateOrderCode()
    {
        return
            $"ORD-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}"
            .Substring(0, 25)
            .ToUpperInvariant();
    }

    private static OrderResponse MapToResponse(
        Order order)
    {
        return new OrderResponse
        {
            Id = order.Id,

            OrderCode = order.OrderCode,

            TableId = order.TableId,

            TableNumber =
                order.Table?.TableNumber ?? string.Empty,

            Status = order.Status,

            Subtotal = order.Subtotal,

            Discount = order.Discount,

            Tax = order.Tax,

            TotalAmount = order.TotalAmount,

            Note = order.Note,

            CreatedAt = order.CreatedAt,

            UpdatedAt = order.UpdatedAt,

            CompletedAt = order.CompletedAt,

            Items = order.OrderItems
                .OrderBy(x => x.Id)
                .Select(x => new OrderItemResponse
                {
                    Id = x.Id,
                    ProductId = x.ProductId,
                    ProductName = x.ProductName,
                    Quantity = x.Quantity,
                    UnitPrice = x.UnitPrice,
                    Subtotal = x.Subtotal,
                    Note = x.Note,
                    Status = x.Status,
                    CreatedAt = x.CreatedAt,
                    StartedAt = x.StartedAt,
                    ReadyAt = x.ReadyAt
                })
                .ToList()
        };
    }
}