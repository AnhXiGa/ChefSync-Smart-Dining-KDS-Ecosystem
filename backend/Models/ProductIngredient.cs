namespace backend.Models;

public class ProductIngredient
{
    public int ProductId { get; set; }

    public int IngredientId { get; set; }

    // Số lượng nguyên liệu cần cho 1 món
    public decimal Quantity { get; set; }

    // Navigation
    public Product Product { get; set; } = null!;

    public Ingredient Ingredient { get; set; } = null!;
}