using backend.Data;
using backend.DTOs.Reports;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/reports")]
public sealed class ReportsController(AppDbContext context) : ApiScaffoldController
{
    [HttpGet("financial")]
    [ProducesResponseType(typeof(FinancialReportResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<FinancialReportResponse>> GetFinancialReport(
        [FromQuery] DateTimeOffset from,
        [FromQuery] DateTimeOffset to,
        [FromQuery] string? paymentMethod,
        [FromQuery] int utcOffsetMinutes = 0,
        CancellationToken cancellationToken = default)
    {
        if (from >= to)
            return BadRequest(new { message = "Ngày bắt đầu phải trước ngày kết thúc." });
        if (utcOffsetMinutes is < -840 or > 840)
            return BadRequest(new { message = "Múi giờ không hợp lệ." });

        var startUtc = from.UtcDateTime;
        var endUtc = to.UtcDateTime;
        var normalizedMethod = NormalizePaymentMethod(paymentMethod);
        if (normalizedMethod == string.Empty)
            return BadRequest(new { message = "Phương thức thanh toán không hợp lệ." });

        var paidPaymentsQuery = context.Payments.AsNoTracking()
            .Where(payment =>
                payment.Status == "Paid" &&
                payment.PaidAt >= startUtc &&
                payment.PaidAt < endUtc);

        if (normalizedMethod is not null)
            paidPaymentsQuery = paidPaymentsQuery.Where(
                payment => payment.PaymentMethod == normalizedMethod);

        var paidPayments = await paidPaymentsQuery
            .Select(payment => new
            {
                payment.OrderId,
                payment.Amount,
                payment.PaymentMethod,
                PaidAt = payment.PaidAt!.Value
            })
            .ToListAsync(cancellationToken);

        var revenue = paidPayments.Sum(payment => payment.Amount);
        var paidOrderIds = paidPayments
            .Select(payment => payment.OrderId)
            .Distinct()
            .ToList();

        var pendingOrdersQuery = context.Orders.AsNoTracking()
            .Where(order =>
                order.CreatedAt >= startUtc &&
                order.CreatedAt < endUtc &&
                order.Status != "Cancelled" &&
                order.Status != "Completed" &&
                !order.Payments.Any(payment => payment.Status == "Paid"));

        if (normalizedMethod is not null)
        {
            pendingOrdersQuery = pendingOrdersQuery.Where(
                order => order.Payments.Any(payment =>
                    payment.Status == "Pending" &&
                    payment.PaymentMethod == normalizedMethod));
        }

        var pendingOrders = await pendingOrdersQuery
            .Select(order => order.TotalAmount)
            .ToListAsync(cancellationToken);

        var paymentMethods = paidPayments
            .GroupBy(payment => payment.PaymentMethod)
            .Select(group => new FinancialPaymentMethod(
                group.Key,
                group.Count(),
                group.Sum(payment => payment.Amount)))
            .OrderByDescending(method => method.Amount)
            .ToList();

        var useHourlyTrend = endUtc - startUtc <= TimeSpan.FromDays(1);
        var revenueTrend = paidPayments
            .GroupBy(payment =>
            {
                var localTime = DateTime.SpecifyKind(
                    payment.PaidAt,
                    DateTimeKind.Utc).AddMinutes(utcOffsetMinutes);
                return useHourlyTrend
                    ? localTime.ToString("HH:00")
                    : localTime.ToString("dd/MM");
            })
            .Select(group => new FinancialTrendPoint(
                group.Key,
                group.Sum(payment => payment.Amount)))
            .OrderBy(point => point.Label)
            .ToList();

        var paidOrderItems = await context.OrderItems.AsNoTracking()
            .Where(item => paidOrderIds.Contains(item.OrderId))
            .Select(item => new
            {
                item.ProductName,
                item.Quantity,
                item.Subtotal
            })
            .ToListAsync(cancellationToken);

        var topProducts = paidOrderItems
            .GroupBy(item => item.ProductName)
            .Select(group => new FinancialTopProduct(
                group.Key,
                group.Sum(item => item.Quantity),
                group.Sum(item => item.Subtotal)))
            .OrderByDescending(product => product.Quantity)
            .Take(10)
            .ToList();

        var inventoryIssues = await context.InventoryTransactions.AsNoTracking()
            .Where(transaction =>
                transaction.Type == "Issue" &&
                transaction.CreatedAt >= startUtc &&
                transaction.CreatedAt < endUtc)
            .Select(transaction => new
            {
                transaction.Ingredient.Name,
                transaction.Ingredient.Unit,
                Quantity = Math.Abs(transaction.Quantity),
                CostPerUnit = transaction.Ingredient.CostPerUnit ?? 0m
            })
            .ToListAsync(cancellationToken);

        var ingredientCosts = inventoryIssues
            .GroupBy(issue => new { issue.Name, issue.Unit })
            .Select(group => new FinancialIngredientCost(
                group.Key.Name,
                group.Key.Unit,
                group.Sum(issue => issue.Quantity),
                group.Sum(issue => issue.Quantity * issue.CostPerUnit)))
            .OrderByDescending(ingredient => ingredient.Cost)
            .ToList();

        return Ok(new FinancialReportResponse(
            revenue,
            paidOrderIds.Count,
            paidOrderIds.Count == 0 ? 0 : revenue / paidOrderIds.Count,
            pendingOrders.Sum(),
            pendingOrders.Count,
            ingredientCosts.Sum(ingredient => ingredient.Cost),
            revenueTrend,
            paymentMethods,
            topProducts,
            ingredientCosts));
    }

    private static string? NormalizePaymentMethod(string? paymentMethod)
        => paymentMethod?.Trim().ToUpperInvariant() switch
        {
            null or "" or "ALL" => null,
            "CASH" or "TIỀN MẶT" => "Cash",
            "BANKTRANSFER" or "BANK TRANSFER" or "CHUYỂN KHOẢN" or "QR"
                => "BankTransfer",
            _ => string.Empty
        };

    [HttpGet("revenue")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetRevenue()
        => NotImplementedForDemo();

    [HttpGet("orders")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetOrders()
        => NotImplementedForDemo();

    [HttpGet("top-products")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetTopProducts()
        => NotImplementedForDemo();

    [HttpGet("inventory")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetInventory()
        => NotImplementedForDemo();

    [HttpGet("purchases")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetPurchases()
        => NotImplementedForDemo();
}
