using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[Route("api/products")]
public sealed class ProductsController(AppDbContext context) : ApiScaffoldController
{
    [HttpGet]
    public async Task<IActionResult> GetProducts([FromQuery] string? search, [FromQuery] int? categoryId)
    {
        var normalizedSearch = search?.Trim();
        var products = await context.Products
            .AsNoTracking()
            .Where(product =>
                (!categoryId.HasValue || product.CategoryId == categoryId.Value) &&
                (string.IsNullOrEmpty(normalizedSearch) || product.Name.ToLower().Contains(normalizedSearch.ToLower())))
            .OrderBy(product => product.Category.DisplayOrder)
            .ThenBy(product => product.Name)
            .Select(product => new ProductResponse(
                product.Id,
                product.CategoryId,
                product.Category.Name,
                product.Name,
                product.Description,
                product.Price,
                product.ImageUrl,
                product.PreparationTime,
                product.IsAvailable))
            .ToListAsync();

        return Ok(products);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetProduct(int id)
    {
        var product = await context.Products
            .AsNoTracking()
            .Where(item => item.Id == id)
            .Select(item => new ProductResponse(
                item.Id,
                item.CategoryId,
                item.Category.Name,
                item.Name,
                item.Description,
                item.Price,
                item.ImageUrl,
                item.PreparationTime,
                item.IsAvailable))
            .FirstOrDefaultAsync();

        return product is null ? NotFound() : Ok(product);
    }

    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] ProductRequest request)
    {
        var validation = await ValidateRequest(request);
        if (validation is not null) return BadRequest(new { message = validation });

        var product = new Product
        {
            CategoryId = request.CategoryId,
            Name = request.Name!.Trim(),
            Description = NormalizeOptional(request.Description),
            Price = request.Price,
            ImageUrl = NormalizeOptional(request.ImageUrl),
            PreparationTime = request.PreparationTime,
            IsAvailable = request.IsAvailable
        };
        context.Products.Add(product);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, new ProductResponse(
            product.Id,
            product.CategoryId,
            (await context.Categories.AsNoTracking().Where(category => category.Id == product.CategoryId)
                .Select(category => category.Name).FirstAsync()),
            product.Name,
            product.Description,
            product.Price,
            product.ImageUrl,
            product.PreparationTime,
            product.IsAvailable));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] ProductRequest request)
    {
        var validation = await ValidateRequest(request);
        if (validation is not null) return BadRequest(new { message = validation });

        var product = await context.Products.FindAsync(id);
        if (product is null) return NotFound();

        product.CategoryId = request.CategoryId;
        product.Name = request.Name!.Trim();
        product.Description = NormalizeOptional(request.Description);
        product.Price = request.Price;
        product.ImageUrl = NormalizeOptional(request.ImageUrl);
        product.PreparationTime = request.PreparationTime;
        product.IsAvailable = request.IsAvailable;
        product.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();
        return await GetProduct(id);
    }

    [HttpPatch("{id:int}/availability")]
    public async Task<IActionResult> UpdateProductAvailability(int id, [FromBody] ProductAvailabilityRequest request)
    {
        var product = await context.Products.FindAsync(id);
        if (product is null) return NotFound();

        product.IsAvailable = request.IsAvailable;
        product.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        return Ok(new { product.Id, product.IsAvailable });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var product = await context.Products.FindAsync(id);
        if (product is null) return NotFound();
        if (await context.OrderItems.AnyAsync(item => item.ProductId == id))
            return Conflict(new { message = "Món đã có trong lịch sử đơn hàng nên không thể xóa. Hãy ẩn món thay vì xóa." });

        context.Products.Remove(product);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<string?> ValidateRequest(ProductRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length > 150)
            return "Tên món phải có từ 1 đến 150 ký tự.";
        if (request.Description?.Length > 1000)
            return "Mô tả món không được vượt quá 1000 ký tự.";
        if (request.Price < 0)
            return "Giá món không được nhỏ hơn 0.";
        if (request.ImageUrl?.Length > 500)
            return "Đường dẫn hình ảnh không được vượt quá 500 ký tự.";
        if (request.PreparationTime is < 1 or > 1440)
            return "Thời gian chuẩn bị phải từ 1 đến 1440 phút.";
        if (!await context.Categories.AnyAsync(category => category.Id == request.CategoryId))
            return "Danh mục món ăn không tồn tại.";
        return null;
    }

    private static string? NormalizeOptional(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public sealed record ProductRequest(
    int CategoryId,
    string? Name,
    string? Description,
    decimal Price,
    string? ImageUrl,
    int? PreparationTime,
    bool IsAvailable = true);

public sealed record ProductAvailabilityRequest(bool IsAvailable);

public sealed record ProductResponse(
    int Id,
    int CategoryId,
    string CategoryName,
    string Name,
    string? Description,
    decimal Price,
    string? ImageUrl,
    int? PreparationTime,
    bool IsAvailable);
