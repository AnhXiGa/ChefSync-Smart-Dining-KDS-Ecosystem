using backend.DTOs.Notifications;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/notifications")]
public sealed class NotificationsController(
    INotificationService notificationService) : ApiScaffoldController
{
    [HttpGet]
    [ProducesResponseType(typeof(NotificationPageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<NotificationPageResponse>> GetNotifications(
        [FromQuery] int? userId,
        CancellationToken cancellationToken,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 5)
    {
        if (!IsValidUserId(userId))
            return BadRequest(InvalidUserId());

        if (page < 1 || pageSize is < 1 or > 20)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Tham số phân trang không hợp lệ.",
                Detail = "page phải từ 1 trở lên và pageSize phải từ 1 đến 20."
            });
        }

        var notifications = await notificationService.GetNotificationsAsync(
            userId!.Value,
            page,
            pageSize,
            cancellationToken);
        return Ok(notifications);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(NotificationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<NotificationResponse>> GetNotification(
        int id,
        [FromQuery] int? userId,
        CancellationToken cancellationToken)
    {
        if (!IsValidUserId(userId))
            return BadRequest(InvalidUserId());

        var notification = await notificationService.GetNotificationAsync(
            id,
            userId!.Value,
            cancellationToken);
        return notification is null ? NotFound() : Ok(notification);
    }

    [HttpPatch("{id:int}/read")]
    [ProducesResponseType(typeof(NotificationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<NotificationResponse>> MarkAsRead(
        int id,
        [FromQuery] int? userId,
        CancellationToken cancellationToken)
    {
        if (!IsValidUserId(userId))
            return BadRequest(InvalidUserId());

        var notification = await notificationService.MarkAsReadAsync(
            id,
            userId!.Value,
            cancellationToken);
        return notification is null ? NotFound() : Ok(notification);
    }

    [HttpPatch("read-all")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> MarkAllAsRead(
        [FromQuery] int? userId,
        CancellationToken cancellationToken)
    {
        if (!IsValidUserId(userId))
            return BadRequest(InvalidUserId());

        var updatedCount = await notificationService.MarkAllAsReadAsync(
            userId!.Value,
            cancellationToken);
        return Ok(new { updatedCount });
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteNotification(
        int id,
        [FromQuery] int? userId,
        CancellationToken cancellationToken)
    {
        if (!IsValidUserId(userId))
            return BadRequest(InvalidUserId());

        var deleted = await notificationService.DeleteNotificationAsync(
            id,
            userId!.Value,
            cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    private static bool IsValidUserId(int? userId) => userId is > 0;

    private static ProblemDetails InvalidUserId() => new()
    {
        Status = StatusCodes.Status400BadRequest,
        Title = "Thiếu hoặc sai userId.",
        Detail = "Cần truyền userId hợp lệ để truy cập notifications."
    };
}
