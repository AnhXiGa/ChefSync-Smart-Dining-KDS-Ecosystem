using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/roles")]
public sealed class RolesController : ApiScaffoldController
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetRoles()
        => NotImplementedForDemo();

    [HttpGet("{id:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetRole(int id)
        => NotImplementedForDemo();
}
