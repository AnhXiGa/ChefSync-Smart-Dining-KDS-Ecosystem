using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public sealed class NotificationCleanupService(
    IServiceScopeFactory scopeFactory,
    ILogger<NotificationCleanupService> logger) : BackgroundService
{
    private static readonly TimeSpan CleanupInterval = TimeSpan.FromHours(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(CleanupInterval);

        do
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var cutoff = DateTime.UtcNow.AddDays(-7);
                var deletedCount = await context.Notifications
                    .Where(notification => notification.CreatedAt < cutoff)
                    .ExecuteDeleteAsync(stoppingToken);

                if (deletedCount > 0)
                    logger.LogInformation("Deleted {Count} expired notifications.", deletedCount);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception) when (!stoppingToken.IsCancellationRequested)
            {
                logger.LogError(exception, "Failed to delete expired notifications.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
