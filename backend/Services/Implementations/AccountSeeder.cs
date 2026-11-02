using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations;

public static class AccountSeeder
{
    public const string Email = "manager@chefsync.local";
    public const string Password = "ChefSync@123";

    public static async Task SeedManagerAsync(IServiceProvider services)
    {
        var context = services.GetRequiredService<AppDbContext>();
        var passwordHasher = new PasswordHasher<User>();

        var role = await context.Roles.FirstOrDefaultAsync(x => x.Name == "Manager");
        if (role is null)
        {
            role = new Role
            {
                Name = "Manager",
                Description = "Quản lý nhà hàng"
            };
            context.Roles.Add(role);
        }

        var user = await context.Users
            .Include(x => x.UserRoles)
            .FirstOrDefaultAsync(x => x.Email == Email);
        if (user is null)
        {
            user = new User
            {
                EmployeeCode = "MGR001",
                FullName = "Quản lý ChefSync",
                Email = Email,
                Position = "Quản lý nhà hàng"
            };
            user.PasswordHash = passwordHasher.HashPassword(user, Password);
            context.Users.Add(user);
            await context.SaveChangesAsync();
        }

        if (!user.UserRoles.Any(x => x.RoleId == role.Id))
            context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });

        await context.SaveChangesAsync();
    }
}
