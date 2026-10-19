using System.Text.Json;
using backend.DTOs.Orders;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/orders")]
public sealed class OrdersController : ApiScaffoldController
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetOrders()
        => NotImplementedForDemo();

    [HttpGet("{id:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetOrder(int id)
        => NotImplementedForDemo();

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult CreateOrder([FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult UpdateOrder(int id, [FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateOrderStatus(
        int id,
        [FromBody] UpdateOrderStatusRequest request)
    {
        try
        {
            return Ok(await _orderService.UpdateStatusAsync(id, request));
        }
        catch (Exception exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("{id:int}/confirm")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult ConfirmOrder(int id)
        => NotImplementedForDemo();

    [HttpPost("{id:int}/cancel")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult CancelOrder(int id)
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
