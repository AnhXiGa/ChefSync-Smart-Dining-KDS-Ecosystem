using System.Text.Json;
using backend.Data;
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
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetTables()
        => NotImplementedForDemo();

    [HttpGet("{id:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetTable(int id)
        => NotImplementedForDemo();

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult CreateTable([FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult UpdateTable(int id, [FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpPatch("{id:int}/status")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult UpdateTableStatus(int id, [FromBody] JsonElement request)
        => NotImplementedForDemo();

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult DeleteTable(int id)
        => NotImplementedForDemo();

    [HttpPost("{id:int}/qr-token")]
    public async Task<IActionResult> GenerateQrToken(int id)
    {
        var table = await _context.RestaurantTables.FindAsync(id);
        if (table == null)
            return NotFound();

        table.QrToken = Guid.NewGuid();
        table.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

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
