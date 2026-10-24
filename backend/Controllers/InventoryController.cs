using backend.DTOs.Inventory;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/inventory")]
public sealed class InventoryController(IInventoryService inventory) : ControllerBase
{
    [HttpGet("low-stock")]
    public async Task<ActionResult<IReadOnlyList<IngredientResponse>>> GetLowStock(
        CancellationToken cancellationToken)
    {
        var ingredients = await inventory.GetIngredientsAsync(cancellationToken);
        return Ok(ingredients.Where(x => x.IsLowStock).ToList());
    }

    [HttpGet("transactions")]
    public async Task<ActionResult<IReadOnlyList<InventoryTransactionResponse>>> GetTransactions(
        [FromQuery] int? ingredientId, CancellationToken cancellationToken)
        => Ok(await inventory.GetTransactionsAsync(ingredientId, cancellationToken));

    [HttpPost("adjustments/{ingredientId:int}")]
    public async Task<ActionResult<IngredientResponse>> Adjust(
        int ingredientId, InventoryAdjustmentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await inventory.AdjustStockAsync(
            ingredientId, request, "Adjustment", cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("receipts/{ingredientId:int}")]
    public async Task<ActionResult<IngredientResponse>> Receive(
        int ingredientId, InventoryAdjustmentRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Quantity <= 0)
            return BadRequest(new { message = "Số lượng nhập phải lớn hơn 0." });

        var result = await inventory.AdjustStockAsync(
            ingredientId, request, "Receipt", cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }
}
