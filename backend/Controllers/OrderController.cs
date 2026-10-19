using backend.DTOs.Orders;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/order")]
public class OrderController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrderController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    // POST /api/orders
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateOrderRequest request)
    {
        try
        {
            var result =
                await _orderService.CreateOrderAsync(request);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // GET /api/orders
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result =
            await _orderService.GetAllAsync();

        return Ok(result);
    }

    // GET /api/orders/1
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result =
            await _orderService.GetByIdAsync(id);

        if (result == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy đơn hàng."
            });
        }

        return Ok(result);
    }

    // GET /api/orders/table/1
    [HttpGet("table/{tableId:int}")]
    public async Task<IActionResult> GetByTable(
        int tableId)
    {
        var result =
            await _orderService
                .GetByTableIdAsync(tableId);

        return Ok(result);
    }

    // PUT /api/orders/1/status
    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        [FromBody] UpdateOrderStatusRequest request)
    {
        try
        {
            var result =
                await _orderService
                    .UpdateStatusAsync(id, request);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // POST /api/orders/1/transfer-table
    [HttpPost("{id:int}/transfer-table")]
    public async Task<IActionResult> TransferTable(
        int id,
        [FromBody] TransferTableRequest request)
    {
        try
        {
            var result =
                await _orderService
                    .TransferTableAsync(id, request);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // POST /api/orders/merge
    [HttpPost("merge")]
    public async Task<IActionResult> Merge(
        [FromBody] MergeOrderRequest request)
    {
        try
        {
            var result =
                await _orderService
                    .MergeOrdersAsync(request);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // POST /api/orders/1/split
    [HttpPost("{id:int}/split")]
    public async Task<IActionResult> Split(
        int id,
        [FromBody] SplitOrderRequest request)
    {
        try
        {
            var result =
                await _orderService
                    .SplitOrderAsync(id, request);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // POST /api/orders/1/cancel
    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        try
        {
            var result =
                await _orderService
                    .CancelOrderAsync(id);

            if (!result)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy đơn hàng."
                });
            }

            return Ok(new
            {
                message = "Hủy đơn hàng thành công."
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }
}