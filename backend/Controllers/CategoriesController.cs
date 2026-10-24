using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/categories")]
public sealed class CategoriesController : ApiScaffoldController
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetCategories()
        => NotImplementedForDemo();

    [HttpGet("{id:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetCategory(int id)
        => NotImplementedForDemo();

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult CreateCategory([FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult UpdateCategory(int id, [FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpPatch("{id:int}/status")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult UpdateCategoryStatus(int id, [FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult DeleteCategory(int id)
        => NotImplementedForDemo();
}
