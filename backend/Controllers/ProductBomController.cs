using backend.DTOs.Inventory;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/products/{productId:int}/bom")]
public sealed class ProductBomController(IInventoryService inventory) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BomItemResponse>>> Get(
        int productId, CancellationToken cancellationToken)
        => Ok(await inventory.GetBomAsync(productId, cancellationToken));

    [HttpPut]
    public async Task<IActionResult> Update(
        int productId, UpdateBomRequest request, CancellationToken cancellationToken)
    {
        foreach (var item in request.Items)
        {
            var result = await inventory.AddBomItemAsync(
                productId, item.IngredientId, item.Quantity, cancellationToken);
            if (result is null)
                return NotFound(new { message = "Món ăn hoặc nguyên liệu không tồn tại." });
        }

        var bom = await inventory.GetBomAsync(productId, cancellationToken);
        return Ok(bom);
    }

    [HttpPost("items")]
    public async Task<ActionResult<BomItemResponse>> Add(
        int productId, BomItemRequest request, CancellationToken cancellationToken)
    {
        var result = await inventory.AddBomItemAsync(
            productId, request.IngredientId, request.Quantity, cancellationToken);
        return result is null
            ? NotFound(new { message = "Món ăn hoặc nguyên liệu không tồn tại." })
            : Ok(result);
    }

    [HttpDelete("items/{ingredientId:int}")]
    public async Task<IActionResult> Delete(
        int productId, int ingredientId, CancellationToken cancellationToken)
        => await inventory.DeleteBomItemAsync(productId, ingredientId, cancellationToken)
            ? NoContent()
            : NotFound();
}
