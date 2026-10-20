using backend.Data;
using backend.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[Route("api/menu")]
public sealed class MenuController : ApiScaffoldController
{
    private readonly AppDbContext _context;

    public MenuController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
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
        {
            result = result.Where(c => c.Products.Any()).ToList();
        }

        return Ok(result);
    }

    [HttpGet("categories/{categoryId:int}/products")]
    public async Task<IActionResult> GetProductsByCategory(int categoryId)
    {
        var products = await _context.Products
            .AsNoTracking()
            .Where(p => p.CategoryId == categoryId && p.IsAvailable)
            .OrderBy(p => p.Name)
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
            .ToListAsync();

        return Ok(products);
    }
}
