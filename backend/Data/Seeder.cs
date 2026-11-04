using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public static class SmartPosSeeder
{
    private static readonly (string Number, int Capacity)[] Tables =
    [
        ("T01", 2), ("T02", 2), ("T03", 4), ("T04", 4), ("T05", 4),
        ("T06", 6), ("T07", 6), ("T08", 8), ("T09", 2), ("T10", 2),
        ("T11", 4), ("T12", 4), ("T13", 6), ("T14", 6), ("T15", 8)
    ];

    public static async Task SeedAsync(
        AppDbContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        var existingNumbers = await context.RestaurantTables
            .Select(table => table.TableNumber)
            .ToHashSetAsync(cancellationToken);

        var missingTables = Tables
            .Where(table => !existingNumbers.Contains(table.Number))
            .Select(table => new RestaurantTable
            {
                TableNumber = table.Number,
                Capacity = table.Capacity,
                Status = "Available",
                QrToken = Guid.NewGuid(),
                CreatedAt = DateTime.UtcNow
            })
            .ToArray();

        if (missingTables.Length > 0)
        {
            context.RestaurantTables.AddRange(missingTables);
            await context.SaveChangesAsync(cancellationToken);
        }

        var testIngredient = await context.Ingredients
            .FirstOrDefaultAsync(
                ingredient => ingredient.Name == "Hạt cà phê test",
                cancellationToken);

        if (testIngredient == null)
        {
            testIngredient = new Ingredient
            {
                Name = "Hạt cà phê test",
                Unit = "kg",
                CurrentStock = 0.10m,
                MinStock = 0.02m,
                CostPerUnit = 250000m,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Ingredients.Add(testIngredient);
            await context.SaveChangesAsync(cancellationToken);
        }
        else
        {
            testIngredient.CurrentStock = 0.10m;
            testIngredient.MinStock = 0.02m;
            testIngredient.Unit = "kg";
        }

        var blackCoffee = await context.Products
            .FirstOrDefaultAsync(
                product => product.Name == "Cà phê đen",
                cancellationToken);

        if (blackCoffee != null)
        {
            var existingRecipe = await context.ProductIngredients
                .FirstOrDefaultAsync(
                    item => item.ProductId == blackCoffee.Id &&
                        item.IngredientId == testIngredient.Id,
                    cancellationToken);

            if (existingRecipe == null)
            {
                context.ProductIngredients.Add(new ProductIngredient
                {
                    ProductId = blackCoffee.Id,
                    IngredientId = testIngredient.Id,
                    Quantity = 0.02m
                });
            }
            else
            {
                existingRecipe.Quantity = 0.02m;
            }

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
