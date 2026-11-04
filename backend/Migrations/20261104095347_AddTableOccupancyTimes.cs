using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTableOccupancyTimes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "OccupiedAt",
                table: "RestaurantTables",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "VacatedAt",
                table: "RestaurantTables",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "RestaurantTables"
                SET "OccupiedAt" = "UpdatedAt"
                WHERE "Status" = 'Occupied' AND "OccupiedAt" IS NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OccupiedAt",
                table: "RestaurantTables");

            migrationBuilder.DropColumn(
                name: "VacatedAt",
                table: "RestaurantTables");
        }
    }
}
