using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/orders")]
public sealed class OrdersController : ApiScaffoldController
{
    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult UpdateOrder(int id, [FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpPatch("{id:int}/status")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult UpdateOrderStatus(int id, [FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpPost("{id:int}/confirm")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult ConfirmOrder(int id)
        => NotImplementedForDemo();

    [HttpGet("{orderId:int}/items")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetOrderItems(int orderId)
        => NotImplementedForDemo();

    [HttpPost("{orderId:int}/items")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult CreateOrderItem(int orderId, [FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpPut("{orderId:int}/items/{itemId:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult UpdateOrderItem(
        int orderId,
        int itemId,
        [FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpDelete("{orderId:int}/items/{itemId:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult DeleteOrderItem(int orderId, int itemId)
        => NotImplementedForDemo();

    [HttpPatch("{orderId:int}/items/{itemId:int}/status")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult UpdateOrderItemStatus(
        int orderId,
        int itemId,
        [FromBody] JsonElement request)
        => NotImplementedForDemo();
}
