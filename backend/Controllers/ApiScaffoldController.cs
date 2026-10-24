using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
public abstract class ApiScaffoldController : ControllerBase
{
    protected IActionResult NotImplementedForDemo()
    {
        return StatusCode(
            StatusCodes.Status501NotImplemented,
            new
            {
                message = "This endpoint is scaffolded for the API demo. Implement its business logic."
            });
    }
}
