using System.Text.Json;
using backend.DTOs.Payments;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/payments")]
[Route("api/payment")]
public sealed class PaymentsController(
    IPaymentService paymentService) : ApiScaffoldController
{
    [HttpPost]
    public async Task<IActionResult> CreatePayment(
        [FromBody] CreatePaymentRequest request)
    {
        try
        {
            var payment = await paymentService.CreatePaymentAsync(request);
            return Ok(payment);
        }
        catch (Exception exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var payment = await paymentService.GetByIdAsync(id);
        return payment is null
            ? NotFound(new { message = "Không tìm thấy giao dịch." })
            : Ok(payment);
    }

    [HttpGet("order/{orderId:int}")]
    public async Task<IActionResult> GetByOrderId(int orderId)
    {
        var payment = await paymentService.GetByOrderIdAsync(orderId);
        return payment is null
            ? NotFound(new
            {
                message = "Đơn hàng chưa có giao dịch thanh toán."
            })
            : Ok(payment);
    }

    [HttpPost("{id:int}/confirm-cash")]
    public async Task<IActionResult> ConfirmCash(int id)
    {
        try
        {
            var payment = await paymentService.ConfirmCashPaymentAsync(id);
            return Ok(payment);
        }
        catch (Exception exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        try
        {
            var cancelled = await paymentService.CancelPaymentAsync(id);
            if (!cancelled)
                return NotFound(new { message = "Không tìm thấy giao dịch." });

            return Ok(new { message = "Hủy giao dịch thành công." });
        }
        catch (Exception exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("webhook/sepay")]
    [Consumes("application/json")]
    public async Task<IActionResult> SePayWebhook(
        [FromBody] SePayWebhookRequest request)
    {
        try
        {
            var result = await paymentService.ProcessSePayWebhookAsync(request);
            return Ok(new { success = result });
        }
        catch
        {
            return StatusCode(500, new
            {
                success = false,
                message = "Webhook processing failed."
            });
        }
    }

    [HttpGet]
    public IActionResult GetPayments() =>
        NotImplementedForDemo();

    [HttpGet("/api/orders/{orderId:int}/payments")]
    public IActionResult GetOrderPayments(int orderId) =>
        NotImplementedForDemo();

    [HttpPost("{id:int}/confirm")]
    public IActionResult ConfirmPayment(int id) =>
        NotImplementedForDemo();

    [HttpPost("{id:int}/fail")]
    public IActionResult FailPayment(int id) =>
        NotImplementedForDemo();

    [HttpPost("{id:int}/refund")]
    public IActionResult RefundPayment(
        int id,
        [FromBody] JsonElement request) =>
        NotImplementedForDemo();
}
