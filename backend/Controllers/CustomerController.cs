using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CustomerController : ControllerBase
{
    private readonly AppDbContext _context;

    public CustomerController(AppDbContext context)
    {
        _context = context;
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

        table.QrToken = Guid.NewGuid();
        table.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

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

        var query = _context.Categories
            .AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .Select(c => new CategoryWithProductsDto
            {
                Id = c.Id,
                Name = c.Name,
                DisplayOrder = c.DisplayOrder,
                Products = c.Products
                    .Where(p => p.IsAvailable &&
                        (!categoryId.HasValue || p.CategoryId == categoryId.Value) &&
                        (string.IsNullOrEmpty(normalizedSearch) || p.Name.ToLower().Contains(normalizedSearch.ToLower())))
                    .Select(p => new ProductDto
                    {
                        Id = p.Id,
                        CategoryId = p.CategoryId,
                        Name = p.Name,
                        Description = p.Description,
                        Price = p.Price,
                        ImageUrl = p.ImageUrl,
                        PreparationTime = p.PreparationTime
                    })
                    .ToList()
            });

        var result = await query.ToListAsync();

        if (!string.IsNullOrWhiteSpace(normalizedSearch) || categoryId.HasValue)
            result = result.Where(c => c.Products.Any()).ToList();

        return Ok(result);
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

        var productIds = request.Items
            .Select(i => i.ProductId)
            .Distinct()
            .ToList();

        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id) && p.IsAvailable)
            .ToDictionaryAsync(p => p.Id);

        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var order = new Order
            {
                OrderCode = $"ORD-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(100, 999)}",
                TableId = table.Id,
                Status = "Pending",
                Note = request.Note,
                CreatedAt = DateTime.UtcNow
            };

            decimal subtotal = 0;

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

            if (table.Status == "Available")
            {
                table.Status = "Occupied";
                table.UpdatedAt = DateTime.UtcNow;
            }

            _context.Orders.Add(order);
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
