using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[Route("api/tables")]
public sealed class TablesController : ApiScaffoldController
{
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
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GenerateQrToken(int id)
        => NotImplementedForDemo();

    [HttpGet("qr/{qrToken:guid}")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult GetTableByQrToken(Guid qrToken)
        => NotImplementedForDemo();

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
