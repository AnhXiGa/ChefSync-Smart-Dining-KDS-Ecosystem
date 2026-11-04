using backend.DTOs.Kds;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/kds")]
public sealed class KdsController(IKdsService kdsService)
    : ApiScaffoldController
{
    [HttpGet("orders")]
    [ProducesResponseType(typeof(KdsOrdersPageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<KdsOrdersPageResponse>> GetOrders(
        CancellationToken cancellationToken,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 6)
    {
        try
        {
            return Ok(await kdsService.GetOrdersAsync(
                page,
                pageSize,
                cancellationToken));
        }
        catch (ArgumentOutOfRangeException exception)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Tham số phân trang không hợp lệ.",
                Detail = exception.Message
            });
        }
    }

    [HttpGet("order-items")]
    [ProducesResponseType(typeof(IReadOnlyList<KdsOrderItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IReadOnlyList<KdsOrderItemResponse>>> GetOrderItems(
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        try
        {
            var items = await kdsService.GetOrderItemsAsync(
                status,
                cancellationToken);
            return Ok(items);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Trạng thái món không hợp lệ.",
                Detail = exception.Message
            });
        }
    }

    [HttpPatch("order-items/{itemId:int}/accept")]
    [ProducesResponseType(typeof(KdsOrderItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public Task<ActionResult<KdsOrderItemResponse>> AcceptOrderItem(
        int itemId,
        CancellationToken cancellationToken) =>
        UpdateItemStatus(itemId, "Accepted", cancellationToken);

    [HttpPatch("order-items/{itemId:int}/start")]
    [ProducesResponseType(typeof(KdsOrderItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public Task<ActionResult<KdsOrderItemResponse>> StartOrderItem(
        int itemId,
        CancellationToken cancellationToken) =>
        UpdateItemStatus(itemId, "Preparing", cancellationToken);

    [HttpPatch("order-items/{itemId:int}/ready")]
    [ProducesResponseType(typeof(KdsOrderItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public Task<ActionResult<KdsOrderItemResponse>> MarkOrderItemReady(
        int itemId,
        CancellationToken cancellationToken) =>
        UpdateItemStatus(itemId, "Ready", cancellationToken);

    [HttpPatch("order-items/{itemId:int}/served")]
    [ProducesResponseType(typeof(KdsOrderItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public Task<ActionResult<KdsOrderItemResponse>> MarkOrderItemServed(
        int itemId,
        CancellationToken cancellationToken) =>
        UpdateItemStatus(itemId, "Served", cancellationToken);

    [HttpGet("summary")]
    [ProducesResponseType(typeof(KdsSummaryResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<KdsSummaryResponse>> GetSummary(
        CancellationToken cancellationToken)
    {
        var summary = await kdsService.GetSummaryAsync(cancellationToken);
        return Ok(summary);
    }

    private async Task<ActionResult<KdsOrderItemResponse>> UpdateItemStatus(
        int itemId,
        string targetStatus,
        CancellationToken cancellationToken)
    {
        try
        {
            var item = await kdsService.UpdateItemStatusAsync(
                itemId,
                targetStatus,
                cancellationToken);

            return item is null ? NotFound() : Ok(item);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Trạng thái món không hợp lệ.",
                Detail = exception.Message
            });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Không thể cập nhật trạng thái món.",
                Detail = exception.Message
            });
        }
    }
}
