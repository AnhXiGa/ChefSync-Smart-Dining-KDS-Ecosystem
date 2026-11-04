using Microsoft.EntityFrameworkCore;

namespace backend.Data
{
    /// <summary>
    /// Seeds initial master data for SmartPOSDb.
    /// Safe to run repeatedly: each record is inserted only when its natural key
    /// does not already exist.
    ///
    /// Adjust the namespace if your DbContext is located elsewhere.
    /// </summary>
    public static class SmartPosSeeder
    {
        public static async Task SeedAsync(DbContext context, CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(context);

            await using var transaction =
                await context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                // Roles
                await context.Database.ExecuteSqlRawAsync(
                    """
                    INSERT INTO public."Roles" ("Name", "Description")
                    SELECT v."Name", v."Description"
                    FROM (VALUES
                        ('Admin', 'Quản trị hệ thống'),
                        ('Cashier', 'Nhân viên thu ngân'),
                        ('Kitchen', 'Nhân viên bếp')
                    ) AS v("Name", "Description")
                    WHERE NOT EXISTS (
                        SELECT 1 FROM public."Roles" r WHERE r."Name" = v."Name"
                    );
                    """, cancellationToken);

                // Categories
                await context.Database.ExecuteSqlRawAsync(
                    """
                    INSERT INTO public."Categories"
                        ("Name", "Description", "DisplayOrder", "IsActive", "CreatedAt")
                    SELECT v."Name", v."Description", v."DisplayOrder", TRUE, CURRENT_TIMESTAMP
                    FROM (VALUES
                        ('Cà phê', 'Các loại cà phê', 1),
                        ('Trà', 'Trà trái cây và trà sữa', 2),
                        ('Đá xay', 'Thức uống đá xay', 3),
                        ('Bánh ngọt', 'Bánh và món ăn nhẹ', 4)
                    ) AS v("Name", "Description", "DisplayOrder")
                    WHERE NOT EXISTS (
                        SELECT 1 FROM public."Categories" c WHERE c."Name" = v."Name"
                    );
                    """, cancellationToken);

                // Ingredients
                await context.Database.ExecuteSqlRawAsync(
                    """
                    INSERT INTO public."Ingredients"
                        ("Name", "Unit", "CurrentStock", "MinStock", "CostPerUnit",
                         "IsActive", "CreatedAt")
                    SELECT v."Name", v."Unit", v."CurrentStock", v."MinStock",
                           v."CostPerUnit", TRUE, CURRENT_TIMESTAMP
                    FROM (VALUES
                        ('Hạt cà phê', 'kg', 20.000::numeric, 3.000::numeric, 180000.00::numeric),
                        ('Sữa tươi', 'lít', 30.000::numeric, 5.000::numeric, 32000.00::numeric),
                        ('Sữa đặc', 'kg', 15.000::numeric, 3.000::numeric, 55000.00::numeric),
                        ('Đường', 'kg', 12.000::numeric, 2.000::numeric, 25000.00::numeric),
                        ('Trà đen', 'kg', 8.000::numeric, 1.000::numeric, 150000.00::numeric),
                        ('Trà xanh', 'kg', 8.000::numeric, 1.000::numeric, 170000.00::numeric),
                        ('Đào ngâm', 'kg', 10.000::numeric, 2.000::numeric, 85000.00::numeric),
                        ('Trân châu', 'kg', 5.000::numeric, 1.000::numeric, 60000.00::numeric),
                        ('Bột cacao', 'kg', 4.000::numeric, 1.000::numeric, 160000.00::numeric),
                        ('Bột mì', 'kg', 10.000::numeric, 2.000::numeric, 30000.00::numeric),
                        ('Kem tươi', 'lít', 5.000::numeric, 1.000::numeric, 95000.00::numeric)
                    ) AS v("Name", "Unit", "CurrentStock", "MinStock", "CostPerUnit")
                    WHERE NOT EXISTS (
                        SELECT 1 FROM public."Ingredients" i WHERE i."Name" = v."Name"
                    );
                    """, cancellationToken);

                // Suppliers
                await context.Database.ExecuteSqlRawAsync(
                    """
                    INSERT INTO public."Suppliers"
                        ("Name", "Phone", "Email", "Address", "IsActive", "CreatedAt")
                    SELECT v."Name", v."Phone", v."Email", v."Address", TRUE, CURRENT_TIMESTAMP
                    FROM (VALUES
                        ('Công ty Nguyên liệu Việt', '0900000001', 'sales1@example.com', 'TP. Hồ Chí Minh'),
                        ('Nhà cung cấp Cà phê', '0900000002', 'sales2@example.com', 'Đắk Lắk'),
                        ('Thực phẩm An Toàn', '0900000003', 'sales3@example.com', 'TP. Hồ Chí Minh')
                    ) AS v("Name", "Phone", "Email", "Address")
                    WHERE NOT EXISTS (
                        SELECT 1 FROM public."Suppliers" s WHERE s."Name" = v."Name"
                    );
                    """, cancellationToken);

                // Restaurant tables
                await context.Database.ExecuteSqlRawAsync(
                    """
                    INSERT INTO public."RestaurantTables"
                        ("TableNumber", "Capacity", "Status", "CreatedAt")
                    SELECT v."TableNumber", v."Capacity", 'Available', CURRENT_TIMESTAMP
                    FROM (VALUES
                        ('T01', 2), ('T02', 2), ('T03', 4), ('T04', 4),
                        ('T05', 4), ('T06', 6), ('T07', 6), ('T08', 8)
                    ) AS v("TableNumber", "Capacity")
                    WHERE NOT EXISTS (
                        SELECT 1 FROM public."RestaurantTables" t
                        WHERE t."TableNumber" = v."TableNumber"
                    );
                    """, cancellationToken);

                // Products
                await context.Database.ExecuteSqlRawAsync(
                    """
                    INSERT INTO public."Products"
                        ("CategoryId", "Name", "Description", "Price", "ImageUrl",
                         "PreparationTime", "IsAvailable", "CreatedAt")
                    SELECT c."Id", v."Name", v."Description", v."Price",
                           v."ImageUrl", v."PreparationTime", TRUE, CURRENT_TIMESTAMP
                    FROM (VALUES
                        ('Cà phê', 'Cà phê đen', 'Cà phê đen truyền thống', 25000.00::numeric, NULL::varchar, 5),
                        ('Cà phê', 'Cà phê sữa', 'Cà phê kết hợp sữa đặc', 29000.00::numeric, NULL::varchar, 5),
                        ('Cà phê', 'Bạc xỉu', 'Cà phê sữa nhiều sữa', 32000.00::numeric, NULL::varchar, 5),
                        ('Trà', 'Trà đào', 'Trà đào cam sả', 35000.00::numeric, NULL::varchar, 7),
                        ('Trà', 'Trà sữa trân châu', 'Trà sữa truyền thống với trân châu', 38000.00::numeric, NULL::varchar, 7),
                        ('Trà', 'Trà xanh sữa', 'Trà xanh kết hợp sữa tươi', 35000.00::numeric, NULL::varchar, 7),
                        ('Đá xay', 'Cacao đá xay', 'Cacao xay cùng đá và sữa', 42000.00::numeric, NULL::varchar, 8),
                        ('Bánh ngọt', 'Bánh bông lan', 'Bánh bông lan mềm', 30000.00::numeric, NULL::varchar, 3),
                        ('Bánh ngọt', 'Bánh cacao', 'Bánh vị cacao', 35000.00::numeric, NULL::varchar, 3)
                    ) AS v("CategoryName", "Name", "Description", "Price", "ImageUrl", "PreparationTime")
                    INNER JOIN public."Categories" c ON c."Name" = v."CategoryName"
                    WHERE NOT EXISTS (
                        SELECT 1 FROM public."Products" p WHERE p."Name" = v."Name"
                    );
                    """, cancellationToken);

                // Product recipes / BOM
                // Quantities are illustrative sample recipes; replace with your real recipes.
                await context.Database.ExecuteSqlRawAsync(
                    """
                    INSERT INTO public."ProductIngredients" ("ProductId", "IngredientId", "Quantity")
                    SELECT p."Id", i."Id", v."Quantity"
                    FROM (VALUES
                        ('Cà phê đen', 'Hạt cà phê', 0.020::numeric),
                        ('Cà phê sữa', 'Hạt cà phê', 0.020::numeric),
                        ('Cà phê sữa', 'Sữa đặc', 0.025::numeric),
                        ('Bạc xỉu', 'Hạt cà phê', 0.010::numeric),
                        ('Bạc xỉu', 'Sữa tươi', 0.100::numeric),
                        ('Bạc xỉu', 'Sữa đặc', 0.020::numeric),
                        ('Trà đào', 'Trà đen', 0.008::numeric),
                        ('Trà đào', 'Đào ngâm', 0.050::numeric),
                        ('Trà đào', 'Đường', 0.020::numeric),
                        ('Trà sữa trân châu', 'Trà đen', 0.008::numeric),
                        ('Trà sữa trân châu', 'Sữa tươi', 0.100::numeric),
                        ('Trà sữa trân châu', 'Trân châu', 0.040::numeric),
                        ('Trà xanh sữa', 'Trà xanh', 0.008::numeric),
                        ('Trà xanh sữa', 'Sữa tươi', 0.100::numeric),
                        ('Cacao đá xay', 'Bột cacao', 0.025::numeric),
                        ('Cacao đá xay', 'Sữa tươi', 0.100::numeric),
                        ('Cacao đá xay', 'Đường', 0.020::numeric),
                        ('Bánh bông lan', 'Bột mì', 0.080::numeric),
                        ('Bánh cacao', 'Bột mì', 0.070::numeric),
                        ('Bánh cacao', 'Bột cacao', 0.015::numeric)
                    ) AS v("ProductName", "IngredientName", "Quantity")
                    INNER JOIN public."Products" p ON p."Name" = v."ProductName"
                    INNER JOIN public."Ingredients" i ON i."Name" = v."IngredientName"
                    WHERE NOT EXISTS (
                        SELECT 1 FROM public."ProductIngredients" pi
                        WHERE pi."ProductId" = p."Id"
                          AND pi."IngredientId" = i."Id"
                    );
                    """, cancellationToken);

                await transaction.CommitAsync(cancellationToken);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }
    }
}
