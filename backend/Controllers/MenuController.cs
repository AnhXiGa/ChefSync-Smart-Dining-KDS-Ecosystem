using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/menu")]
public sealed class MenuController : ApiScaffoldController
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetMenu()
        => NotImplementedForDemo();

    [HttpGet("categories/{categoryId:int}/products")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetProductsByCategory(int categoryId)
        => NotImplementedForDemo();
}
