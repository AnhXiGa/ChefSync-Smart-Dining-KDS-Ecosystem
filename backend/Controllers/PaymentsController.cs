using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using backend.Configuration;
using backend.DTOs.Payments;
using Microsoft.Extensions.Options;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/payments")]
[Route("api/payment")]
public sealed class PaymentsController(
    IPaymentService paymentService,
    IOptions<PaymentOptions> paymentOptions) : ApiScaffoldController
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
        return Ok(payment);
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
        if (!IsValidSePayRequest())
        {
            return Unauthorized(new
            {
                success = false,
                message = "SePay webhook authentication failed."
            });
        }

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

    private bool IsValidSePayRequest()
    {
        var configuredToken =
            paymentOptions.Value.SePayAccessToken;

        if (string.IsNullOrWhiteSpace(configuredToken))
        {
            return false;
        }

        var authorization =
            Request.Headers.Authorization.ToString();

        var token = authorization.StartsWith(
                "Apikey ",
                StringComparison.OrdinalIgnoreCase)
            ? authorization["Apikey ".Length..].Trim()
            : authorization.StartsWith(
                "Bearer ",
                StringComparison.OrdinalIgnoreCase)
                ? authorization["Bearer ".Length..].Trim()
                : !string.IsNullOrWhiteSpace(authorization)
                    ? authorization.Trim()
                    : Request.Headers["X-API-Key"].ToString().Trim();

        if (string.IsNullOrWhiteSpace(token))
        {
            token = Request.Headers["ApiKey"].ToString().Trim();
        }

        if (string.IsNullOrWhiteSpace(token))
        {
            token = Request.Headers["SePay-API-Key"].ToString().Trim();
        }

        return !string.IsNullOrWhiteSpace(token) &&
            CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(token),
                Encoding.UTF8.GetBytes(configuredToken));
    }

    [HttpGet]
    public async Task<IActionResult> GetPayments()
        => Ok(await paymentService.GetHistoryAsync());

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
