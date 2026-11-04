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

        var allPermissions = RolePermissionCatalog.Labels.Keys.ToArray();
        var defaultRoles = new Dictionary<string, string[]>
        {
            ["Admin"] = allPermissions,
            ["Manager"] = allPermissions.Where(permission => permission != "system-settings").ToArray(),
            ["Waiter"] = ["tables", "orders", "payments"],
            ["Chef"] = ["kds"],
            ["Inventory"] = ["inventory", "inventory-reports"]
        };
        var roles = await context.Roles
            .Include(x => x.Permissions)
            .ToListAsync();

        foreach (var (name, permissionKeys) in defaultRoles)
        {
            var role = roles.FirstOrDefault(x => x.Name == name);
            if (role is null)
            {
                var description = name switch
                {
                    "Admin" => "Quản trị toàn hệ thống",
                    "Manager" => "Quản lý nhà hàng",
                    "Waiter" => "Nhân viên phục vụ",
                    "Chef" => "Nhân viên bếp",
                    "Inventory" => "Nhân viên quản lý kho",
                    _ => name
                };
                role = new Role { Name = name, Description = description };
                context.Roles.Add(role);
                roles.Add(role);
            }

            var expectedPermissions = permissionKeys.ToHashSet();
            var obsoletePermissions = role.Permissions
                .Where(permission => !expectedPermissions.Contains(permission.PermissionKey))
                .ToArray();
            context.RolePermissions.RemoveRange(obsoletePermissions);

            foreach (var permissionKey in permissionKeys)
            {
                var rolePermission = role.Permissions.FirstOrDefault(x => x.PermissionKey == permissionKey);
                if (rolePermission is null)
                {
                    role.Permissions.Add(new RolePermission
                    {
                        RoleId = role.Id,
                        PermissionKey = permissionKey,
                        AccessLevel = RolePermissionCatalog.Full,
                        Role = role
                    });
                }
                else
                {
                    rolePermission.AccessLevel = RolePermissionCatalog.Full;
                }
            }
        }

        await context.SaveChangesAsync();

        var waiterRole = roles.First(x => x.Name == "Waiter");
        var obsoleteRoles = roles
            .Where(role => !RolePermissionCatalog.BuiltInRoleNames.Contains(role.Name))
            .ToArray();
        var cashierUserIds = new HashSet<int>();
        foreach (var obsoleteRole in obsoleteRoles)
        {
            var oldAssignments = await context.UserRoles
                .Where(userRole => userRole.RoleId == obsoleteRole.Id)
                .ToListAsync();
            if (obsoleteRole.Name == "Cashier")
            {
                cashierUserIds.UnionWith(oldAssignments.Select(assignment => assignment.UserId));
            }

            context.UserRoles.RemoveRange(oldAssignments);
            context.Roles.Remove(obsoleteRole);
        }

        if (obsoleteRoles.Length > 0)
            await context.SaveChangesAsync();

        if (cashierUserIds.Count > 0)
        {
            var existingAssignments = await context.UserRoles
                .Where(userRole => cashierUserIds.Contains(userRole.UserId))
                .ToListAsync();
            context.UserRoles.RemoveRange(existingAssignments);
            await context.SaveChangesAsync();

            foreach (var userId in cashierUserIds)
            {
                context.UserRoles.Add(new UserRole
                {
                    UserId = userId,
                    RoleId = waiterRole.Id
                });
            }

            await context.SaveChangesAsync();
        }

        var managerRole = roles.First(x => x.Name == "Manager");
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

        if (!user.UserRoles.Any(x => x.RoleId == managerRole.Id))
            context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = managerRole.Id });

        await context.SaveChangesAsync();
    }
}
