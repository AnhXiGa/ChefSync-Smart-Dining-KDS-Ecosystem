using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/orders/{orderId:int}")]
public sealed class OrderDocumentsController : ApiScaffoldController
{
    [HttpGet("invoice")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetInvoice(int orderId)
        => NotImplementedForDemo();

    [HttpGet("receipt")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetReceipt(int orderId)
        => NotImplementedForDemo();
}
