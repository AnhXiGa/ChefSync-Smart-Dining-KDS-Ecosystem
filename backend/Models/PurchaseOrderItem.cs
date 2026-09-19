namespace backend.Models;

public class PurchaseOrderItem
{
    public int Id { get; set; }

    public int PurchaseOrderId { get; set; }

    public int IngredientId { get; set; }

    public decimal Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal Subtotal { get; set; }

    // Navigation
    public PurchaseOrder PurchaseOrder { get; set; } = null!;

    public Ingredient Ingredient { get; set; } = null!;
}