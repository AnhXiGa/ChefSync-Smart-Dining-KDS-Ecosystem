using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/inventory")]
public sealed class InventoryController : ApiScaffoldController
{
    [HttpGet("low-stock")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetLowStock()
        => NotImplementedForDemo();

    [HttpGet("transactions")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetTransactions()
        => NotImplementedForDemo();

    [HttpGet("transactions/{id:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetTransaction(int id)
        => NotImplementedForDemo();

    [HttpPost("adjustments")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult CreateAdjustment([FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpPost("issues")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult CreateIssue([FromBody] JsonElement request)
        => NotImplementedForDemo();
}
