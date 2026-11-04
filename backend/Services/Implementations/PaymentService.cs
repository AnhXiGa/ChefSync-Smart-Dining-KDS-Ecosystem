using System.Text;
using backend.Configuration;
using backend.Data;
using backend.DTOs.Payments;
using backend.Models;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace backend.Services.Implementations;

public class PaymentService : IPaymentService
{
    private readonly AppDbContext _context;
    private readonly PaymentOptions _paymentOptions;

    public PaymentService(
        AppDbContext context,
        IOptions<PaymentOptions> paymentOptions)
    {
        _context = context;
        _paymentOptions = paymentOptions.Value;
    }

    // =========================================================
    // CREATE PAYMENT
    // =========================================================

    public async Task<PaymentResponse> CreatePaymentAsync(
        CreatePaymentRequest request)
    {
        var order = await _context.Orders
            .Include(x => x.OrderItems)
            .FirstOrDefaultAsync(x => x.Id == request.OrderId);

        if (order == null)
            throw new Exception("Không tìm thấy đơn hàng.");

        if (order.Status == "Completed")
            throw new Exception("Đơn hàng đã hoàn thành.");

        if (order.Status == "Cancelled")
            throw new Exception("Đơn hàng đã bị hủy.");

        var activeItems = order.OrderItems
            .Where(item => item.Status != "Cancelled")
            .ToList();

        if (activeItems.Count == 0)
            throw new Exception("Đơn hàng không còn món hợp lệ để thanh toán.");

        if (activeItems.Any(item => item.Status != "Served"))
            throw new Exception("Khách hàng chỉ được thanh toán sau khi đã nhận đủ tất cả món.");

        var paymentMethod =
            request.PaymentMethod.Trim();

        if (paymentMethod != "Cash" &&
            paymentMethod != "BankTransfer")
        {
            throw new Exception(
                "Phương thức thanh toán không hợp lệ. " +
                "Chỉ hỗ trợ Cash hoặc BankTransfer.");
        }

        // =====================================================
        // CASH
        // =====================================================

        if (paymentMethod == "Cash")
        {
            if (!request.ReceivedAmount.HasValue)
            {
                throw new Exception(
                    "Vui lòng nhập số tiền khách đưa.");
            }

            if (request.ReceivedAmount.Value <= 0)
            {
                throw new Exception(
                    "Số tiền khách đưa phải lớn hơn 0.");
            }

            if (request.ReceivedAmount.Value < order.TotalAmount)
            {
                throw new Exception(
                    "Số tiền khách đưa không đủ.");
            }

            var change =
                request.ReceivedAmount.Value
                - order.TotalAmount;

            var cashPayment = new Payment
            {
                OrderId = order.Id,

                Amount = order.TotalAmount,

                PaymentMethod = "Cash",

                // Chưa bấm xác nhận
                Status = "Pending",

                ReceivedAmount =
                    request.ReceivedAmount.Value,

                ChangeAmount = change,

                CreatedAt = DateTime.UtcNow
            };

            _context.Payments.Add(cashPayment);

            await _context.SaveChangesAsync();

            return MapToResponse(cashPayment);
        }

        // =====================================================
        // BANK TRANSFER
        // =====================================================

        var existingPayment = await _context.Payments
            .FirstOrDefaultAsync(x =>
                x.OrderId == order.Id &&
                x.PaymentMethod == "BankTransfer" &&
                x.Status == "Pending");

        if (existingPayment != null)
        {
            if (!existingPayment.TransferContent?
                    .StartsWith("peo-", StringComparison.OrdinalIgnoreCase)
                ?? true)
            {
                existingPayment.TransferContent =
                    GenerateTransferContent(order.Id);
                existingPayment.QrCodeUrl =
                    GenerateVietQrUrl(
                        order.TotalAmount,
                        existingPayment.TransferContent);

                await _context.SaveChangesAsync();
            }

            return MapToResponse(existingPayment);
        }

        var transferContent =
            GenerateTransferContent(order.Id);

        var qrCodeUrl =
            GenerateVietQrUrl(
                order.TotalAmount,
                transferContent);

        var bankPayment = new Payment
        {
            OrderId = order.Id,

            Amount = order.TotalAmount,

            PaymentMethod = "BankTransfer",

            Status = "Pending",

            TransferContent = transferContent,

            QrCodeUrl = qrCodeUrl,

            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(bankPayment);

        await _context.SaveChangesAsync();

        return MapToResponse(bankPayment);
    }

    // =========================================================
    // GET BY ID
    // =========================================================

    public async Task<PaymentResponse?> GetByIdAsync(int id)
    {
        var payment = await _context.Payments
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (payment == null)
            return null;

        return MapToResponse(payment);
    }

    // =========================================================
    // GET BY ORDER
    // =========================================================

    public async Task<PaymentResponse?> GetByOrderIdAsync(
        int orderId)
    {
        var payment = await _context.Payments
            .AsNoTracking()
            .Where(x => x.OrderId == orderId)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();

        if (payment == null)
            return null;

        return MapToResponse(payment);
    }

    public async Task<List<PaymentHistoryResponse>> GetHistoryAsync()
    {
        return await _context.Payments
            .AsNoTracking()
            .Include(payment => payment.Order)
            .ThenInclude(order => order.Table)
            .OrderByDescending(payment => payment.CreatedAt)
            .Select(payment => new PaymentHistoryResponse
            {
                Id = payment.Id,
                OrderId = payment.OrderId,
                OrderCode = payment.Order.OrderCode,
                TableNumber = payment.Order.Table.TableNumber,
                Amount = payment.Amount,
                PaymentMethod = payment.PaymentMethod,
                Status = payment.Status,
                TransactionCode = payment.TransactionCode,
                PaidAt = payment.PaidAt,
                CreatedAt = payment.CreatedAt
            })
            .ToListAsync();
    }

    // =========================================================
    // CONFIRM CASH
    // =========================================================

    public async Task<PaymentResponse> ConfirmCashPaymentAsync(
        int paymentId)
    {
        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            var payment = await _context.Payments
                .Include(x => x.Order)
                .ThenInclude(x => x.Table)
                .FirstOrDefaultAsync(x => x.Id == paymentId);

            if (payment == null)
                throw new Exception(
                    "Không tìm thấy giao dịch.");

            if (payment.PaymentMethod != "Cash")
                throw new Exception(
                    "Chỉ giao dịch tiền mặt mới được xác nhận bằng API này.");

            if (payment.Status == "Paid")
                return MapToResponse(payment);

            if (payment.Status == "Cancelled")
                throw new Exception(
                    "Giao dịch đã bị hủy.");

            if (!payment.ReceivedAmount.HasValue)
                throw new Exception(
                    "Chưa có số tiền khách đưa.");

            if (payment.ReceivedAmount.Value < payment.Amount)
                throw new Exception(
                    "Số tiền khách đưa không đủ.");

            payment.ChangeAmount =
                payment.ReceivedAmount.Value
                - payment.Amount;

            payment.Status = "Paid";

            payment.PaidAt = DateTime.UtcNow;

            // Mã nội bộ cho giao dịch tiền mặt
            payment.TransactionCode =
                $"CASH-{payment.Id}";

            payment.Order.Status = "Completed";

            payment.Order.CompletedAt =
                DateTime.UtcNow;

            payment.Order.Table.Status = "Available";
            payment.Order.Table.VacatedAt = DateTime.UtcNow;

            payment.Order.Table.UpdatedAt =
                DateTime.UtcNow;

            payment.Order.UpdatedAt =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return MapToResponse(payment);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // =========================================================
    // CANCEL
    // =========================================================

    public async Task<bool> CancelPaymentAsync(int paymentId)
    {
        var payment = await _context.Payments
            .FirstOrDefaultAsync(x => x.Id == paymentId);

        if (payment == null)
            return false;

        if (payment.Status == "Paid")
            throw new Exception(
                "Không thể hủy giao dịch đã thanh toán.");

        if (payment.Status == "Cancelled")
            return true;

        payment.Status = "Cancelled";

        await _context.SaveChangesAsync();

        return true;
    }

    // =========================================================
    // SEPAY WEBHOOK
    // =========================================================

    public async Task<bool> ProcessSePayWebhookAsync(
        SePayWebhookRequest request)
    {
        // Chỉ nhận tiền vào
        if (!string.Equals(
                request.TransferType,
                "in",
                StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        // TransactionCode đã xử lý trước đó
        if (!string.IsNullOrWhiteSpace(
                request.ReferenceCode))
        {
            var duplicated =
                await _context.Payments.AnyAsync(x =>
                    x.TransactionCode ==
                    request.ReferenceCode);

            if (duplicated)
            {
                // Idempotent:
                // SePay gửi lại webhook thì không xử lý lần 2.
                return true;
            }
        }

        // Tìm payment đang Pending
        var pendingPayments =
            await _context.Payments
                .Include(x => x.Order)
            .ThenInclude(x => x.Table)
            .Where(x =>
                    x.PaymentMethod == "BankTransfer" &&
                    x.Status == "Pending")
                .ToListAsync();

        Payment? payment = null;

        foreach (var item in pendingPayments)
        {
            var content =
                item.TransferContent ?? string.Empty;

            var incomingContent =
                request.Content ?? string.Empty;

            if (ContainsPaymentCode(
                    incomingContent,
                    content))
            {
                payment = item;
                break;
            }

            if (!string.IsNullOrWhiteSpace(request.Code) &&
                ContainsPaymentCode(
                    request.Code,
                    content))
            {
                payment = item;
                break;
            }
        }

        if (payment == null)
            return false;

        // Kiểm tra số tiền
        if (request.TransferAmount != payment.Amount)
        {
            return false;
        }

        // Kiểm tra tài khoản nhận
        if (!string.IsNullOrWhiteSpace(
                _paymentOptions.BankAccount))
        {
            if (!string.Equals(
                    request.AccountNumber,
                    _paymentOptions.BankAccount,
                    StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }
        }

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            payment.Status = "Paid";

            payment.TransactionCode =
                request.ReferenceCode
                ?? request.Code
                ?? $"SEPAY-{request.Id}";

            payment.PaidAt =
                DateTime.UtcNow;

            payment.Order.Status =
                "Completed";

            payment.Order.CompletedAt =
                DateTime.UtcNow;

            payment.Order.Table.Status =
                "Available";
            payment.Order.Table.VacatedAt = DateTime.UtcNow;

            payment.Order.Table.UpdatedAt =
                DateTime.UtcNow;

            payment.Order.UpdatedAt =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // =========================================================
    // TRANSFER CONTENT
    // =========================================================

    private string GenerateTransferContent(
        int orderId)
    {
        // SePay test mode nhận diện mã theo mẫu peo-[6-8 chữ số].
        return $"peo-{orderId:D8}";
    }

    // =========================================================
    // VIETQR
    // =========================================================

    private string GenerateVietQrUrl(
        decimal amount,
        string transferContent)
    {
        var bank =
            Uri.EscapeDataString(
                _paymentOptions.BankCode);

        var account =
            Uri.EscapeDataString(
                _paymentOptions.BankAccount);

        var content =
            Uri.EscapeDataString(
                transferContent);

        return
            $"https://vietqr.app/img" +
            $"?acc={account}" +
            $"&bank={bank}" +
            $"&amount={amount:0}" +
            $"&des={content}";
    }

    // =========================================================
    // MATCH PAYMENT CODE
    // =========================================================

    private static bool ContainsPaymentCode(
        string source,
        string paymentCode)
    {
        if (string.IsNullOrWhiteSpace(source) ||
            string.IsNullOrWhiteSpace(paymentCode))
        {
            return false;
        }

        var normalizedSource = NormalizePaymentCode(source);
        var normalizedPaymentCode = NormalizePaymentCode(paymentCode);

        return normalizedSource.Contains(normalizedPaymentCode);
    }

    private static string NormalizePaymentCode(string value)
    {
        var builder = new StringBuilder(value.Length);

        foreach (var character in value)
        {
            if (char.IsLetterOrDigit(character))
            {
                builder.Append(char.ToUpperInvariant(character));
            }
        }

        return builder.ToString();
    }

    // =========================================================
    // MAP RESPONSE
    // =========================================================

    private static PaymentResponse MapToResponse(
        Payment payment)
    {
        return new PaymentResponse
        {
            Id = payment.Id,

            OrderId = payment.OrderId,

            Amount = payment.Amount,

            PaymentMethod =
                payment.PaymentMethod,

            Status =
                payment.Status,

            ReceivedAmount =
                payment.ReceivedAmount,

            ChangeAmount =
                payment.ChangeAmount,

            TransactionCode =
                payment.TransactionCode,

            TransferContent =
                payment.TransferContent,

            QrCodeUrl =
                payment.QrCodeUrl,

            PaidAt =
                payment.PaidAt,

            CreatedAt =
                payment.CreatedAt
        };
    }
}