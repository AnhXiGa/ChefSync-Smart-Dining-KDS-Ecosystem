using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/notifications")]
public sealed class NotificationsController : ApiScaffoldController
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetNotifications()
        => NotImplementedForDemo();

    [HttpGet("{id:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetNotification(int id)
        => NotImplementedForDemo();

    [HttpPatch("{id:int}/read")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult MarkAsRead(int id)
        => NotImplementedForDemo();

    [HttpPatch("read-all")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult MarkAllAsRead()
        => NotImplementedForDemo();

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult DeleteNotification(int id)
        => NotImplementedForDemo();
}
