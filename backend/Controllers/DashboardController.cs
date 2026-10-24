using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/dashboard")]
public sealed class DashboardController : ApiScaffoldController
{
    [HttpGet("overview")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetOverview()
        => NotImplementedForDemo();

    [HttpGet("tables")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetTables()
        => NotImplementedForDemo();
}
