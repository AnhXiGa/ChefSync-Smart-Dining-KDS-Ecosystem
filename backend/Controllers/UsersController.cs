using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers;

[Route("api/users")]
public sealed class UsersController(AppDbContext context) : ApiScaffoldController
{
    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await context.Users
            .AsNoTracking()
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .OrderBy(x => x.FullName)
            .Select(x => new
            {
                x.Id,
                x.EmployeeCode,
                x.FullName,
                x.Email,
                x.Phone,
                x.Position,
                x.IsActive,
                roles = x.UserRoles.Select(userRole => userRole.Role.Name),
                roleIds = x.UserRoles.Select(userRole => userRole.RoleId)
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetUser(int id)
    {
        var user = await context.Users
            .AsNoTracking()
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(x => x.Id == id);

        return user is null ? NotFound(new { message = "Không tìm thấy tài khoản." }) : Ok(ToResponse(user));
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        var fullName = request.FullName?.Trim();
        var email = request.Email?.Trim().ToLowerInvariant();
        var password = request.Password;
        if (string.IsNullOrWhiteSpace(fullName) || string.IsNullOrWhiteSpace(email)
            || !new EmailAddressAttribute().IsValid(email)
            || fullName.Length > 100 || email.Length > 150
            || request.Phone?.Trim().Length > 20
            || string.IsNullOrWhiteSpace(password) || password.Length < 8)
        {
            return BadRequest(new { message = "Vui lòng nhập tên, email hợp lệ và mật khẩu tối thiểu 8 ký tự." });
        }

        if (await context.Users.AnyAsync(x => x.Email.ToLower() == email))
            return Conflict(new { message = "Email này đã được sử dụng." });

        var roleIds = request.RoleIds?.Distinct().ToArray() ?? [];
        if (roleIds.Length != 1)
            return BadRequest(new { message = "Vui lòng chọn một vai trò." });

        var roles = await context.Roles
            .Where(x =>
                roleIds.Contains(x.Id)
                && RolePermissionCatalog.BuiltInRoleNames.Contains(x.Name))
            .ToListAsync();
        if (roles.Count != roleIds.Length)
            return BadRequest(new { message = "Một hoặc nhiều vai trò không tồn tại." });

        var user = new User
        {
            EmployeeCode = $"NV-{Guid.NewGuid():N}"[..11],
            FullName = fullName,
            Email = email,
            Phone = request.Phone?.Trim(),
            Position = request.Position?.Trim(),
            IsActive = true
        };
        user.PasswordHash = new PasswordHasher<User>()
            .HashPassword(user, password);
        await using var transaction = await context.Database.BeginTransactionAsync();
        context.Users.Add(user);
        await context.SaveChangesAsync();

        context.UserRoles.Add(new UserRole
        {
            UserId = user.Id,
            RoleId = roles[0].Id
        });
        await context.SaveChangesAsync();
        await transaction.CommitAsync();

        var savedUser = await context.Users
            .AsNoTracking()
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .FirstAsync(x => x.Id == user.Id);

        return CreatedAtAction(
            nameof(GetUser),
            new { id = savedUser.Id },
            ToResponse(savedUser));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
        var user = await context.Users.FindAsync(id);
        if (user is null)
            return NotFound(new { message = "Không tìm thấy tài khoản." });

        var fullName = request.FullName?.Trim();
        var email = request.Email?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(fullName) || string.IsNullOrWhiteSpace(email)
            || !new EmailAddressAttribute().IsValid(email)
            || fullName.Length > 100 || email.Length > 150
            || request.Phone?.Trim().Length > 20)
        {
            return BadRequest(new { message = "Tên và email hợp lệ là bắt buộc." });
        }

        if (await context.Users.AnyAsync(x => x.Id != id && x.Email.ToLower() == email))
            return Conflict(new { message = "Email này đã được sử dụng." });

        user.FullName = fullName;
        user.Email = email;
        user.Phone = request.Phone?.Trim();
        user.Position = request.Position?.Trim();
        user.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();
        return Ok(new { message = "Đã cập nhật tài khoản." });
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateUserStatus(int id, [FromBody] UpdateUserStatusRequest request)
    {
        var user = await context.Users.FindAsync(id);
        if (user is null)
            return NotFound(new { message = "Không tìm thấy tài khoản." });

        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        return Ok(new { message = "Đã cập nhật trạng thái tài khoản.", user.IsActive });
    }

    [HttpPut("{id:int}/roles")]
    public async Task<IActionResult> UpdateUserRoles(int id, [FromBody] UpdateUserRolesRequest request)
    {
        var user = await context.Users
            .Include(x => x.UserRoles)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (user is null)
            return NotFound(new { message = "Không tìm thấy tài khoản." });

        var roleIds = request.RoleIds?.Distinct().ToArray() ?? [];
        if (roleIds.Length != 1)
            return BadRequest(new { message = "Mỗi tài khoản phải có đúng một vai trò." });

        var roles = await context.Roles
            .Where(x =>
                roleIds.Contains(x.Id)
                && RolePermissionCatalog.BuiltInRoleNames.Contains(x.Name))
            .ToListAsync();
        if (roles.Count != roleIds.Length)
            return BadRequest(new { message = "Một hoặc nhiều vai trò không tồn tại." });

        var currentRoleIds = user.UserRoles.Select(userRole => userRole.RoleId).ToHashSet();
        context.UserRoles.RemoveRange(
            user.UserRoles.Where(userRole => !roleIds.Contains(userRole.RoleId)).ToArray());
        foreach (var role in roles)
        {
            if (!currentRoleIds.Contains(role.Id))
                context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
        }

        user.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        return Ok(new { message = "Đã cập nhật vai trò tài khoản." });
    }

    private static object ToResponse(User user) => new
    {
        user.Id,
        user.EmployeeCode,
        user.FullName,
        user.Email,
        user.Phone,
        user.Position,
        user.IsActive,
        roles = user.UserRoles.Select(userRole => userRole.Role.Name),
        roleIds = user.UserRoles.Select(userRole => userRole.RoleId)
    };
}

public sealed record CreateUserRequest(
    string? FullName,
    string? Email,
    string? Password,
    string? Phone,
    string? Position,
    int[]? RoleIds);

public sealed record UpdateUserRequest(
    string? FullName,
    string? Email,
    string? Phone,
    string? Position);

public sealed record UpdateUserStatusRequest(bool IsActive);

public sealed record UpdateUserRolesRequest(int[]? RoleIds);
