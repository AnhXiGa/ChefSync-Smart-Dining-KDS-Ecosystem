using backend.DTOs.Inventory;

namespace backend.Services.Interfaces;

public interface IInventoryService
{
    Task<IReadOnlyList<IngredientResponse>> GetIngredientsAsync(
        CancellationToken cancellationToken);

    Task<IngredientResponse?> GetIngredientAsync(
        int id,
        CancellationToken cancellationToken);

    Task<IngredientResponse> CreateIngredientAsync(
        CreateIngredientRequest request,
        CancellationToken cancellationToken);

    Task<IngredientResponse?> UpdateIngredientAsync(
        int id,
        UpdateIngredientRequest request,
        CancellationToken cancellationToken);

    Task<IngredientResponse?> AdjustStockAsync(
        int id,
        InventoryAdjustmentRequest request,
        string type,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<InventoryTransactionResponse>> GetTransactionsAsync(
        int? ingredientId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<BomItemResponse>> GetBomAsync(
        int productId,
        CancellationToken cancellationToken);

    Task<BomItemResponse?> AddBomItemAsync(
        int productId,
        int ingredientId,
        decimal quantity,
        CancellationToken cancellationToken);

    Task<bool> DeleteBomItemAsync(
        int productId,
        int ingredientId,
        CancellationToken cancellationToken);

    Task DeductForOrderAsync(
        int orderId,
        IReadOnlyList<(int ProductId, int Quantity)> items,
        CancellationToken cancellationToken);
}
