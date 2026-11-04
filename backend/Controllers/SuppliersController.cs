using System.ComponentModel.DataAnnotations;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[Route("api/suppliers")]
public sealed class SuppliersController(AppDbContext context) : ApiScaffoldController
{
    [HttpGet]
    public async Task<IActionResult> GetSuppliers()
    {
        var suppliers = await context.Suppliers
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Phone,
                x.Email,
                x.Address,
                x.IsActive,
                purchaseOrderCount = x.PurchaseOrders.Count
            })
            .ToListAsync();

        return Ok(suppliers);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetSupplier(int id)
    {
        var supplier = await context.Suppliers
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Phone,
                x.Email,
                x.Address,
                x.IsActive,
                purchaseOrderCount = x.PurchaseOrders.Count
            })
            .FirstOrDefaultAsync();

        return supplier is null
            ? NotFound(new { message = "Không tìm thấy nhà cung cấp." })
            : Ok(supplier);
    }

    [HttpPost]
    public async Task<IActionResult> CreateSupplier([FromBody] SaveSupplierRequest request)
    {
        var validation = Validate(request);
        if (validation is not null)
            return BadRequest(new { message = validation });

        var supplier = new Supplier
        {
            Name = request.Name?.Trim() ?? string.Empty,
            Phone = request.Phone?.Trim(),
            Email = request.Email?.Trim(),
            Address = request.Address?.Trim(),
            IsActive = true
        };
        context.Suppliers.Add(supplier);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSupplier), new { id = supplier.Id }, new
        {
            supplier.Id,
            supplier.Name,
            supplier.Phone,
            supplier.Email,
            supplier.Address,
            supplier.IsActive,
            purchaseOrderCount = 0
        });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateSupplier(int id, [FromBody] SaveSupplierRequest request)
    {
        var validation = Validate(request);
        if (validation is not null)
            return BadRequest(new { message = validation });

        var supplier = await context.Suppliers.FindAsync(id);
        if (supplier is null)
            return NotFound(new { message = "Không tìm thấy nhà cung cấp." });

        supplier.Name = request.Name?.Trim() ?? string.Empty;
        supplier.Phone = request.Phone?.Trim();
        supplier.Email = request.Email?.Trim();
        supplier.Address = request.Address?.Trim();
        await context.SaveChangesAsync();

        return Ok(new { message = "Đã cập nhật nhà cung cấp." });
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateSupplierStatus(
        int id,
        [FromBody] UpdateSupplierStatusRequest request)
    {
        var supplier = await context.Suppliers.FindAsync(id);
        if (supplier is null)
            return NotFound(new { message = "Không tìm thấy nhà cung cấp." });

        supplier.IsActive = request.IsActive;
        await context.SaveChangesAsync();
        return Ok(new { supplier.Id, supplier.IsActive });
    }

    private static string? Validate(SaveSupplierRequest request)
    {
        var name = request.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name) || name.Length > 150)
            return "Tên nhà cung cấp là bắt buộc và không vượt quá 150 ký tự.";
        var phone = request.Phone?.Trim();
        if (!string.IsNullOrEmpty(phone)
            && (phone.Length != 10 || phone.Any(character => character is < '0' or > '9')))
            return "Số điện thoại phải gồm đúng 10 chữ số.";
        if (request.Email?.Trim().Length > 150)
            return "Email không vượt quá 150 ký tự.";
        if (!string.IsNullOrWhiteSpace(request.Email)
            && !new EmailAddressAttribute().IsValid(request.Email.Trim()))
            return "Email nhà cung cấp không hợp lệ.";
        if (request.Address?.Trim().Length > 300)
            return "Địa chỉ không vượt quá 300 ký tự.";
        return null;
    }
}

public sealed record SaveSupplierRequest(
    string? Name,
    string? Phone,
    string? Email,
    string? Address);

public sealed record UpdateSupplierStatusRequest(bool IsActive);
