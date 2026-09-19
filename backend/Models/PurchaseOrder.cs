namespace backend.Models;

public class PurchaseOrder
{
    public int Id { get; set; }

    public string PurchaseCode { get; set; } = string.Empty;

    public int SupplierId { get; set; }

    public string Status { get; set; } = "Draft";

    public decimal TotalAmount { get; set; }

    public string? Note { get; set; }

    public int CreatedByUserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ReceivedAt { get; set; }

    // Navigation
    public Supplier Supplier { get; set; } = null!;

    public User CreatedByUser { get; set; } = null!;

    public ICollection<PurchaseOrderItem> PurchaseOrderItems { get; set; }
        = new List<PurchaseOrderItem>();
}