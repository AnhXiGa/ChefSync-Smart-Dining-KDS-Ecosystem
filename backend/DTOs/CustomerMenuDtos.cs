namespace backend.DTOs;

public class TableAuthResponseDto
{
    public int TableId { get; set; }
    public string TableNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class ProductDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public int? PreparationTime { get; set; }
    public int? AvailableQuantity { get; set; }
}

public class CategoryWithProductsDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public List<ProductDto> Products { get; set; } = new();
}

public class CreateOrderRequestDto
{
    public string QrToken { get; set; } = string.Empty;
    public string? Note { get; set; }
    public List<OrderItemRequestDto> Items { get; set; } = new();
}

public class OrderItemRequestDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public string? Note { get; set; }
}
