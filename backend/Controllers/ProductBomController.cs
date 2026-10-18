using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/products/{productId:int}/bom")]
public sealed class ProductBomController : ApiScaffoldController
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetBillOfMaterials(int productId)
        => NotImplementedForDemo();

    [HttpPut]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult UpdateBillOfMaterials(int productId, [FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpPost("items")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult AddBillOfMaterialsItem(int productId, [FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpDelete("items/{ingredientId:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult DeleteBillOfMaterialsItem(int productId, int ingredientId)
        => NotImplementedForDemo();
}
