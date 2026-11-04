namespace backend.Models;

public class RolePermission
{
    public int RoleId { get; set; }

    public string PermissionKey { get; set; } = string.Empty;

    public string AccessLevel { get; set; } = string.Empty;

    public Role Role { get; set; } = null!;
}

public static class RolePermissionCatalog
{
    public const string Full = "Full";
    public const string Limited = "Limited";

    public static readonly string[] BuiltInRoleNames =
    [
        "Admin",
        "Manager",
        "Waiter",
        "Chef",
        "Inventory"
    ];

    public static readonly IReadOnlyDictionary<string, string> Labels =
        new Dictionary<string, string>
        {
            ["users"] = "Quản lý tài khoản",
            ["menu"] = "Quản lý menu",
            ["tables"] = "Quản lý bàn",
            ["orders"] = "Tạo đơn hàng",
            ["payments"] = "Xử lý thanh toán",
            ["kds"] = "Quản lý KDS",
            ["inventory"] = "Quản lý kho",
            ["revenue-reports"] = "Báo cáo doanh thu",
            ["inventory-reports"] = "Báo cáo kho",
            ["system-settings"] = "Cấu hình hệ thống"
        };
}
