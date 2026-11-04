using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[Route("api/roles")]
public sealed class RolesController(AppDbContext context) : ApiScaffoldController
{
    [HttpGet]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await context.Roles
            .AsNoTracking()
            .Include(x => x.Permissions)
            .Where(x => RolePermissionCatalog.BuiltInRoleNames.Contains(x.Name))
            .OrderBy(x => x.Name)
            .ToListAsync();

        return Ok(roles.Select(ToResponse));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetRole(int id)
    {
        var role = await context.Roles
            .AsNoTracking()
            .Include(x => x.Permissions)
            .FirstOrDefaultAsync(x =>
                x.Id == id && RolePermissionCatalog.BuiltInRoleNames.Contains(x.Name));

        return role is null
            ? NotFound(new { message = "Không tìm thấy vai trò." })
            : Ok(ToResponse(role));
    }

    private static object ToResponse(Role role) => new
    {
        role.Id,
        role.Name,
        role.Description,
        permissions = role.Permissions.ToDictionary(x => x.PermissionKey, x => x.AccessLevel)
    };
}
