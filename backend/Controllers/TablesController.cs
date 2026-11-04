using System.Text.Json;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[Route("api/tables")]
public sealed class TablesController : ApiScaffoldController
{
    private readonly AppDbContext _context;

    public TablesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetTables()
    {
        var tables = await _context.RestaurantTables
            .AsNoTracking()
            .OrderBy(table => table.TableNumber)
            .Select(table => new
            {
                table.Id,
                table.TableNumber,
                table.Capacity,
                table.Status,
                table.QrToken,
                table.CreatedAt,
                table.UpdatedAt
            })
            .ToListAsync();

        return Ok(tables.Select(table => new
        {
            table.Id,
            table.TableNumber,
            table.Capacity,
            table.Status,
            QrToken = table.QrToken.ToString("N"),
            table.CreatedAt,
            table.UpdatedAt
        }));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetTable(int id)
    {
        var table = await _context.RestaurantTables.AsNoTracking()
            .FirstOrDefaultAsync(table => table.Id == id);
        return table == null ? NotFound() : Ok(new
        {
            table.Id,
            table.TableNumber,
            table.Capacity,
            table.Status,
            QrToken = table.QrToken.ToString("N")
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateTable([FromBody] TableRequest request)
    {
        var tableNumber = request.TableNumber?.Trim();
        if (string.IsNullOrWhiteSpace(tableNumber) || tableNumber.Length > 20)
            return BadRequest(new { message = "Tên bàn phải có từ 1 đến 20 ký tự." });
        if (request.Capacity < 1 || request.Capacity > 100)
            return BadRequest(new { message = "Sức chứa phải từ 1 đến 100 người." });
        if (await _context.RestaurantTables.AnyAsync(table => table.TableNumber == tableNumber))
            return Conflict(new { message = "Tên bàn đã tồn tại." });

        var table = new RestaurantTable
        {
            TableNumber = tableNumber,
            Capacity = request.Capacity,
            Status = "Available",
            QrToken = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow
        };
        _context.RestaurantTables.Add(table);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTable), new { id = table.Id }, new
        {
            table.Id,
            table.TableNumber,
            table.Capacity,
            table.Status,
            QrToken = table.QrToken.ToString("N")
        });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateTable(int id, [FromBody] TableRequest request)
    {
        var table = await _context.RestaurantTables.FindAsync(id);
        if (table == null) return NotFound();

        var tableNumber = request.TableNumber?.Trim();
        if (string.IsNullOrWhiteSpace(tableNumber) || tableNumber.Length > 20)
            return BadRequest(new { message = "Tên bàn phải có từ 1 đến 20 ký tự." });
        if (request.Capacity < 1 || request.Capacity > 100)
            return BadRequest(new { message = "Sức chứa phải từ 1 đến 100 người." });
        if (await _context.RestaurantTables.AnyAsync(other => other.Id != id && other.TableNumber == tableNumber))
            return Conflict(new { message = "Tên bàn đã tồn tại." });

        table.TableNumber = tableNumber;
        table.Capacity = request.Capacity;
        table.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { table.Id, table.TableNumber, table.Capacity, table.Status, QrToken = table.QrToken.ToString("N") });
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateTableStatus(int id, [FromBody] TableStatusRequest request)
    {
        var validStatuses = new[] { "Available", "Occupied", "Reserved", "Maintenance" };
        var status = validStatuses.FirstOrDefault(value => value.Equals(request.Status, StringComparison.OrdinalIgnoreCase));
        if (status == null) return BadRequest(new { message = "Trạng thái bàn không hợp lệ." });
        var table = await _context.RestaurantTables.FindAsync(id);
        if (table == null) return NotFound();
        table.Status = status;
        table.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { table.Id, table.Status });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteTable(int id)
    {
        var table = await _context.RestaurantTables
            .Include(table => table.Orders)
            .FirstOrDefaultAsync(table => table.Id == id);
        if (table == null) return NotFound();
        if (table.Orders.Count > 0)
            return Conflict(new { message = "Bàn đã có lịch sử đơn hàng nên không thể xóa." });
        _context.RestaurantTables.Remove(table);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/qr-token")]
    public async Task<IActionResult> GenerateQrToken(int id)
    {
        var table = await _context.RestaurantTables.FindAsync(id);
        if (table == null)
            return NotFound();

        return Ok(new { table.Id, table.TableNumber, QrToken = table.QrToken.ToString("N") });
    }

    [HttpGet("qr/{qrToken:guid}")]
    public async Task<IActionResult> GetTableByQrToken(Guid qrToken)
    {
        var table = await _context.RestaurantTables
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.QrToken == qrToken);

        if (table == null)
            return NotFound(new { message = "Mã QR không hợp lệ hoặc bàn không tồn tại." });

        return Ok(new
        {
            table.Id,
            table.TableNumber,
            table.Status,
            table.Capacity,
            QrToken = table.QrToken.ToString("N")
        });
    }

    [HttpPost("transfer")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult TransferTable([FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpPost("merge")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult MergeTables([FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpPost("split")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult SplitTable([FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpPost("{id:int}/call-staff")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult CallStaff(int id)
        => NotImplementedForDemo();

    [HttpGet("{tableId:int}/orders")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetTableOrders(int tableId)
        => NotImplementedForDemo();
}

public sealed class TableRequest
{
    public string? TableNumber { get; set; }
    public int Capacity { get; set; }
}

public sealed class TableStatusRequest
{
    public string? Status { get; set; }
}
