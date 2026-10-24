using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/users")]
public sealed class UsersController : ApiScaffoldController
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetUsers()
        => NotImplementedForDemo();

    [HttpGet("{id:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetUser(int id)
        => NotImplementedForDemo();

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult CreateUser([FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult UpdateUser(int id, [FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpPatch("{id:int}/status")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult UpdateUserStatus(int id, [FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpPut("{id:int}/roles")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult UpdateUserRoles(int id, [FromBody] JsonElement request)
        => NotImplementedForDemo();
}
