using backend.DTOs.Payments;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentController(
        IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    // =========================================================
    // CREATE PAYMENT
    // =========================================================

    [HttpPost]
    public async Task<IActionResult> CreatePayment(
        [FromBody] CreatePaymentRequest request)
    {
        try
        {
            var result =
                await _paymentService
                    .CreatePaymentAsync(request);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // =========================================================
    // GET PAYMENT
    // =========================================================

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(
        int id)
    {
        var result =
            await _paymentService
                .GetByIdAsync(id);

        if (result == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy giao dịch."
            });
        }

        return Ok(result);
    }

    // =========================================================
    // GET PAYMENT BY ORDER
    // =========================================================

    [HttpGet("order/{orderId:int}")]
    public async Task<IActionResult> GetByOrderId(
        int orderId)
    {
        var result =
            await _paymentService
                .GetByOrderIdAsync(orderId);

        if (result == null)
        {
            return NotFound(new
            {
                message =
                    "Đơn hàng chưa có giao dịch thanh toán."
            });
        }

        return Ok(result);
    }

    // =========================================================
    // CONFIRM CASH
    // =========================================================

    [HttpPost("{id:int}/confirm-cash")]
    public async Task<IActionResult> ConfirmCash(
        int id)
    {
        try
        {
            var result =
                await _paymentService
                    .ConfirmCashPaymentAsync(id);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // =========================================================
    // CANCEL
    // =========================================================

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(
        int id)
    {
        try
        {
            var result =
                await _paymentService
                    .CancelPaymentAsync(id);

            if (!result)
            {
                return NotFound(new
                {
                    message =
                        "Không tìm thấy giao dịch."
                });
            }

            return Ok(new
            {
                message =
                    "Hủy giao dịch thành công."
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // =========================================================
    // SEPAY WEBHOOK
    // =========================================================

    [HttpPost("webhook/sepay")]
    [Consumes("application/json")]
    public async Task<IActionResult> SePayWebhook(
        [FromBody] SePayWebhookRequest request)
    {
        try
        {
            var result =
                await _paymentService
                    .ProcessSePayWebhookAsync(request);

            return Ok(new
            {
                success = result
            });
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
}