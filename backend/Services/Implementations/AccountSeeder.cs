
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

        // ==========================================
        // 1. DEFINE DEFAULT ROLES AND PERMISSIONS
        // ==========================================

        var allPermissions = RolePermissionCatalog.Labels.Keys.ToArray();

        var defaultRoles = new Dictionary<string, string[]>
        {
            ["Admin"] = allPermissions,

            ["Manager"] = allPermissions
                .Where(permission => permission != "system-settings")
                .ToArray(),

            ["Waiter"] = ["tables", "orders", "payments"],

            ["Chef"] = ["kds"],

            ["Inventory"] = ["inventory", "inventory-reports"]
        };

        // ==========================================
        // 2. SEED ROLES AND ROLE PERMISSIONS
        // ==========================================

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
                    "Admin" => "Quản trị hệ thống",
                    "Manager" => "Quản lý nhà hàng",
                    "Waiter" => "Nhân viên phục vụ",
                    "Chef" => "Nhân viên bếp",
                    "Inventory" => "Nhân viên quản lý kho",
                    _ => name
                };

                role = new Role
                {
                    Name = name,
                    Description = description
                };

                context.Roles.Add(role);
                roles.Add(role);
            }

            var expectedPermissions = permissionKeys.ToHashSet();

            // Remove permissions no longer assigned to this role
            var obsoletePermissions = role.Permissions
                .Where(permission =>
                    !expectedPermissions.Contains(permission.PermissionKey))
                .ToArray();

            context.RolePermissions.RemoveRange(obsoletePermissions);

            // Add missing permissions or update existing permissions
            foreach (var permissionKey in permissionKeys)
            {
                var rolePermission = role.Permissions
                    .FirstOrDefault(x => x.PermissionKey == permissionKey);

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

        // ==========================================
        // 3. REMOVE OBSOLETE ROLES
        // ==========================================

        var waiterRole = roles.First(x => x.Name == "Waiter");

        var obsoleteRoles = roles
            .Where(role =>
                !RolePermissionCatalog.BuiltInRoleNames.Contains(role.Name))
            .ToArray();

        var cashierUserIds = new HashSet<int>();

        foreach (var obsoleteRole in obsoleteRoles)
        {
            var oldAssignments = await context.UserRoles
                .Where(userRole => userRole.RoleId == obsoleteRole.Id)
                .ToListAsync();

            if (obsoleteRole.Name == "Cashier")
            {
                cashierUserIds.UnionWith(
                    oldAssignments.Select(assignment => assignment.UserId));
            }

            context.UserRoles.RemoveRange(oldAssignments);
            context.Roles.Remove(obsoleteRole);
        }

        if (obsoleteRoles.Length > 0)
        {
            await context.SaveChangesAsync();
        }

        // Migrate users from old Cashier role to Waiter role
        if (cashierUserIds.Count > 0)
        {
            var existingAssignments = await context.UserRoles
                .Where(userRole =>
                    cashierUserIds.Contains(userRole.UserId))
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

        // ==========================================
        // 4. SEED MANAGER ACCOUNT
        // ==========================================

        var managerRole = roles.First(x => x.Name == "Manager");

        var managerUser = await context.Users
            .Include(x => x.UserRoles)
            .FirstOrDefaultAsync(x => x.Email == Email);

        if (managerUser is null)
        {
            managerUser = new User
            {
                EmployeeCode = "MGR001",
                FullName = "Quản lý ChefSync",
                Email = Email,
                Position = "Quản lý nhà hàng"
            };

            managerUser.PasswordHash =
                passwordHasher.HashPassword(managerUser, Password);

            context.Users.Add(managerUser);

            await context.SaveChangesAsync();
        }

        if (!managerUser.UserRoles.Any(x => x.RoleId == managerRole.Id))
        {
            context.UserRoles.Add(new UserRole
            {
                UserId = managerUser.Id,
                RoleId = managerRole.Id
            });
        }

        await context.SaveChangesAsync();

        // ==========================================
        // 5. DEFINE DEMO ACCOUNTS
        // ==========================================

        var demoAccounts = new[]
        {
            new
            {
                RoleName = "Admin",
                EmployeeCode = "ADM001",
                FullName = "Quản trị viên ChefSync",
                Email = "admin@chefsync.local",
                Position = "Quản trị hệ thống"
            },

            new
            {
                RoleName = "Waiter",
                EmployeeCode = "WTR001",
                FullName = "Nhân viên phục vụ ChefSync",
                Email = "waiter@chefsync.local",
                Position = "Nhân viên phục vụ"
            },

            new
            {
                RoleName = "Chef",
                EmployeeCode = "CHF001",
                FullName = "Đầu bếp ChefSync",
                Email = "chef@chefsync.local",
                Position = "Nhân viên bếp"
            },

            new
            {
                RoleName = "Inventory",
                EmployeeCode = "INV001",
                FullName = "Nhân viên kho ChefSync",
                Email = "inventory@chefsync.local",
                Position = "Nhân viên quản lý kho"
            }
        };

        // ==========================================
        // 6. CREATE DEMO USERS AND ASSIGN ROLES
        // ==========================================

        foreach (var account in demoAccounts)
        {
            var role = roles.First(x => x.Name == account.RoleName);

            var demoUser = await context.Users
                .Include(x => x.UserRoles)
                .FirstOrDefaultAsync(x => x.Email == account.Email);

            // Create account if it does not exist
            if (demoUser is null)
            {
                demoUser = new User
                {
                    EmployeeCode = account.EmployeeCode,
                    FullName = account.FullName,
                    Email = account.Email,
                    Position = account.Position
                };

                demoUser.PasswordHash =
                    passwordHasher.HashPassword(demoUser, Password);

                context.Users.Add(demoUser);

                await context.SaveChangesAsync();
            }

            // Assign corresponding role if not assigned
            if (!demoUser.UserRoles.Any(x => x.RoleId == role.Id))
            {
                context.UserRoles.Add(new UserRole
                {
                    UserId = demoUser.Id,
                    RoleId = role.Id
                });
            }

            await context.SaveChangesAsync();
        }
    }
}
