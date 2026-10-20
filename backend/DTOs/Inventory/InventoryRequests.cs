using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Inventory;

public sealed record CreateIngredientRequest
{
    [Required, MaxLength(150)]
    public required string Name { get; init; }

    [Required, MaxLength(30)]
    public required string Unit { get; init; }

    [Range(0, double.MaxValue)]
    public decimal InitialStock { get; init; }

    [Range(0, double.MaxValue)]
    public decimal MinimumStock { get; init; }

    [Range(0, double.MaxValue)]
    public decimal? CostPerUnit { get; init; }
}

public sealed record UpdateIngredientRequest
{
    [Required, MaxLength(150)]
    public required string Name { get; init; }

    [Required, MaxLength(30)]
    public required string Unit { get; init; }

    [Range(0, double.MaxValue)]
    public decimal MinimumStock { get; init; }

    [Range(0, double.MaxValue)]
    public decimal? CostPerUnit { get; init; }
}

public sealed record InventoryAdjustmentRequest
{
    [Range(double.MinValue, double.MaxValue)]
    public decimal Quantity { get; init; }

    [MaxLength(500)]
    public string? Note { get; init; }
}

public sealed record AddBomItemRequest
{
    [Range(0.000001, double.MaxValue)]
    public decimal Quantity { get; init; }
}

public sealed record UpdateBomRequest
{
    [Required]
    public required IReadOnlyList<BomItemRequest> Items { get; init; }
}

public sealed record BomItemRequest
{
    [Range(1, int.MaxValue)]
    public int IngredientId { get; init; }

    [Range(0.000001, double.MaxValue)]
    public decimal Quantity { get; init; }
}
