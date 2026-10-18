using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/purchase-orders")]
public sealed class PurchaseOrdersController : ApiScaffoldController
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetPurchaseOrders()
        => NotImplementedForDemo();

    [HttpGet("{id:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetPurchaseOrder(int id)
        => NotImplementedForDemo();

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult CreatePurchaseOrder([FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult UpdatePurchaseOrder(int id, [FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpPost("{id:int}/items")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult AddPurchaseOrderItem(int id, [FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpPut("{id:int}/items/{itemId:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult UpdatePurchaseOrderItem(
        int id,
        int itemId,
        [FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpDelete("{id:int}/items/{itemId:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult DeletePurchaseOrderItem(int id, int itemId)
        => NotImplementedForDemo();

    [HttpPatch("{id:int}/receive")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult ReceivePurchaseOrder(int id)
        => NotImplementedForDemo();

    [HttpPatch("{id:int}/cancel")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult CancelPurchaseOrder(int id)
        => NotImplementedForDemo();
}
