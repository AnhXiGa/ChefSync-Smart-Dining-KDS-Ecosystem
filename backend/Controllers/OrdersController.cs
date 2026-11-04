using System.Text.Json;
using backend.DTOs.Orders;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/orders")]
[Route("api/order")]
public sealed class OrdersController(
    IOrderService orderService) : ApiScaffoldController
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var orders = await orderService.GetAllAsync();
        return Ok(orders);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await orderService.GetByIdAsync(id);
        return order is null
            ? NotFound(new { message = "Không tìm thấy đơn hàng." })
            : Ok(order);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateOrderRequest request)
    {
        try
        {
            var order = await orderService.CreateOrderAsync(request);
            return Ok(order);
        }
        catch (Exception exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpGet("table/{tableId:int}")]
    public async Task<IActionResult> GetByTable(int tableId)
    {
        var orders = await orderService.GetByTableIdAsync(tableId);
        return Ok(orders);
    }

    [HttpPut("{id:int}/status")]
    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        [FromBody] UpdateOrderStatusRequest request)
    {
        try
        {
            var order = await orderService.UpdateStatusAsync(id, request);
            return Ok(order);
        }
        catch (Exception exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPatch("{id:int}/discount")]
    public async Task<IActionResult> UpdateDiscount(
        int id,
        [FromBody] UpdateOrderDiscountRequest request)
    {
        try
        {
            return Ok(await orderService.UpdateDiscountAsync(id, request));
        }
        catch (Exception exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("{id:int}/transfer-table")]
    public async Task<IActionResult> TransferTable(
        int id,
        [FromBody] TransferTableRequest request)
    {
        try
        {
            var order = await orderService.TransferTableAsync(id, request);
            return Ok(order);
        }
        catch (Exception exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("merge")]
    public async Task<IActionResult> Merge(
        [FromBody] MergeOrderRequest request)
    {
        try
        {
            var order = await orderService.MergeOrdersAsync(request);
            return Ok(order);
        }
        catch (Exception exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("{id:int}/split")]
    public async Task<IActionResult> Split(
        int id,
        [FromBody] SplitOrderRequest request)
    {
        try
        {
            var order = await orderService.SplitOrderAsync(id, request);
            return Ok(order);
        }
        catch (Exception exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        try
        {
            var cancelled = await orderService.CancelOrderAsync(id);
            if (!cancelled)
                return NotFound(new { message = "Không tìm thấy đơn hàng." });

            return Ok(new { message = "Hủy đơn hàng thành công." });
        }
        catch (Exception exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPut("{id:int}")]
    public IActionResult UpdateOrder(
        int id,
        [FromBody] JsonElement request) =>
        NotImplementedForDemo();

    [HttpPost("{id:int}/confirm")]
    public IActionResult ConfirmOrder(int id) =>
        NotImplementedForDemo();

    [HttpGet("{orderId:int}/items")]
    public IActionResult GetOrderItems(int orderId) =>
        NotImplementedForDemo();

    [HttpPost("{orderId:int}/items")]
    public IActionResult CreateOrderItem(
        int orderId,
        [FromBody] JsonElement request) =>
        NotImplementedForDemo();

    [HttpPut("{orderId:int}/items/{itemId:int}")]
    public IActionResult UpdateOrderItem(
        int orderId,
        int itemId,
        [FromBody] JsonElement request) =>
        NotImplementedForDemo();

    [HttpDelete("{orderId:int}/items/{itemId:int}")]
    public IActionResult DeleteOrderItem(int orderId, int itemId) =>
        NotImplementedForDemo();

    [HttpPatch("{orderId:int}/items/{itemId:int}/status")]
    public IActionResult UpdateOrderItemStatus(
        int orderId,
        int itemId,
        [FromBody] JsonElement request) =>
        NotImplementedForDemo();
}
