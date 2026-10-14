using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/reports")]
public sealed class ReportsController : ApiScaffoldController
{
    [HttpGet("revenue")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetRevenue()
        => NotImplementedForDemo();

    [HttpGet("orders")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetOrders()
        => NotImplementedForDemo();

    [HttpGet("top-products")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetTopProducts()
        => NotImplementedForDemo();

    [HttpGet("inventory")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetInventory()
        => NotImplementedForDemo();

    [HttpGet("purchases")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetPurchases()
        => NotImplementedForDemo();
}
