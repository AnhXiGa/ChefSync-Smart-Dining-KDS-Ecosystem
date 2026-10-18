using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/auth")]
public sealed class AuthController : ApiScaffoldController
{
    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult Login([FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult Logout()
        => NotImplementedForDemo();

    [HttpGet("me")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetCurrentUser()
        => NotImplementedForDemo();

    [HttpPost("refresh-token")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult RefreshToken([FromBody] JsonElement request)
        => NotImplementedForDemo();
}
