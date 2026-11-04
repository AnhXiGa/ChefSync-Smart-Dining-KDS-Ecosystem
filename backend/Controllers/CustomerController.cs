using backend.Data;
using backend.DTOs;
using backend.DTOs.Kds;
using backend.Hubs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CustomerController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHubContext<OrderHub> _orderHub;

    public CustomerController(AppDbContext context, IHubContext<OrderHub> orderHub)
    {
        _context = context;
        _orderHub = orderHub;
    }

    [HttpGet("verify-table/{qrToken}")]
    public async Task<IActionResult> VerifyTable(string qrToken)
    {
        if (string.IsNullOrWhiteSpace(qrToken))
            return BadRequest(new { message = "Mã QR không hợp lệ." });

        if (!Guid.TryParse(qrToken, out var tokenGuid))
            return BadRequest(new { message = "Mã QR không hợp lệ." });

        var table = await _context.RestaurantTables
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.QrToken == tokenGuid);

        if (table == null)
            return NotFound(new { message = "Mã QR không hợp lệ hoặc bàn không tồn tại." });

        if (table.Status == "Maintenance")
            return BadRequest(new { message = "Bàn này đang bảo trì, vui lòng liên hệ nhân viên." });

        return Ok(new TableAuthResponseDto
        {
            TableId = table.Id,
            TableNumber = table.TableNumber,
            Status = table.Status
        });
    }

    [HttpPost("tables/{tableId:int}/regenerate-qr")]
    public async Task<IActionResult> RegenerateQrToken(int tableId)
    {
        var table = await _context.RestaurantTables.FindAsync(tableId);
        if (table == null)
            return NotFound();

        return Ok(new
        {
            table.Id,
            table.TableNumber,
            QrToken = table.QrToken.ToString("N")
        });
    }

    [HttpGet("menu")]
    public async Task<IActionResult> GetMenu([FromQuery] string? search, [FromQuery] int? categoryId)
    {
        var normalizedSearch = string.IsNullOrWhiteSpace(search) ? string.Empty : search.Trim();
        var categories = await _context.Categories
            .AsNoTracking()
            .Where(c => c.IsActive)
            .Include(c => c.Products)
                .ThenInclude(p => p.ProductIngredients)
                .ThenInclude(pi => pi.Ingredient)
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync();

        var bom = await _context.ProductIngredients
            .AsNoTracking()
            .Include(pi => pi.Ingredient)
            .ToListAsync();

        var reservedItems = await _context.OrderItems
            .AsNoTracking()
            .Include(item => item.Order)
            .Where(item =>
                item.Status != "Ready" &&
                item.Status != "Served" &&
                item.Status != "Cancelled" &&
                item.Order.Status != "Completed" &&
                item.Order.Status != "Cancelled")
            .Select(item => new { item.ProductId, item.Quantity })
            .ToListAsync();

        var reservedByProduct = reservedItems
            .GroupBy(item => item.ProductId)
            .ToDictionary(group => group.Key, group => group.Sum(item => item.Quantity));

        var availableQuantities = new Dictionary<int, int>();
        foreach (var product in categories.SelectMany(c => c.Products))
        {
            var recipe = bom.Where(pi => pi.ProductId == product.Id).ToList();
            if (recipe.Count == 0)
            {
                availableQuantities[product.Id] = 999;
                continue;
            }

            var capacities = recipe.Select(pi =>
            {
                var reservedQuantity = reservedByProduct
                    .Where(pair => pair.Key == product.Id)
                    .Select(pair => pair.Value)
                    .FirstOrDefault();
                var reservedUsage = recipe
                    .Where(pi2 => pi2.IngredientId == pi.IngredientId)
                    .Sum(pi2 => pi2.Quantity * reservedQuantity);
                var usableStock = Math.Max(0m, pi.Ingredient.CurrentStock - reservedUsage);
                return pi.Quantity > 0 ? (int)Math.Floor(usableStock / pi.Quantity) : 0;
            });
            availableQuantities[product.Id] = capacities.Any() ? capacities.Min() : 0;
        }

        var result = categories.Select(c => new CategoryWithProductsDto
        {
            Id = c.Id,
            Name = c.Name,
            DisplayOrder = c.DisplayOrder,
            Products = c.Products
                .Where(p => p.IsAvailable &&
                    (!categoryId.HasValue || p.CategoryId == categoryId.Value) &&
                    (string.IsNullOrEmpty(normalizedSearch) ||
                        p.Name.ToLower().Contains(normalizedSearch.ToLower())))
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    CategoryId = p.CategoryId,
                    Name = p.Name,
                    Description = p.Description,
                    Price = p.Price,
                    ImageUrl = p.ImageUrl,
                    PreparationTime = p.PreparationTime,
                    AvailableQuantity = availableQuantities.TryGetValue(p.Id, out var quantity)
                        ? quantity
                        : 0
                })
                .ToList()
        }).ToList();

        if (!string.IsNullOrWhiteSpace(normalizedSearch) || categoryId.HasValue)
            result = result.Where(c => c.Products.Any()).ToList();

        return Ok(result);
    }

    [HttpGet("orders")]
    public async Task<IActionResult> GetCustomerOrders([FromQuery] string qrToken)
    {
        if (!Guid.TryParse(qrToken, out var tokenGuid))
            return BadRequest(new { message = "Mã QR không hợp lệ." });

        var table = await _context.RestaurantTables
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.QrToken == tokenGuid);

        if (table == null)
            return NotFound(new { message = "Không tìm thấy bàn từ mã QR này." });

        var orders = await _context.Orders
            .AsNoTracking()
            .Where(order => order.TableId == table.Id &&
                order.Status != "Completed" && order.Status != "Cancelled")
            .OrderByDescending(order => order.CreatedAt)
            .Select(order => new
            {
                order.Id,
                order.OrderCode,
                order.Status,
                order.CreatedAt,
                order.TotalAmount,
                Items = order.OrderItems
                    .OrderBy(item => item.CreatedAt)
                    .Select(item => new
                    {
                        item.Id,
                        item.ProductName,
                        item.Quantity,
                        item.UnitPrice,
                        item.Subtotal,
                        item.Note,
                        item.Status,
                        CanCancel = item.Status == "Pending" || item.Status == "Accepted"
                    })
                    .ToList()
            })
            .ToListAsync();

        return Ok(orders);
    }

    [HttpPost("orders/items/{itemId:int}/cancel")]
    public async Task<IActionResult> CancelCustomerOrderItem(
        int itemId,
        [FromQuery] string qrToken,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(qrToken, out var tokenGuid))
            return BadRequest(new { message = "Mã QR không hợp lệ." });

        var item = await _context.OrderItems
            .Include(orderItem => orderItem.Order)
                .ThenInclude(order => order.Table)
            .Include(orderItem => orderItem.Order)
                .ThenInclude(order => order.OrderItems)
            .FirstOrDefaultAsync(
                orderItem => orderItem.Id == itemId &&
                    orderItem.Order.Table.QrToken == tokenGuid,
                cancellationToken);

        if (item == null)
            return NotFound(new { message = "Không tìm thấy món trong đơn của bàn này." });

        if (item.Status is not ("Pending" or "Accepted"))
            return Conflict(new
            {
                message = "Món đã bắt đầu chế biến nên không thể tự hủy."
            });

        var order = item.Order;
        var table = order.Table;
        item.Status = "Cancelled";
        order.UpdatedAt = DateTime.UtcNow;

        var activeItems = order.OrderItems
            .Where(orderItem => orderItem.Status != "Cancelled")
            .ToList();
        order.Subtotal = activeItems.Sum(orderItem => orderItem.Subtotal);
        order.Tax = order.Subtotal * 0.08m;
        order.TotalAmount = Math.Max(0, order.Subtotal + order.Tax - order.Discount);

        if (activeItems.Count == 0)
        {
            order.Status = "Cancelled";
            var hasOtherActiveOrders = await _context.Orders.AnyAsync(
                otherOrder => otherOrder.TableId == table.Id &&
                    otherOrder.Id != order.Id &&
                    otherOrder.Status != "Completed" &&
                    otherOrder.Status != "Cancelled" &&
                    otherOrder.OrderItems.Any(orderItem => orderItem.Status != "Cancelled"),
                cancellationToken);

            if (!hasOtherActiveOrders)
            {
                table.Status = "Available";
                table.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        var response = new KdsOrderItemResponse(
            item.Id,
            order.Id,
            order.OrderCode,
            table.TableNumber,
            item.ProductId,
            item.ProductName,
            item.Quantity,
            item.Note,
            item.Status,
            new DateTimeOffset(DateTime.SpecifyKind(item.CreatedAt, DateTimeKind.Utc)),
            item.StartedAt.HasValue
                ? new DateTimeOffset(DateTime.SpecifyKind(item.StartedAt.Value, DateTimeKind.Utc))
                : null,
            item.ReadyAt.HasValue
                ? new DateTimeOffset(DateTime.SpecifyKind(item.ReadyAt.Value, DateTimeKind.Utc))
                : null);

        await Task.WhenAll(
            _orderHub.Clients
                .Group(OrderHub.GetOrderGroup(order.Id))
                .SendAsync("OrderItemStatusChanged", response, cancellationToken),
            _orderHub.Clients
                .Group(OrderHub.KitchenGroupName)
                .SendAsync("OrderItemStatusChanged", response, cancellationToken),
            _orderHub.Clients
                .Group(OrderHub.KitchenGroupName)
                .SendAsync("KdsOrdersChanged", cancellationToken));

        return Ok(new
        {
            message = "Đã hủy món.",
            itemId = item.Id,
            itemStatus = item.Status,
            orderStatus = order.Status,
            tableStatus = table.Status
        });
    }

    [HttpPost("orders")]
    public async Task<IActionResult> PlaceOrder([FromBody] CreateOrderRequestDto request)
    {
        if (request == null)
            return BadRequest(new { message = "Dữ liệu đặt món không hợp lệ." });

        if (request.Items == null || request.Items.Count == 0)
            return BadRequest(new { message = "Giỏ hàng trống." });

        if (string.IsNullOrWhiteSpace(request.QrToken) || !Guid.TryParse(request.QrToken, out var qrToken))
            return BadRequest(new { message = "Không xác định được bàn đặt món." });

        var table = await _context.RestaurantTables
            .FirstOrDefaultAsync(t => t.QrToken == qrToken);

        if (table == null)
            return BadRequest(new { message = "Không xác định được bàn đặt món." });

        if (table.Status == "Maintenance")
            return BadRequest(new { message = "Bàn này đang bảo trì, vui lòng liên hệ nhân viên." });

        var productIds = request.Items
            .Select(i => i.ProductId)
            .Distinct()
            .ToList();

        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id) && p.IsAvailable)
            .ToDictionaryAsync(p => p.Id);

        var requestedTotals = request.Items
            .GroupBy(item => item.ProductId)
            .ToDictionary(group => group.Key, group => group.Sum(item => item.Quantity));

        var recipes = await _context.ProductIngredients
            .AsNoTracking()
            .Include(pi => pi.Ingredient)
            .Where(pi => productIds.Contains(pi.ProductId))
            .ToListAsync();

        var reservedItems = await _context.OrderItems
            .AsNoTracking()
            .Where(item =>
                item.Status != "Ready" &&
                item.Status != "Served" &&
                item.Status != "Cancelled" &&
                item.Order.Status != "Completed" &&
                item.Order.Status != "Cancelled")
            .Select(item => new { item.ProductId, item.Quantity })
            .ToListAsync();

        var reservedByProduct = reservedItems
            .GroupBy(item => item.ProductId)
            .ToDictionary(group => group.Key, group => group.Sum(item => item.Quantity));

        foreach (var productId in productIds)
        {
            var recipe = recipes.Where(pi => pi.ProductId == productId).ToList();
            if (recipe.Count == 0)
                continue;

            var reservedQuantity = reservedByProduct.GetValueOrDefault(productId);
            foreach (var requiredIngredient in recipe)
            {
                var reservedUsage = requiredIngredient.Quantity * reservedQuantity;
                var requestedUsage = requiredIngredient.Quantity * requestedTotals.GetValueOrDefault(productId);
                var usableStock = requiredIngredient.Ingredient.CurrentStock - reservedUsage;
                if (requestedUsage > usableStock)
                {
                    return BadRequest(new
                    {
                        message = $"Nguyên liệu {requiredIngredient.Ingredient.Name} không đủ để thêm món này. " +
                            $"Hiện chỉ còn {Math.Max(0, (int)Math.Floor(usableStock / requiredIngredient.Quantity))} phần."
                    });
                }
            }
        }

        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var order = await _context.Orders
                .Include(existingOrder => existingOrder.OrderItems)
                .Where(existingOrder => existingOrder.TableId == table.Id &&
                    existingOrder.Status != "Completed" &&
                    existingOrder.Status != "Cancelled")
                .OrderByDescending(existingOrder => existingOrder.CreatedAt)
                .FirstOrDefaultAsync();

            var createdNewOrder = order == null;
            if (createdNewOrder)
            {
                order = new Order
                {
                    OrderCode = $"ORD-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(100, 999)}",
                    TableId = table.Id,
                    Status = "Pending",
                    Note = request.Note,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Orders.Add(order);
            }
            else if (!string.IsNullOrWhiteSpace(request.Note))
            {
                order.Note = string.IsNullOrWhiteSpace(order.Note)
                    ? request.Note
                    : $"{order.Note}\n{request.Note}";
            }

            var existingSubtotal = order.OrderItems
                .Where(orderItem => orderItem.Status != "Cancelled")
                .Sum(orderItem => orderItem.Subtotal);
            decimal subtotal = existingSubtotal;

            foreach (var item in request.Items)
            {
                if (item.Quantity <= 0)
                    return BadRequest(new { message = $"Số lượng món ID {item.ProductId} không hợp lệ." });

                if (!products.TryGetValue(item.ProductId, out var product))
                    return BadRequest(new { message = $"Món ăn ID {item.ProductId} hiện không khả dụng." });

                var itemSubtotal = product.Price * item.Quantity;
                subtotal += itemSubtotal;

                order.OrderItems.Add(new OrderItem
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    Quantity = item.Quantity,
                    UnitPrice = product.Price,
                    Subtotal = itemSubtotal,
                    Note = item.Note,
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow
                });
            }

            order.Subtotal = subtotal;
            order.Discount = 0;
            order.Tax = subtotal * 0.08m;
            order.TotalAmount = order.Subtotal + order.Tax - order.Discount;
            order.UpdatedAt = DateTime.UtcNow;

            table.Status = "Occupied";
            table.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new
            {
                message = "Đặt món thành công!",
                orderId = order.Id,
                orderCode = order.OrderCode,
                totalAmount = order.TotalAmount
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { message = "Lỗi hệ thống khi tạo đơn hàng.", detail = ex.Message });
        }
    }
}
