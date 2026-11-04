namespace backend.DTOs.Reports;

public sealed record FinancialReportResponse(
    decimal Revenue,
    int PaidOrderCount,
    decimal AveragePaidOrder,
    decimal PendingAmount,
    int PendingOrderCount,
    decimal IngredientCost,
    IReadOnlyList<FinancialTrendPoint> RevenueTrend,
    IReadOnlyList<FinancialPaymentMethod> PaymentMethods,
    IReadOnlyList<FinancialTopProduct> TopProducts,
    IReadOnlyList<FinancialIngredientCost> IngredientCosts);

public sealed record FinancialTrendPoint(string Label, decimal Amount);

public sealed record FinancialPaymentMethod(
    string Method,
    int PaymentCount,
    decimal Amount);

public sealed record FinancialTopProduct(
    string Name,
    int Quantity,
    decimal Revenue);

public sealed record FinancialIngredientCost(
    string Name,
    string Unit,
    decimal Quantity,
    decimal Cost);
