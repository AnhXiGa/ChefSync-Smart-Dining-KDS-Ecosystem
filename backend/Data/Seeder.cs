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

        if (missingTables.Length == 0)
            return;

        context.RestaurantTables.AddRange(missingTables);
        await context.SaveChangesAsync(cancellationToken);
    }
}
