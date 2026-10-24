using backend.DTOs.Inventory;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/ingredients")]
public sealed class IngredientsController(IInventoryService inventory) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<IngredientResponse>>> GetAll(
        CancellationToken cancellationToken)
        => Ok(await inventory.GetIngredientsAsync(cancellationToken));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<IngredientResponse>> Get(
        int id, CancellationToken cancellationToken)
    {
        var result = await inventory.GetIngredientAsync(id, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<IngredientResponse>> Create(
        CreateIngredientRequest request, CancellationToken cancellationToken)
    {
        var result = await inventory.CreateIngredientAsync(request, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<IngredientResponse>> Update(
        int id, UpdateIngredientRequest request, CancellationToken cancellationToken)
    {
        var result = await inventory.UpdateIngredientAsync(id, request, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }
}
