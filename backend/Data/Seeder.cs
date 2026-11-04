
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

        await SeedTestIngredientAsync(context, cancellationToken);
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
            return;
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
                new[] { ("Hạt cà phê", 6m, 180000m), ("Trà đen", 5m, 150000m), ("Trân châu", 6m, 60000m) })
        };

        if (purchaseSeeds.Any(seed =>
                !suppliers.ContainsKey(seed.Item1) ||
                seed.Item3.Any(item => !ingredients.ContainsKey(item.Item1))))
        {
            return;
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
        var suppliers = new[]
        {
            new Supplier
            {
                Name = "Công ty Nguyên liệu Việt",
                Phone = "0900000001",
                Email = "sales1@example.com",
                Address = "TP. Hồ Chí Minh"
            },
            new Supplier
            {
                Name = "Nhà cung cấp Cà phê",
                Phone = "0900000002",
                Email = "sales2@example.com",
                Address = "Đắk Lắk"
            },
            new Supplier
            {
                Name = "Thực phẩm An Toàn",
                Phone = "0900000003",
                Email = "sales3@example.com",
                Address = "TP. Hồ Chí Minh"
            }
        };

        foreach (var supplierSeed in suppliers)
        {
            var supplier = await context.Suppliers
                .FirstOrDefaultAsync(
                    item => item.Name == supplierSeed.Name,
                    cancellationToken);

            if (supplier is null)
            {
                context.Suppliers.Add(supplierSeed);
            }
            else
            {
                supplier.IsActive = true;
            }
        }

        var ingredients = new[]
        {
            ("Hạt cà phê", "kg", 3m, 180000m),
            ("Sữa tươi", "lít", 2m, 32000m),
            ("Đường", "kg", 2m, 25000m)
        };

        foreach (var (name, unit, minimumStock, costPerUnit) in ingredients)
        {
            var ingredient = await context.Ingredients
                .FirstOrDefaultAsync(
                    item => item.Name == name,
                    cancellationToken);

            if (ingredient is null)
            {
                context.Ingredients.Add(new Ingredient
                {
                    Name = name,
                    Unit = unit,
                    CurrentStock = 0,
                    MinStock = minimumStock,
                    CostPerUnit = costPerUnit,
                    IsActive = true
                });
            }
            else
            {
                ingredient.IsActive = true;
                ingredient.Unit = unit;
                ingredient.MinStock = minimumStock;
                ingredient.CostPerUnit ??= costPerUnit;
            }
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    // ==========================================
    // 6. SEED TEST INGREDIENT AND COFFEE RECIPE
    // ==========================================

    private static async Task SeedTestIngredientAsync(
        AppDbContext context,
        CancellationToken cancellationToken)
    {
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

            await context.SaveChangesAsync(cancellationToken);
        }

        var blackCoffee = await context.Products
            .FirstOrDefaultAsync(
                product => product.Name == "Cà phê đen",
                cancellationToken);

        if (blackCoffee == null)
        {
            return;
        }

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
