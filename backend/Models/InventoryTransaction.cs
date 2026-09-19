namespace backend.Models;

public class InventoryTransaction
{
    public int Id { get; set; }

    public int IngredientId { get; set; }

    public string Type { get; set; } = string.Empty;

    public decimal Quantity { get; set; }

    public decimal BeforeStock { get; set; }

    public decimal AfterStock { get; set; }

    public string? ReferenceType { get; set; }

    public int? ReferenceId { get; set; }

    public string? Note { get; set; }

    public int? CreatedByUserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Ingredient Ingredient { get; set; } = null!;

    public User? CreatedByUser { get; set; }
}