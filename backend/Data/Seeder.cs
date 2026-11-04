
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public static class SmartPosSeeder
{
    // ==========================================
    // 1. RESTAURANT TABLES
    // ==========================================

    private static readonly (string Number, int Capacity)[] Tables =
    [
        ("T01", 2), ("T02", 2), ("T03", 4), ("T04", 4), ("T05", 4),
        ("T06", 6), ("T07", 6), ("T08", 8), ("T09", 2), ("T10", 2),
        ("T11", 4), ("T12", 4), ("T13", 6), ("T14", 6), ("T15", 8)
    ];

    // ==========================================
    // 2. CATEGORY AND PRODUCT SEED DATA
    // Prices are in VND
    // ==========================================

    private sealed record ProductSeed(
        string Name,
        string Description,
        decimal Price,
        int PreparationTime);

    private sealed record CategorySeed(
        string Name,
        string Description,
        int DisplayOrder,
        ProductSeed[] Products);

    private sealed record IngredientSeed(
        string Name,
        string Unit,
        decimal MinimumStock,
        decimal CostPerUnit);

    private sealed record RecipeIngredientSeed(string Name, decimal Quantity);

    private sealed record ProductBomSeed(
        string ProductName,
        RecipeIngredientSeed[] Ingredients);

    private sealed record SupplierSeed(
        string Name,
        string Phone,
        string Email,
        string Address);

    private static readonly CategorySeed[] Categories =
    [
        new(
            "Món khai vị",
            "Các món ăn nhẹ dùng để khai vị.",
            1,
            [
                new("Gỏi cuốn tôm thịt", "Gỏi cuốn tươi với tôm, thịt và rau sống.", 45000m, 10),
                new("Chả giò chiên", "Chả giò nhân thịt và rau củ chiên giòn.", 50000m, 12),
                new("Gỏi ngó sen tôm thịt", "Gỏi ngó sen giòn kết hợp tôm và thịt.", 65000m, 15),
                new("Salad rau củ", "Salad rau củ tươi với nước sốt đặc biệt.", 40000m, 10)
            ]),

        new(
            "Món nướng",
            "Các món thịt được tẩm ướp và chế biến bằng phương pháp nướng.",
            2,
            [
                new("Sườn nướng mật ong", "Sườn heo nướng mật ong đậm đà.", 95000m, 25),
                new("Ba chỉ nướng BBQ", "Thịt ba chỉ tẩm sốt BBQ nướng thơm.", 85000m, 20),
                new("Gà nướng muối ớt", "Gà nướng muối ớt với lớp da giòn.", 120000m, 30),
                new("Bò nướng lá lốt", "Thịt bò cuốn lá lốt nướng thơm.", 85000m, 20)
            ]),

        new(
            "Món kho",
            "Các món ăn truyền thống được chế biến theo phương pháp kho.",
            3,
            [
                new("Cá kho tộ", "Cá kho tộ với nước màu và tiêu.", 75000m, 25),
                new("Thịt kho trứng", "Thịt ba chỉ kho cùng trứng.", 80000m, 30),
                new("Gà kho gừng", "Thịt gà kho gừng thơm đậm vị.", 75000m, 25),
                new("Sườn kho tiêu", "Sườn heo kho tiêu đậm đà.", 85000m, 25)
            ]),

        new(
            "Cơm",
            "Các món cơm phục vụ cho bữa ăn chính.",
            4,
            [
                new("Cơm chiên hải sản", "Cơm chiên với tôm, mực và rau củ.", 65000m, 15),
                new("Cơm chiên Dương Châu", "Cơm chiên trứng, xúc xích và rau củ.", 55000m, 12),
                new("Cơm sườn nướng", "Cơm trắng ăn kèm sườn nướng.", 65000m, 20),
                new("Cơm gà xối mỡ", "Cơm trắng ăn kèm đùi gà chiên giòn.", 60000m, 20)
            ]),

        new(
            "Món nước",
            "Các món bún, phở và hủ tiếu.",
            5,
            [
                new("Phở bò", "Phở truyền thống với thịt bò và nước dùng.", 65000m, 15),
                new("Bún bò Huế", "Bún bò với nước dùng đậm vị.", 65000m, 15),
                new("Hủ tiếu Nam Vang", "Hủ tiếu với tôm, thịt và nước dùng.", 60000m, 15),
                new("Bún riêu cua", "Bún riêu với riêu cua và cà chua.", 55000m, 15)
            ]),

        new(
            "Mì và món xào",
            "Các món mì và thực phẩm xào trên chảo nóng.",
            6,
            [
                new("Mì xào bò", "Mì xào cùng thịt bò và rau cải.", 65000m, 15),
                new("Mì xào hải sản", "Mì xào với tôm, mực và rau củ.", 75000m, 18),
                new("Nui xào bò", "Nui xào thịt bò và rau củ.", 60000m, 15),
                new("Miến xào cua", "Miến xào thịt cua và rau củ.", 85000m, 20)
            ]),

        new(
            "Lẩu",
            "Các món lẩu phục vụ nhóm khách và gia đình.",
            7,
            [
                new("Lẩu Thái hải sản", "Lẩu Thái chua cay với hải sản.", 220000m, 30),
                new("Lẩu bò", "Lẩu bò với rau và nấm ăn kèm.", 200000m, 30),
                new("Lẩu gà lá é", "Lẩu gà lá é với nước dùng thơm.", 190000m, 30),
                new("Lẩu riêu cua bắp bò", "Lẩu riêu cua kết hợp bắp bò.", 250000m, 35)
            ]),

        new(
            "Hải sản",
            "Các món ăn được chế biến từ hải sản tươi.",
            8,
            [
                new("Tôm rang muối", "Tôm rang muối giòn thơm.", 120000m, 20),
                new("Mực chiên giòn", "Mực tươi tẩm bột chiên giòn.", 95000m, 18),
                new("Nghêu hấp sả", "Nghêu hấp cùng sả và gia vị.", 75000m, 15),
                new("Cá chiên sốt cà", "Cá chiên giòn phủ sốt cà chua.", 85000m, 20)
            ]),

        new(
            "Món ăn nhẹ",
            "Các món ăn nhẹ và món ăn kèm.",
            9,
            [
                new("Cánh gà chiên nước mắm", "Cánh gà chiên giòn áo sốt nước mắm.", 65000m, 18),
                new("Khoai tây chiên", "Khoai tây chiên giòn.", 35000m, 10),
                new("Đậu hũ chiên sả", "Đậu hũ chiên giòn với sả.", 40000m, 12),
                new("Bắp xào tôm khô", "Bắp xào bơ cùng tôm khô.", 45000m, 12)
            ]),

        new(
            "Tráng miệng",
            "Các món tráng miệng sau bữa ăn.",
            10,
            [
                new("Chè ba màu", "Chè ba màu với đậu và nước cốt dừa.", 30000m, 5),
                new("Bánh flan", "Bánh flan mềm mịn vị caramel.", 25000m, 5),
                new("Sữa chua trái cây", "Sữa chua kết hợp trái cây tươi.", 35000m, 5),
                new("Rau câu dừa", "Rau câu dừa thanh mát.", 25000m, 5)
            ])
    ];

    private static readonly IngredientSeed[] Ingredients =
    [
        new("Hạt cà phê", "kg", 3m, 180000m),
        new("Sữa tươi", "lít", 2m, 32000m),
        new("Sữa đặc", "kg", 2m, 55000m),
        new("Đường", "kg", 2m, 25000m),
        new("Trà xanh", "kg", 1m, 170000m),
        new("Trà đen", "kg", 1m, 150000m),
        new("Đào ngâm", "kg", 2m, 85000m),
        new("Trân châu", "kg", 2m, 60000m),
        new("Tôm", "kg", 2m, 220000m),
        new("Thịt heo", "kg", 3m, 140000m),
        new("Bánh tráng", "cái", 50m, 1500m),
        new("Bún", "kg", 2m, 25000m),
        new("Rau sống", "kg", 2m, 35000m),
        new("Ngó sen", "kg", 2m, 50000m),
        new("Cà rốt", "kg", 2m, 22000m),
        new("Dưa leo", "kg", 2m, 18000m),
        new("Xà lách", "kg", 2m, 30000m),
        new("Nước mắm", "lít", 2m, 45000m),
        new("Bột mì", "kg", 3m, 30000m),
        new("Dầu ăn", "lít", 3m, 45000m),
        new("Sườn heo", "kg", 3m, 180000m),
        new("Mật ong", "kg", 1m, 120000m),
        new("Sốt BBQ", "kg", 1m, 85000m),
        new("Thịt gà", "kg", 3m, 95000m),
        new("Muối ớt", "kg", 1m, 50000m),
        new("Thịt bò", "kg", 3m, 240000m),
        new("Lá lốt", "kg", 1m, 45000m),
        new("Cá", "kg", 3m, 160000m),
        new("Trứng gà", "quả", 30m, 3000m),
        new("Gừng", "kg", 1m, 45000m),
        new("Tiêu", "kg", 1m, 180000m),
        new("Gạo", "kg", 10m, 22000m),
        new("Mực", "kg", 2m, 190000m),
        new("Xúc xích", "kg", 2m, 110000m),
        new("Hành lá", "kg", 1m, 35000m),
        new("Phở khô", "kg", 2m, 40000m),
        new("Nước dùng", "lít", 10m, 12000m),
        new("Hủ tiếu khô", "kg", 2m, 42000m),
        new("Cua", "kg", 2m, 280000m),
        new("Cà chua", "kg", 3m, 25000m),
        new("Mì", "kg", 3m, 35000m),
        new("Nui", "kg", 2m, 35000m),
        new("Cải xanh", "kg", 2m, 30000m),
        new("Miến", "kg", 2m, 55000m),
        new("Hải sản hỗn hợp", "kg", 3m, 210000m),
        new("Nghêu", "kg", 3m, 60000m),
        new("Sả", "kg", 1m, 25000m),
        new("Khoai tây", "kg", 3m, 28000m),
        new("Đậu hũ", "miếng", 20m, 5000m),
        new("Bắp", "kg", 3m, 25000m),
        new("Tôm khô", "kg", 1m, 320000m),
        new("Bơ", "kg", 1m, 150000m),
        new("Đậu xanh", "kg", 2m, 55000m),
        new("Đậu đỏ", "kg", 2m, 60000m),
        new("Nước cốt dừa", "lít", 2m, 55000m),
        new("Bột cacao", "kg", 1m, 160000m),
        new("Kem tươi", "lít", 2m, 95000m),
        new("Sữa chua", "hũ", 20m, 7000m),
        new("Trái cây", "kg", 3m, 60000m),
        new("Bột rau câu", "kg", 1m, 80000m),
        new("Dừa", "quả", 20m, 12000m)
    ];

    private static RecipeIngredientSeed R(string name, decimal quantity)
        => new(name, quantity);

    private static readonly ProductBomSeed[] ProductBoms =
    [
        new("Gỏi cuốn tôm thịt", [R("Tôm", 0.06m), R("Thịt heo", 0.04m), R("Bánh tráng", 2m), R("Bún", 0.04m), R("Rau sống", 0.03m)]),
        new("Chả giò chiên", [R("Thịt heo", 0.06m), R("Cà rốt", 0.02m), R("Bánh tráng", 2m), R("Dầu ăn", 0.03m)]),
        new("Gỏi ngó sen tôm thịt", [R("Ngó sen", 0.08m), R("Tôm", 0.06m), R("Thịt heo", 0.04m), R("Cà rốt", 0.02m), R("Nước mắm", 0.01m)]),
        new("Salad rau củ", [R("Xà lách", 0.08m), R("Dưa leo", 0.05m), R("Cà rốt", 0.03m), R("Nước mắm", 0.01m)]),
        new("Sườn nướng mật ong", [R("Sườn heo", 0.25m), R("Mật ong", 0.02m), R("Nước mắm", 0.01m)]),
        new("Ba chỉ nướng BBQ", [R("Thịt heo", 0.22m), R("Sốt BBQ", 0.04m)]),
        new("Gà nướng muối ớt", [R("Thịt gà", 0.3m), R("Muối ớt", 0.02m)]),
        new("Bò nướng lá lốt", [R("Thịt bò", 0.18m), R("Lá lốt", 0.03m), R("Dầu ăn", 0.01m)]),
        new("Cá kho tộ", [R("Cá", 0.22m), R("Nước mắm", 0.02m), R("Đường", 0.01m), R("Tiêu", 0.002m)]),
        new("Thịt kho trứng", [R("Thịt heo", 0.18m), R("Trứng gà", 1m), R("Nước mắm", 0.02m), R("Đường", 0.01m)]),
        new("Gà kho gừng", [R("Thịt gà", 0.22m), R("Gừng", 0.02m), R("Nước mắm", 0.02m)]),
        new("Sườn kho tiêu", [R("Sườn heo", 0.22m), R("Nước mắm", 0.02m), R("Tiêu", 0.003m)]),
        new("Cơm chiên hải sản", [R("Gạo", 0.12m), R("Hải sản hỗn hợp", 0.1m), R("Trứng gà", 1m), R("Hành lá", 0.01m), R("Dầu ăn", 0.02m)]),
        new("Cơm chiên Dương Châu", [R("Gạo", 0.12m), R("Trứng gà", 1m), R("Xúc xích", 0.04m), R("Cà rốt", 0.02m), R("Dầu ăn", 0.02m)]),
        new("Cơm sườn nướng", [R("Gạo", 0.12m), R("Sườn heo", 0.22m), R("Nước mắm", 0.01m)]),
        new("Cơm gà xối mỡ", [R("Gạo", 0.12m), R("Thịt gà", 0.25m), R("Dầu ăn", 0.04m)]),
        new("Phở bò", [R("Phở khô", 0.1m), R("Thịt bò", 0.12m), R("Nước dùng", 0.45m), R("Hành lá", 0.01m)]),
        new("Bún bò Huế", [R("Bún", 0.12m), R("Thịt bò", 0.12m), R("Thịt heo", 0.06m), R("Nước dùng", 0.45m), R("Sả", 0.01m)]),
        new("Hủ tiếu Nam Vang", [R("Hủ tiếu khô", 0.1m), R("Tôm", 0.05m), R("Thịt heo", 0.06m), R("Nước dùng", 0.45m)]),
        new("Bún riêu cua", [R("Bún", 0.12m), R("Cua", 0.08m), R("Cà chua", 0.08m), R("Nước dùng", 0.45m)]),
        new("Mì xào bò", [R("Mì", 0.12m), R("Thịt bò", 0.12m), R("Cải xanh", 0.08m), R("Dầu ăn", 0.02m)]),
        new("Mì xào hải sản", [R("Mì", 0.12m), R("Hải sản hỗn hợp", 0.12m), R("Cải xanh", 0.08m), R("Dầu ăn", 0.02m)]),
        new("Nui xào bò", [R("Nui", 0.1m), R("Thịt bò", 0.12m), R("Cà rốt", 0.03m), R("Dầu ăn", 0.02m)]),
        new("Miến xào cua", [R("Miến", 0.1m), R("Cua", 0.1m), R("Cải xanh", 0.06m), R("Dầu ăn", 0.02m)]),
        new("Lẩu Thái hải sản", [R("Hải sản hỗn hợp", 0.35m), R("Nước dùng", 0.8m), R("Sả", 0.04m), R("Cà chua", 0.1m), R("Bún", 0.15m)]),
        new("Lẩu bò", [R("Thịt bò", 0.35m), R("Nước dùng", 0.8m), R("Cải xanh", 0.15m), R("Bún", 0.15m)]),
        new("Lẩu gà lá é", [R("Thịt gà", 0.4m), R("Nước dùng", 0.8m), R("Sả", 0.04m), R("Rau sống", 0.1m), R("Bún", 0.15m)]),
        new("Lẩu riêu cua bắp bò", [R("Cua", 0.2m), R("Thịt bò", 0.2m), R("Nước dùng", 0.8m), R("Cà chua", 0.1m), R("Bún", 0.15m)]),
        new("Tôm rang muối", [R("Tôm", 0.25m), R("Muối ớt", 0.015m), R("Dầu ăn", 0.03m)]),
        new("Mực chiên giòn", [R("Mực", 0.22m), R("Bột mì", 0.06m), R("Dầu ăn", 0.05m)]),
        new("Nghêu hấp sả", [R("Nghêu", 0.35m), R("Sả", 0.04m), R("Gừng", 0.01m)]),
        new("Cá chiên sốt cà", [R("Cá", 0.22m), R("Cà chua", 0.1m), R("Dầu ăn", 0.04m)]),
        new("Cánh gà chiên nước mắm", [R("Thịt gà", 0.25m), R("Nước mắm", 0.02m), R("Đường", 0.01m), R("Dầu ăn", 0.04m)]),
        new("Khoai tây chiên", [R("Khoai tây", 0.2m), R("Dầu ăn", 0.05m)]),
        new("Đậu hũ chiên sả", [R("Đậu hũ", 2m), R("Sả", 0.02m), R("Dầu ăn", 0.03m)]),
        new("Bắp xào tôm khô", [R("Bắp", 0.18m), R("Tôm khô", 0.025m), R("Bơ", 0.015m)]),
        new("Chè ba màu", [R("Đậu xanh", 0.04m), R("Đậu đỏ", 0.04m), R("Nước cốt dừa", 0.08m), R("Đường", 0.03m)]),
        new("Bánh flan", [R("Trứng gà", 1m), R("Sữa tươi", 0.08m), R("Đường", 0.02m)]),
        new("Sữa chua trái cây", [R("Sữa chua", 1m), R("Trái cây", 0.1m)]),
        new("Rau câu dừa", [R("Bột rau câu", 0.01m), R("Dừa", 0.15m), R("Đường", 0.025m)])
    ];

    private static readonly SupplierSeed[] Suppliers =
    [
        new("Công ty Nguyên liệu Việt", "0900000001", "sales1@example.com", "TP. Hồ Chí Minh"),
        new("Nhà cung cấp Cà phê", "0900000002", "sales2@example.com", "Đắk Lắk"),
        new("Thực phẩm An Toàn", "0900000003", "sales3@example.com", "TP. Hồ Chí Minh"),
        new("Nông sản Đà Lạt", "0900000004", "sales4@example.com", "Lâm Đồng"),
        new("Hải sản Đại Dương", "0900000005", "sales5@example.com", "Khánh Hòa"),
        new("Thịt sạch An Phú", "0900000006", "sales6@example.com", "TP. Hồ Chí Minh"),
        new("Rau xanh Mộc", "0900000007", "sales7@example.com", "Đồng Nai"),
        new("Gia vị Việt", "0900000008", "sales8@example.com", "TP. Hồ Chí Minh"),
        new("Gạo ngon Miền Tây", "0900000009", "sales9@example.com", "Cần Thơ"),
        new("Thực phẩm Đông lạnh", "0900000010", "sales10@example.com", "TP. Hồ Chí Minh"),
        new("Trứng sạch Việt", "0900000011", "sales11@example.com", "Long An"),
        new("Bao bì Nhà hàng", "0900000012", "sales12@example.com", "TP. Hồ Chí Minh")
    ];

    // ==========================================
    // 3. MAIN SEED METHOD
    // ==========================================

    public static async Task SeedAsync(
        AppDbContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        await SeedRestaurantTablesAsync(context, cancellationToken);

        await SeedCategoriesAndProductsAsync(context, cancellationToken);

        await SeedSuppliersAndIngredientsAsync(context, cancellationToken);

        await SeedProductBomsAsync(context, cancellationToken);

        // await SeedTestIngredientAsync(context, cancellationToken);
    }

    public static async Task SeedPurchaseOrdersAsync(
        AppDbContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        var creator = await context.Users
            .FirstOrDefaultAsync(
                user => user.EmployeeCode == "INV001" &&
                        user.IsActive,
                cancellationToken);
        var suppliers = await context.Suppliers
            .Where(item => item.IsActive)
            .ToDictionaryAsync(item => item.Name, cancellationToken);
        if (creator is null)
        {
            throw new InvalidOperationException(
                "Không tìm thấy tài khoản INV001 để seed phiếu nhập hàng.");
        }

        var ingredients = await context.Ingredients
            .Where(item => item.IsActive)
            .ToDictionaryAsync(item => item.Name, cancellationToken);

        var purchaseSeeds = new[]
        {
            ("Công ty Nguyên liệu Việt", "Phiếu nhập nguyên liệu bếp đợt 1.",
                new[] { ("Hạt cà phê", 5m, 180000m), ("Sữa tươi", 10m, 32000m), ("Đường", 8m, 25000m) }),
            ("Nhà cung cấp Cà phê", "Phiếu nhập nhóm nguyên liệu đồ uống.",
                new[] { ("Hạt cà phê", 8m, 180000m), ("Bột cacao", 4m, 160000m), ("Sữa đặc", 6m, 55000m) }),
            ("Thực phẩm An Toàn", "Phiếu nhập nguyên liệu món ăn nhẹ.",
                new[] { ("Bột mì", 12m, 30000m), ("Kem tươi", 5m, 95000m), ("Đường", 10m, 25000m) }),
            ("Công ty Nguyên liệu Việt", "Phiếu nhập nguyên liệu pha chế.",
                new[] { ("Trà xanh", 4m, 170000m), ("Trà đen", 4m, 150000m), ("Đào ngâm", 6m, 85000m) }),
            ("Nhà cung cấp Cà phê", "Phiếu nhập bổ sung cà phê và sữa.",
                new[] { ("Hạt cà phê", 10m, 180000m), ("Sữa tươi", 15m, 32000m), ("Sữa đặc", 8m, 55000m) }),
            ("Thực phẩm An Toàn", "Phiếu nhập nguyên liệu món tráng miệng.",
                new[] { ("Bột cacao", 3m, 160000m), ("Kem tươi", 8m, 95000m), ("Đường", 6m, 25000m) }),
            ("Công ty Nguyên liệu Việt", "Phiếu nhập nguyên liệu topping.",
                new[] { ("Trân châu", 7m, 60000m), ("Đào ngâm", 5m, 85000m), ("Sữa tươi", 10m, 32000m) }),
            ("Nhà cung cấp Cà phê", "Phiếu nhập nguyên liệu cà phê tháng này.",
                new[] { ("Hạt cà phê", 12m, 180000m), ("Bột cacao", 5m, 160000m), ("Sữa đặc", 10m, 55000m) }),
            ("Thực phẩm An Toàn", "Phiếu nhập nguyên liệu dự phòng.",
                new[] { ("Bột mì", 15m, 30000m), ("Đường", 12m, 25000m), ("Trà xanh", 3m, 170000m) }),
            ("Công ty Nguyên liệu Việt", "Phiếu nhập tổng hợp cuối kỳ.",
                new[] { ("Hạt cà phê", 6m, 180000m), ("Trà đen", 5m, 150000m), ("Trân châu", 6m, 60000m) }),
            ("Nông sản Đà Lạt", "Phiếu nhập rau củ tươi.",
                new[] { ("Cà rốt", 8m, 22000m), ("Xà lách", 5m, 30000m), ("Cà chua", 7m, 25000m) }),
            ("Hải sản Đại Dương", "Phiếu nhập hải sản trong ngày.",
                new[] { ("Tôm", 6m, 220000m), ("Mực", 4m, 190000m), ("Nghêu", 8m, 60000m) }),
            ("Thịt sạch An Phú", "Phiếu nhập thịt tươi.",
                new[] { ("Thịt bò", 5m, 240000m), ("Thịt heo", 8m, 140000m), ("Sườn heo", 6m, 180000m) }),
            ("Gia vị Việt", "Phiếu nhập gia vị và nước sốt.",
                new[] { ("Nước mắm", 5m, 45000m), ("Sốt BBQ", 3m, 85000m), ("Mật ong", 2m, 120000m) }),
            ("Gạo ngon Miền Tây", "Phiếu nhập gạo và nguyên liệu khô.",
                new[] { ("Gạo", 30m, 22000m), ("Bún", 8m, 25000m), ("Phở khô", 5m, 40000m) }),
            ("Thực phẩm Đông lạnh", "Phiếu nhập thực phẩm đông lạnh.",
                new[] { ("Hải sản hỗn hợp", 5m, 210000m), ("Cua", 3m, 280000m), ("Thịt gà", 8m, 95000m) }),
            ("Trứng sạch Việt", "Phiếu nhập trứng và sữa.",
                new[] { ("Trứng gà", 120m, 3000m), ("Sữa tươi", 20m, 32000m), ("Sữa đặc", 8m, 55000m) }),
            ("Công ty Nguyên liệu Việt", "Phiếu nhập đồ uống và topping.",
                new[] { ("Trà xanh", 5m, 170000m), ("Trà đen", 5m, 150000m), ("Đào ngâm", 8m, 85000m) }),
            ("Nhà cung cấp Cà phê", "Phiếu nhập cà phê và nguyên liệu pha chế.",
                new[] { ("Hạt cà phê", 10m, 180000m), ("Trân châu", 6m, 60000m), ("Đường", 10m, 25000m) })
        };

        if (purchaseSeeds.Any(seed =>
                !suppliers.ContainsKey(seed.Item1) ||
                seed.Item3.Any(item => !ingredients.ContainsKey(item.Item1))))
        {
            var missingSuppliers = purchaseSeeds
                .Select(seed => seed.Item1)
                .Distinct()
                .Where(name => !suppliers.ContainsKey(name));
            var missingIngredients = purchaseSeeds
                .SelectMany(seed => seed.Item3)
                .Select(item => item.Item1)
                .Distinct()
                .Where(name => !ingredients.ContainsKey(name));
            throw new InvalidOperationException(
                $"Không thể seed phiếu nhập. Nhà cung cấp chưa có: " +
                $"{string.Join(", ", missingSuppliers)}. Nguyên liệu chưa có: " +
                $"{string.Join(", ", missingIngredients)}.");
        }

        var existingCodes = await context.PurchaseOrders
            .Where(order => order.PurchaseCode.StartsWith("PN-20261105-"))
            .Select(order => order.PurchaseCode)
            .ToHashSetAsync(cancellationToken);

        for (var index = 0; index < purchaseSeeds.Length; index++)
        {
            var seed = purchaseSeeds[index];
            var purchaseCode = $"PN-20261105-{index + 1:000}";
            if (existingCodes.Contains(purchaseCode))
            {
                continue;
            }

            var order = new PurchaseOrder
            {
                PurchaseCode = purchaseCode,
                SupplierId = suppliers[seed.Item1].Id,
                CreatedByUserId = creator.Id,
                Status = "Draft",
                Note = seed.Item2,
                CreatedAt = DateTime.UtcNow.AddMinutes(-(purchaseSeeds.Length - index)),
                PurchaseOrderItems = seed.Item3
                    .Select(item => new PurchaseOrderItem
                    {
                        IngredientId = ingredients[item.Item1].Id,
                        Quantity = item.Item2,
                        UnitPrice = item.Item3,
                        Subtotal = item.Item2 * item.Item3
                    })
                    .ToList()
            };
            order.TotalAmount = order.PurchaseOrderItems.Sum(item => item.Subtotal);

            context.PurchaseOrders.Add(order);
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    public static async Task SeedInventoryTransactionsAsync(
        AppDbContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        var movementSeeds = new[]
        {
            ("Hạt cà phê", "Receipt", 12m, "Nhập hàng mẫu", -4, 1),
            ("Hạt cà phê", "Issue", -0.25m, "Pha chế đồ uống mẫu", 0, 2),
            ("Sữa tươi", "Receipt", 20m, "Nhập hàng mẫu", -3, 3),
            ("Sữa tươi", "Issue", -0.5m, "Pha chế đồ uống mẫu", 0, 4),
            ("Thịt bò", "Receipt", 8m, "Nhập hàng mẫu", -2, 5),
            ("Thịt bò", "Issue", -0.3m, "Chế biến món mẫu", 0, 6),
            ("Đường", "AdjustmentIncrease", 3m, "Điều chỉnh tăng: kiểm kê bổ sung mẫu", -1, 7),
            ("Đường", "Issue", -0.2m, "Chế biến món mẫu", 0, 8),
            ("Tôm", "Receipt", 6m, "Nhập hàng mẫu", -1, 9),
            ("Tôm", "Waste", -0.1m, "Hao hụt: bảo quản mẫu", 0, 10),
            ("Gạo", "Receipt", 25m, "Nhập hàng mẫu", 0, 11),
            ("Gạo", "Issue", -1m, "Chế biến món mẫu", 0, 12)
        };
        var ingredientNames = movementSeeds.Select(seed => seed.Item1).Distinct().ToArray();
        var ingredients = await context.Ingredients
            .Where(item => ingredientNames.Contains(item.Name))
            .ToDictionaryAsync(item => item.Name, cancellationToken);
        var missingIngredients = ingredientNames.Except(ingredients.Keys).ToArray();
        if (missingIngredients.Length > 0)
        {
            throw new InvalidOperationException(
                $"Không thể seed biến động kho. Nguyên liệu chưa có: " +
                $"{string.Join(", ", missingIngredients)}.");
        }

        var existingReferences = await context.InventoryTransactions
            .Where(item => item.ReferenceType == "DemoInventorySeed")
            .Select(item => item.ReferenceId)
            .ToHashSetAsync(cancellationToken);
        var now = DateTime.UtcNow;
        for (var index = 0; index < movementSeeds.Length; index++)
        {
            var seed = movementSeeds[index];
            var referenceId = seed.Item6;
            if (existingReferences.Contains(referenceId))
                continue;

            var ingredient = ingredients[seed.Item1];
            var beforeStock = ingredient.CurrentStock;
            var afterStock = beforeStock + seed.Item3;
            if (afterStock < 0)
            {
                throw new InvalidOperationException(
                    $"Không thể seed biến động kho cho {ingredient.Name}: tồn kho sẽ nhỏ hơn 0.");
            }

            ingredient.CurrentStock = afterStock;
            ingredient.UpdatedAt = now;
            context.InventoryTransactions.Add(new InventoryTransaction
            {
                IngredientId = ingredient.Id,
                Type = seed.Item2,
                Quantity = seed.Item3,
                BeforeStock = beforeStock,
                AfterStock = afterStock,
                ReferenceType = "DemoInventorySeed",
                ReferenceId = referenceId,
                Note = seed.Item4,
                CreatedAt = now.AddDays(seed.Item5)
            });
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    public static async Task SeedFinancialReportDataAsync(
        AppDbContext context,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        var salesSeeds = new[]
        {
            ("Sườn nướng mật ong", 2, "Cash"),
            ("Phở bò", 1, "BankTransfer"),
            ("Cơm chiên hải sản", 2, "Cash"),
            ("Gỏi cuốn tôm thịt", 3, "BankTransfer"),
            ("Bún bò Huế", 1, "Cash"),
            ("Mì xào bò", 2, "BankTransfer"),
            ("Cơm sườn nướng", 1, "Cash"),
            ("Gà nướng muối ớt", 1, "BankTransfer"),
            ("Chè ba màu", 2, "Cash"),
            ("Lẩu Thái hải sản", 1, "BankTransfer")
        };
        var productNames = salesSeeds
            .Select(seed => seed.Item1)
            .Append("Bánh flan")
            .Distinct()
            .ToArray();
        var products = await context.Products
            .Where(product => productNames.Contains(product.Name))
            .ToDictionaryAsync(product => product.Name, cancellationToken);
        var missingProducts = productNames.Except(products.Keys).ToArray();
        if (missingProducts.Length > 0)
        {
            throw new InvalidOperationException(
                $"Không thể seed báo cáo tài chính. Món chưa có: " +
                $"{string.Join(", ", missingProducts)}.");
        }

        var tables = await context.RestaurantTables
            .OrderBy(table => table.TableNumber)
            .ToListAsync(cancellationToken);
        if (tables.Count == 0)
            throw new InvalidOperationException("Không thể seed báo cáo: chưa có bàn nhà hàng.");

        var existingOrderCodes = await context.Orders
            .Where(order => order.OrderCode.StartsWith("DEMO-FIN-"))
            .Select(order => order.OrderCode)
            .ToHashSetAsync(cancellationToken);
        var now = DateTime.UtcNow;

        for (var index = 0; index < salesSeeds.Length; index++)
        {
            var seed = salesSeeds[index];
            var orderCode = $"DEMO-FIN-{index + 1:000}";
            if (existingOrderCodes.Contains(orderCode))
                continue;

            var product = products[seed.Item1];
            var subtotal = product.Price * seed.Item2;
            var paidAt = now.AddDays(-index);
            var order = new Order
            {
                OrderCode = orderCode,
                TableId = tables[index % tables.Count].Id,
                Status = "Completed",
                Subtotal = subtotal,
                Discount = 0,
                Tax = 0,
                TotalAmount = subtotal,
                Note = "Dữ liệu mẫu báo cáo tài chính",
                CreatedAt = paidAt.AddMinutes(-30),
                CompletedAt = paidAt,
                OrderItems =
                [
                    new OrderItem
                    {
                        ProductId = product.Id,
                        ProductName = product.Name,
                        Quantity = seed.Item2,
                        UnitPrice = product.Price,
                        Subtotal = subtotal,
                        Status = "Ready",
                        CreatedAt = paidAt.AddMinutes(-30)
                    }
                ],
                Payments =
                [
                    new Payment
                    {
                        Amount = subtotal,
                        PaymentMethod = seed.Item3,
                        Status = "Paid",
                        ReceivedAmount = seed.Item3 == "Cash" ? subtotal : null,
                        ChangeAmount = seed.Item3 == "Cash" ? 0 : null,
                        TransactionCode = seed.Item3 == "BankTransfer"
                            ? $"DEMO-FIN-TX-{index + 1:000}"
                            : null,
                        TransferContent = seed.Item3 == "BankTransfer"
                            ? $"Thanh toan {orderCode}"
                            : null,
                        PaidAt = paidAt,
                        CreatedAt = paidAt
                    }
                ]
            };
            context.Orders.Add(order);
        }

        const string pendingOrderCode = "DEMO-FIN-PENDING";
        if (!existingOrderCodes.Contains(pendingOrderCode))
        {
            var product = products["Bánh flan"];
            var pendingAmount = product.Price * 2;
            var createdAt = now;
            context.Orders.Add(new Order
            {
                OrderCode = pendingOrderCode,
                TableId = tables[0].Id,
                Status = "Pending",
                Subtotal = pendingAmount,
                Discount = 0,
                Tax = 0,
                TotalAmount = pendingAmount,
                Note = "Dữ liệu mẫu đơn đang chờ thanh toán",
                CreatedAt = createdAt,
                OrderItems =
                [
                    new OrderItem
                    {
                        ProductId = product.Id,
                        ProductName = product.Name,
                        Quantity = 2,
                        UnitPrice = product.Price,
                        Subtotal = pendingAmount,
                        Status = "Pending",
                        CreatedAt = createdAt
                    }
                ],
                Payments =
                [
                    new Payment
                    {
                        Amount = pendingAmount,
                        PaymentMethod = "Cash",
                        Status = "Pending",
                        CreatedAt = createdAt
                    }
                ]
            });
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    // ==========================================
    // 4. SEED RESTAURANT TABLES
    // ==========================================

    private static async Task SeedRestaurantTablesAsync(
        AppDbContext context,
        CancellationToken cancellationToken)
    {
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
    }

    // ==========================================
    // 5. SEED CATEGORIES AND PRODUCTS
    // ==========================================

    private static async Task SeedCategoriesAndProductsAsync(
        AppDbContext context,
        CancellationToken cancellationToken)
    {
        var existingCategories = await context.Categories
            .ToListAsync(cancellationToken);

        foreach (var categorySeed in Categories)
        {
            var category = existingCategories
                .FirstOrDefault(x => x.Name == categorySeed.Name);

            if (category == null)
            {
                category = new Category
                {
                    Name = categorySeed.Name,
                    Description = categorySeed.Description,
                    DisplayOrder = categorySeed.DisplayOrder,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                context.Categories.Add(category);
                existingCategories.Add(category);
            }

            else
            {
                category.Description = categorySeed.Description;
                category.DisplayOrder = categorySeed.DisplayOrder;
                category.IsActive = true;
            }

            await context.SaveChangesAsync(cancellationToken);

            foreach (var productSeed in categorySeed.Products)
            {
                var product = await context.Products
                    .FirstOrDefaultAsync(
                        x => x.CategoryId == category.Id &&
                             x.Name == productSeed.Name,
                        cancellationToken);

                if (product == null)
                {
                    product = new Product
                    {
                        CategoryId = category.Id,
                        Name = productSeed.Name,
                        Description = productSeed.Description,
                        Price = productSeed.Price,
                        ImageUrl = null,
                        PreparationTime = productSeed.PreparationTime,
                        IsAvailable = true,
                        CreatedAt = DateTime.UtcNow
                    };

                    context.Products.Add(product);
                }
                else
                {
                    product.Description = productSeed.Description;
                    product.Price = productSeed.Price;
                    product.PreparationTime = productSeed.PreparationTime;
                    product.IsAvailable = true;
                    product.UpdatedAt = DateTime.UtcNow;
                }
            }

            await context.SaveChangesAsync(cancellationToken);
        }
    }

    private static async Task SeedSuppliersAndIngredientsAsync(
        AppDbContext context,
        CancellationToken cancellationToken)
    {
        foreach (var supplierSeed in Suppliers)
        {
            var supplier = await context.Suppliers
                .FirstOrDefaultAsync(
                    item => item.Name == supplierSeed.Name,
                    cancellationToken);

            if (supplier is null)
            {
                context.Suppliers.Add(new Supplier
                {
                    Name = supplierSeed.Name,
                    Phone = supplierSeed.Phone,
                    Email = supplierSeed.Email,
                    Address = supplierSeed.Address,
                    IsActive = true
                });
            }
            else
            {
                supplier.IsActive = true;
            }
        }

        foreach (var seed in Ingredients)
        {
            var ingredient = await context.Ingredients
                .FirstOrDefaultAsync(
                    item => item.Name == seed.Name,
                    cancellationToken);

            if (ingredient is null)
            {
                context.Ingredients.Add(new Ingredient
                {
                    Name = seed.Name,
                    Unit = seed.Unit,
                    CurrentStock = 0,
                    MinStock = seed.MinimumStock,
                    CostPerUnit = seed.CostPerUnit,
                    IsActive = true
                });
            }
            else
            {
                ingredient.IsActive = true;
                ingredient.Unit = seed.Unit;
                ingredient.MinStock = seed.MinimumStock;
                ingredient.CostPerUnit ??= seed.CostPerUnit;
            }
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    private static async Task SeedProductBomsAsync(
        AppDbContext context,
        CancellationToken cancellationToken)
    {
        var productNames = ProductBoms.Select(seed => seed.ProductName).ToHashSet();
        var ingredientNames = ProductBoms
            .SelectMany(seed => seed.Ingredients)
            .Select(seed => seed.Name)
            .ToHashSet();
        var products = await context.Products
            .Where(product => productNames.Contains(product.Name))
            .ToListAsync(cancellationToken);
        var ingredients = await context.Ingredients
            .Where(ingredient => ingredientNames.Contains(ingredient.Name))
            .ToListAsync(cancellationToken);
        var productsByName = products
            .GroupBy(product => product.Name)
            .ToDictionary(group => group.Key, group => group.First());
        var ingredientsByName = ingredients
            .GroupBy(ingredient => ingredient.Name)
            .ToDictionary(group => group.Key, group => group.First());
        var missingProducts = productNames.Except(productsByName.Keys).ToArray();
        var missingIngredients = ingredientNames.Except(ingredientsByName.Keys).ToArray();
        if (missingProducts.Length > 0 || missingIngredients.Length > 0)
        {
            throw new InvalidOperationException(
                $"Không thể seed BOM. Món chưa có: {string.Join(", ", missingProducts)}. " +
                $"Nguyên liệu chưa có: {string.Join(", ", missingIngredients)}.");
        }

        var productIds = products.Select(product => product.Id).ToArray();
        var existingItems = await context.ProductIngredients
            .Where(item => productIds.Contains(item.ProductId))
            .ToListAsync(cancellationToken);
        var existingByKey = existingItems.ToDictionary(
            item => (item.ProductId, item.IngredientId));

        foreach (var recipe in ProductBoms)
        {
            var product = productsByName[recipe.ProductName];
            foreach (var recipeIngredient in recipe.Ingredients)
            {
                var ingredient = ingredientsByName[recipeIngredient.Name];
                var key = (product.Id, ingredient.Id);
                if (existingByKey.ContainsKey(key))
                    continue;

                var item = new ProductIngredient
                {
                    ProductId = product.Id,
                    IngredientId = ingredient.Id,
                    Quantity = recipeIngredient.Quantity
                };
                context.ProductIngredients.Add(item);
                existingByKey.Add(key, item);
            }
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    // ==========================================
    // 6. SEED TEST INGREDIENT AND COFFEE RECIPE
    // ==========================================

    // private static async Task SeedTestIngredientAsync(
    //     AppDbContext context,
    //     CancellationToken cancellationToken)
    // {
    //     var testIngredient = await context.Ingredients
    //         .FirstOrDefaultAsync(
    //             ingredient => ingredient.Name == "Hạt cà phê test",
    //             cancellationToken);

    //     if (testIngredient == null)
    //     {
    //         testIngredient = new Ingredient
    //         {
    //             Name = "Hạt cà phê test",
    //             Unit = "kg",
    //             CurrentStock = 0.10m,
    //             MinStock = 0.02m,
    //             CostPerUnit = 250000m,
    //             IsActive = true,
    //             CreatedAt = DateTime.UtcNow
    //         };

    //         context.Ingredients.Add(testIngredient);

    //         await context.SaveChangesAsync(cancellationToken);
    //     }
    //     else
    //     {
    //         testIngredient.CurrentStock = 0.10m;
    //         testIngredient.MinStock = 0.02m;
    //         testIngredient.Unit = "kg";

    //         await context.SaveChangesAsync(cancellationToken);
    //     }

    //     var blackCoffee = await context.Products
    //         .FirstOrDefaultAsync(
    //             product => product.Name == "Cà phê đen",
    //             cancellationToken);

    //     if (blackCoffee == null)
    //     {
    //         return;
    //     }

    //     var existingRecipe = await context.ProductIngredients
    //         .FirstOrDefaultAsync(
    //             item => item.ProductId == blackCoffee.Id &&
    //                     item.IngredientId == testIngredient.Id,
    //             cancellationToken);

    //     if (existingRecipe == null)
    //     {
    //         context.ProductIngredients.Add(new ProductIngredient
    //         {
    //             ProductId = blackCoffee.Id,
    //             IngredientId = testIngredient.Id,
    //             Quantity = 0.02m
    //         });
    //     }
    //     else
    //     {
    //         existingRecipe.Quantity = 0.02m;
    //     }

    //     await context.SaveChangesAsync(cancellationToken);
    // }
}
