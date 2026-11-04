using System.Text.Json;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[Route("api/categories")]
public sealed class CategoriesController(AppDbContext context) : ApiScaffoldController
{
    [HttpGet]
    public async Task<IActionResult> GetCategories()
        => Ok(await context.Categories.AsNoTracking()
            .OrderBy(category => category.DisplayOrder)
            .Select(category => new
            {
                category.Id,
                category.Name,
                category.Description,
                category.DisplayOrder,
                category.IsActive,
                ProductCount = category.Products.Count(product => product.IsAvailable)
            })
            .ToListAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetCategory(int id)
    {
        var category = await context.Categories.AsNoTracking()
            .Where(item => item.Id == id)
            .Select(item => new
            {
                item.Id,
                item.Name,
                item.Description,
                item.DisplayOrder,
                item.IsActive,
                ProductCount = item.Products.Count(product => product.IsAvailable)
            })
            .FirstOrDefaultAsync();
        return category is null ? NotFound() : Ok(category);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCategory([FromBody] CategoryRequest request)
    {
        var validation = Validate(request);
        if (validation is not null) return BadRequest(new { message = validation });
        if (await context.Categories.AnyAsync(category => category.Name == request.Name!.Trim()))
            return Conflict(new { message = "Tên danh mục đã tồn tại." });

        var category = new Category
        {
            Name = request.Name!.Trim(),
            Description = request.Description?.Trim(),
            DisplayOrder = request.DisplayOrder,
            IsActive = request.IsActive
        };
        context.Categories.Add(category);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateCategory(int id, [FromBody] CategoryRequest request)
    {
        var validation = Validate(request);
        if (validation is not null) return BadRequest(new { message = validation });
        var category = await context.Categories.FindAsync(id);
        if (category is null) return NotFound();
        if (await context.Categories.AnyAsync(item => item.Id != id && item.Name == request.Name!.Trim()))
            return Conflict(new { message = "Tên danh mục đã tồn tại." });

        category.Name = request.Name!.Trim();
        category.Description = request.Description?.Trim();
        category.DisplayOrder = request.DisplayOrder;
        category.IsActive = request.IsActive;
        await context.SaveChangesAsync();
        return Ok(category);
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateCategoryStatus(int id, [FromBody] CategoryStatusRequest request)
    {
        var category = await context.Categories.FindAsync(id);
        if (category is null) return NotFound();
        category.IsActive = request.IsActive;
        await context.SaveChangesAsync();
        return Ok(new { category.Id, category.IsActive });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var category = await context.Categories.Include(item => item.Products)
            .FirstOrDefaultAsync(item => item.Id == id);
        if (category is null) return NotFound();
        if (category.Products.Count > 0)
            return Conflict(new { message = "Danh mục đang có món, hãy tắt hoạt động thay vì xóa." });
        context.Categories.Remove(category);
        await context.SaveChangesAsync();
        return NoContent();
    }

    private static string? Validate(CategoryRequest request)
        => string.IsNullOrWhiteSpace(request.Name)
            ? "Tên danh mục không được để trống."
            : request.Name.Trim().Length > 100
                ? "Tên danh mục không được dài quá 100 ký tự."
                : request.DisplayOrder < 0
                    ? "Thứ tự hiển thị không hợp lệ."
                    : null;
}

public sealed class CategoryRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class CategoryStatusRequest
{
    public bool IsActive { get; set; }
}
