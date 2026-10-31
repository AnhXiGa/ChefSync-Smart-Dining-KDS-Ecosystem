using System.Text.Json;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/auth")]
public sealed class AuthController(AppDbContext context) : ApiScaffoldController
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await context.Users
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(x => x.Email == request.Email.Trim());

        if (user is null || !user.IsActive)
            return Unauthorized(new { message = "Email hoặc mật khẩu không đúng." });

        var result = new PasswordHasher<User>()
            .VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
            return Unauthorized(new { message = "Email hoặc mật khẩu không đúng." });

        return Ok(new
        {
            user = new
            {
                user.Id,
                user.FullName,
                user.Email,
                roles = user.UserRoles.Select(x => x.Role.Name)
            }
        });
    }

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

public sealed record LoginRequest(string Email, string Password);
