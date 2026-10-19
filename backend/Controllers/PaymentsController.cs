using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/payments")]
public sealed class PaymentsController : ApiScaffoldController
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetPayments()
        => NotImplementedForDemo();

    [HttpGet("/api/orders/{orderId:int}/payments")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetOrderPayments(int orderId)
        => NotImplementedForDemo();

    [HttpPost("{id:int}/confirm")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult ConfirmPayment(int id)
        => NotImplementedForDemo();

    [HttpPost("{id:int}/fail")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult FailPayment(int id)
        => NotImplementedForDemo();

    [HttpPost("{id:int}/refund")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult RefundPayment(int id, [FromBody] JsonElement request)
        => NotImplementedForDemo();
}
