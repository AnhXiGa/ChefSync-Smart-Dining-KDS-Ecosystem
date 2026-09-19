namespace backend.Models;

public class Ingredient
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Unit { get; set; } = string.Empty;

    public decimal CurrentStock { get; set; }

    public decimal MinStock { get; set; }

    public decimal? CostPerUnit { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public ICollection<ProductIngredient> ProductIngredients { get; set; }
        = new List<ProductIngredient>();

    public ICollection<InventoryTransaction> InventoryTransactions { get; set; }
        = new List<InventoryTransaction>();

    public ICollection<PurchaseOrderItem> PurchaseOrderItems { get; set; }
        = new List<PurchaseOrderItem>();
}