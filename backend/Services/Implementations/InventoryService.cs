using backend.Data;
using backend.DTOs.Inventory;
using backend.Models;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public sealed class InventoryService(AppDbContext context) : IInventoryService
{
    public async Task<IReadOnlyList<IngredientResponse>> GetIngredientsAsync(
        CancellationToken cancellationToken)
    {
        var ingredients = await context.Ingredients.AsNoTracking()
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);
        return ingredients.Select(ToResponse).ToList();
    }

    public async Task<IngredientResponse?> GetIngredientAsync(
        int id,
        CancellationToken cancellationToken)
    {
        var ingredient = await context.Ingredients.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        return ingredient is null ? null : ToResponse(ingredient);
    }

    public async Task<IngredientResponse> CreateIngredientAsync(
        CreateIngredientRequest request,
        CancellationToken cancellationToken)
    {
        var ingredient = new Ingredient
        {
            Name = request.Name.Trim(),
            Unit = request.Unit.Trim(),
            CurrentStock = request.InitialStock,
            MinStock = request.MinimumStock,
            CostPerUnit = request.CostPerUnit
        };
        context.Ingredients.Add(ingredient);
        await context.SaveChangesAsync(cancellationToken);

        if (request.InitialStock > 0)
        {
            context.InventoryTransactions.Add(new InventoryTransaction
            {
                IngredientId = ingredient.Id,
                Type = "Receipt",
                Quantity = request.InitialStock,
                BeforeStock = 0,
                AfterStock = request.InitialStock,
                ReferenceType = "Ingredient",
                ReferenceId = ingredient.Id,
                Note = "Initial stock"
            });
            await context.SaveChangesAsync(cancellationToken);
        }

        return ToResponse(ingredient);
    }

    public async Task<IngredientResponse?> UpdateIngredientAsync(
        int id,
        UpdateIngredientRequest request,
        CancellationToken cancellationToken)
    {
        var ingredient = await context.Ingredients
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (ingredient is null)
            return null;

        ingredient.Name = request.Name.Trim();
        ingredient.Unit = request.Unit.Trim();
        ingredient.MinStock = request.MinimumStock;
        ingredient.CostPerUnit = request.CostPerUnit;
        ingredient.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return ToResponse(ingredient);
    }

    public async Task<IngredientResponse?> AdjustStockAsync(
        int id,
        InventoryAdjustmentRequest request,
        string type,
        CancellationToken cancellationToken)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(
            cancellationToken);
        var ingredient = await context.Ingredients
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (ingredient is null)
            return null;

        var before = ingredient.CurrentStock;
        var after = before + request.Quantity;
        if (after < 0)
            throw new InvalidOperationException("Tồn kho không thể nhỏ hơn 0.");

        ingredient.CurrentStock = after;
        ingredient.UpdatedAt = DateTime.UtcNow;
        context.InventoryTransactions.Add(new InventoryTransaction
        {
            IngredientId = id,
            Type = type,
            Quantity = request.Quantity,
            BeforeStock = before,
            AfterStock = after,
            ReferenceType = "Manual",
            Note = request.Note
        });
        await context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return ToResponse(ingredient);
    }

    public async Task<IReadOnlyList<InventoryTransactionResponse>> GetTransactionsAsync(
        int? ingredientId,
        CancellationToken cancellationToken)
    {
        var transactions = await context.InventoryTransactions.AsNoTracking()
            .Include(x => x.Ingredient)
            .Where(x => ingredientId == null || x.IngredientId == ingredientId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
        return transactions.Select(x => new InventoryTransactionResponse(
            x.Id, x.IngredientId, x.Ingredient.Name, x.Ingredient.Unit,
            x.Type, x.Quantity, x.BeforeStock, x.AfterStock,
            x.ReferenceType, x.ReferenceId, x.Note,
            new DateTimeOffset(x.CreatedAt, TimeSpan.Zero))).ToList();
    }

    public async Task<IReadOnlyList<BomItemResponse>> GetBomAsync(
        int productId,
        CancellationToken cancellationToken)
        => await context.ProductIngredients.AsNoTracking()
            .Include(x => x.Ingredient)
            .Where(x => x.ProductId == productId)
            .OrderBy(x => x.Ingredient.Name)
            .Select(x => new BomItemResponse(
                x.ProductId, x.IngredientId, x.Ingredient.Name,
                x.Ingredient.Unit, x.Quantity))
            .ToListAsync(cancellationToken);

    public async Task<BomItemResponse?> AddBomItemAsync(
        int productId,
        int ingredientId,
        decimal quantity,
        CancellationToken cancellationToken)
    {
        var productExists = await context.Products.AnyAsync(
            x => x.Id == productId, cancellationToken);
        var ingredient = await context.Ingredients.FirstOrDefaultAsync(
            x => x.Id == ingredientId, cancellationToken);
        if (!productExists || ingredient is null)
            return null;

        var item = await context.ProductIngredients.FirstOrDefaultAsync(
            x => x.ProductId == productId && x.IngredientId == ingredientId,
            cancellationToken);
        if (item is null)
        {
            item = new ProductIngredient
            {
                ProductId = productId,
                IngredientId = ingredientId,
                Quantity = quantity,
                Ingredient = ingredient
            };
            context.ProductIngredients.Add(item);
        }
        else
        {
            item.Quantity = quantity;
        }

        await context.SaveChangesAsync(cancellationToken);
        return new BomItemResponse(
            productId, ingredientId, ingredient.Name, ingredient.Unit, quantity);
    }

    public async Task<bool> DeleteBomItemAsync(
        int productId,
        int ingredientId,
        CancellationToken cancellationToken)
    {
        var item = await context.ProductIngredients.FirstOrDefaultAsync(
            x => x.ProductId == productId && x.IngredientId == ingredientId,
            cancellationToken);
        if (item is null)
            return false;
        context.ProductIngredients.Remove(item);
        await context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task DeductForOrderItemAsync(
        int orderId,
        int orderItemId,
        int productId,
        int quantity,
        CancellationToken cancellationToken)
    {
        if (quantity <= 0)
            throw new InvalidOperationException("Số lượng món ăn không hợp lệ.");

        var bom = await context.ProductIngredients.AsNoTracking()
            .Where(x => x.ProductId == productId)
            .ToListAsync(cancellationToken);

        if (bom.Count == 0)
            throw new InvalidOperationException(
                $"Món ăn chưa có định lượng nguyên liệu: {productId}.");

        var required = bom
            .GroupBy(x => x.IngredientId)
            .ToDictionary(
                group => group.Key,
                group => group.Sum(item => item.Quantity * quantity));

        if (required.Count == 0)
            throw new InvalidOperationException("Món ăn chưa có định lượng nguyên liệu.");

        var ingredients = await context.Ingredients
            .Where(x => required.Keys.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, cancellationToken);
        if (ingredients.Count != required.Count)
            throw new InvalidOperationException("Định lượng chứa nguyên liệu không tồn tại.");

        foreach (var (ingredientId, amount) in required)
        {
            var ingredient = ingredients[ingredientId];
            var before = ingredient.CurrentStock;
            var affected = await context.Database.ExecuteSqlInterpolatedAsync(
                $"UPDATE \"Ingredients\" SET \"CurrentStock\" = \"CurrentStock\" - {amount}, \"UpdatedAt\" = CURRENT_TIMESTAMP WHERE \"Id\" = {ingredientId} AND \"CurrentStock\" >= {amount}",
                cancellationToken);
            if (affected != 1)
                throw new InvalidOperationException(
                    $"Không đủ tồn kho nguyên liệu: {ingredient.Name}.");

            context.InventoryTransactions.Add(new InventoryTransaction
            {
                IngredientId = ingredientId,
                Type = "Issue",
                Quantity = -amount,
                BeforeStock = before,
                AfterStock = before - amount,
                ReferenceType = "OrderItem",
                ReferenceId = orderItemId,
                Note = $"Hoàn thành chế biến (đơn #{orderId})"
            });
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    private static IngredientResponse ToResponse(Ingredient x)
        => new(x.Id, x.Name, x.Unit, x.CurrentStock, x.MinStock,
            x.CostPerUnit, x.IsActive, x.CurrentStock <= x.MinStock);

    private static BomItemResponse ToBomResponse(ProductIngredient x)
        => new(x.ProductId, x.IngredientId, x.Ingredient.Name,
            x.Ingredient.Unit, x.Quantity);
}
