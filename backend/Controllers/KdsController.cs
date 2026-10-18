using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/kds")]
public sealed class KdsController : ApiScaffoldController
{
    [HttpGet("orders")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetOrders()
        => NotImplementedForDemo();

    [HttpGet("order-items")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetOrderItems()
        => NotImplementedForDemo();

    [HttpPatch("order-items/{itemId:int}/accept")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult AcceptOrderItem(int itemId)
        => NotImplementedForDemo();

    [HttpPatch("order-items/{itemId:int}/start")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult StartOrderItem(int itemId)
        => NotImplementedForDemo();

    [HttpPatch("order-items/{itemId:int}/ready")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult MarkOrderItemReady(int itemId)
        => NotImplementedForDemo();

    [HttpPatch("order-items/{itemId:int}/served")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult MarkOrderItemServed(int itemId)
        => NotImplementedForDemo();

    [HttpGet("summary")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetSummary()
        => NotImplementedForDemo();
}
