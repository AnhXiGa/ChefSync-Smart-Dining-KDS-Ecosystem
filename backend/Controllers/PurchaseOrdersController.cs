using System.Data;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[Route("api/purchase-orders")]
public sealed class PurchaseOrdersController(AppDbContext context) : ApiScaffoldController
{
    [HttpGet]
    public async Task<IActionResult> GetPurchaseOrders()
    {
        var orders = await context.PurchaseOrders
            .AsNoTracking()
            .Include(x => x.Supplier)
            .Include(x => x.PurchaseOrderItems)
            .ThenInclude(x => x.Ingredient)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(orders.Select(ToResponse));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetPurchaseOrder(int id)
    {
        var order = await context.PurchaseOrders
            .AsNoTracking()
            .Include(x => x.Supplier)
            .Include(x => x.PurchaseOrderItems)
            .ThenInclude(x => x.Ingredient)
            .FirstOrDefaultAsync(x => x.Id == id);

        return order is null
            ? NotFound(new { message = "Không tìm thấy phiếu nhập hàng." })
            : Ok(ToResponse(order));
    }

    [HttpPost]
    public async Task<IActionResult> CreatePurchaseOrder(
        [FromBody] CreatePurchaseOrderRequest request)
    {
        if (request.SupplierId <= 0 || request.CreatedByUserId <= 0
            || request.Items is not { Length: > 0 })
            return BadRequest(new { message = "Nhà cung cấp, người tạo và ít nhất một mặt hàng là bắt buộc." });

        var supplier = await context.Suppliers
            .FirstOrDefaultAsync(x => x.Id == request.SupplierId && x.IsActive);
        if (supplier is null)
            return BadRequest(new { message = "Nhà cung cấp không tồn tại hoặc đã ngừng hoạt động." });

        var userExists = await context.Users
            .AnyAsync(x => x.Id == request.CreatedByUserId && x.IsActive);
        if (!userExists)
            return BadRequest(new { message = "Không tìm thấy tài khoản người tạo phiếu." });

        if (request.Note?.Trim().Length > 500)
            return BadRequest(new { message = "Ghi chú không vượt quá 500 ký tự." });
        if (request.Items.Any(x => x.IngredientId <= 0 || x.Quantity <= 0 || x.UnitPrice < 0))
            return BadRequest(new { message = "Nguyên liệu phải hợp lệ, số lượng lớn hơn 0 và đơn giá không âm." });

        var ingredientIds = request.Items.Select(x => x.IngredientId).Distinct().ToArray();
        var ingredients = await context.Ingredients
            .Where(x => ingredientIds.Contains(x.Id) && x.IsActive)
            .ToDictionaryAsync(x => x.Id);
        if (ingredients.Count != ingredientIds.Length)
            return BadRequest(new { message = "Một hoặc nhiều nguyên liệu không tồn tại hoặc đã ngừng hoạt động." });

        var order = new PurchaseOrder
        {
            PurchaseCode = $"PN-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}"[..25],
            SupplierId = supplier.Id,
            Supplier = supplier,
            CreatedByUserId = request.CreatedByUserId,
            Status = "Draft",
            Note = request.Note?.Trim(),
            PurchaseOrderItems = request.Items.Select(item => new PurchaseOrderItem
            {
                IngredientId = item.IngredientId,
                Ingredient = ingredients[item.IngredientId],
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Subtotal = decimal.Round(item.Quantity * item.UnitPrice, 2)
            }).ToList()
        };
        order.TotalAmount = order.PurchaseOrderItems.Sum(x => x.Subtotal);

        context.PurchaseOrders.Add(order);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPurchaseOrder), new { id = order.Id }, ToResponse(order));
    }

    [HttpPatch("{id:int}/receive")]
    public async Task<IActionResult> ReceivePurchaseOrder(int id)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(
            IsolationLevel.Serializable);
        var order = await context.PurchaseOrders
            .Include(x => x.Supplier)
            .Include(x => x.PurchaseOrderItems)
            .ThenInclude(x => x.Ingredient)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (order is null)
            return NotFound(new { message = "Không tìm thấy phiếu nhập hàng." });
        if (order.Status == "Received")
        {
            return Ok(new
            {
                message = "Phiếu nhập hàng đã được nhận trước đó.",
                order = new { order.Id, order.Status, order.ReceivedAt }
            });
        }
        if (order.Status is "Cancelled" or "Completed")
            return Conflict(new { message = "Không thể nhận phiếu nhập hàng đã hủy hoặc hoàn tất." });
        if (order.PurchaseOrderItems.Count == 0)
            return BadRequest(new { message = "Phiếu nhập hàng chưa có nguyên liệu." });

        var now = DateTime.UtcNow;
        foreach (var item in order.PurchaseOrderItems)
        {
            var ingredient = item.Ingredient;
            var beforeStock = ingredient.CurrentStock;
            var afterStock = beforeStock + item.Quantity;
            ingredient.CurrentStock = afterStock;
            ingredient.CostPerUnit = item.UnitPrice;
            ingredient.UpdatedAt = now;
            context.InventoryTransactions.Add(new InventoryTransaction
            {
                IngredientId = ingredient.Id,
                Type = "Receipt",
                Quantity = item.Quantity,
                BeforeStock = beforeStock,
                AfterStock = afterStock,
                ReferenceType = "PurchaseOrder",
                ReferenceId = order.Id,
                Note = $"Nhập từ phiếu {order.PurchaseCode}"
            });
        }

        order.Status = "Received";
        order.ReceivedAt = now;
        await context.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new
        {
            message = "Đã nhận phiếu và cập nhật tồn kho.",
            order = new { order.Id, order.Status, order.ReceivedAt }
        });
    }

    [HttpPatch("{id:int}/cancel")]
    public async Task<IActionResult> CancelPurchaseOrder(int id)
    {
        var order = await context.PurchaseOrders.FirstOrDefaultAsync(x => x.Id == id);
        if (order is null)
            return NotFound(new { message = "Không tìm thấy phiếu nhập hàng." });
        if (order.Status == "Received")
            return Conflict(new { message = "Không thể hủy phiếu đã nhận hàng." });
        if (order.Status == "Cancelled")
            return Ok(new { message = "Phiếu nhập hàng đã được hủy." });

        order.Status = "Cancelled";
        await context.SaveChangesAsync();
        return Ok(new { message = "Đã hủy phiếu nhập hàng." });
    }

    private static object ToResponse(PurchaseOrder order) => new
    {
        order.Id,
        order.PurchaseCode,
        order.SupplierId,
        supplierName = order.Supplier.Name,
        order.Status,
        order.TotalAmount,
        order.Note,
        order.CreatedByUserId,
        order.CreatedAt,
        order.ReceivedAt,
        items = order.PurchaseOrderItems.Select(item => new
        {
            item.Id,
            item.IngredientId,
            ingredientName = item.Ingredient.Name,
            unit = item.Ingredient.Unit,
            item.Quantity,
            item.UnitPrice,
            item.Subtotal
        })
    };
}

public sealed record CreatePurchaseOrderRequest(
    int SupplierId,
    int CreatedByUserId,
    string? Note,
    CreatePurchaseOrderItemRequest[]? Items);

public sealed record CreatePurchaseOrderItemRequest(
    int IngredientId,
    decimal Quantity,
    decimal UnitPrice);
