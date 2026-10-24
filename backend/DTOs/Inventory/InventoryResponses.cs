namespace backend.DTOs.Inventory;

public sealed record IngredientResponse(
    int Id,
    string Name,
    string Unit,
    decimal CurrentStock,
    decimal MinimumStock,
    decimal? CostPerUnit,
    bool IsActive,
    bool IsLowStock);

public sealed record BomItemResponse(
    int ProductId,
    int IngredientId,
    string IngredientName,
    string Unit,
    decimal Quantity);

public sealed record InventoryTransactionResponse(
    int Id,
    int IngredientId,
    string IngredientName,
    string Unit,
    string Type,
    decimal Quantity,
    decimal BeforeStock,
    decimal AfterStock,
    string? ReferenceType,
    int? ReferenceId,
    string? Note,
    DateTimeOffset CreatedAt);
