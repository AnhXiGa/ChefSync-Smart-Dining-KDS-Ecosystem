import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { BackofficeLayout, PageTitle } from "../../components/shared/Ui";
import {
  TableCard,
  TableDetails,
} from "../../components/staff/TableComponents";

export function StaffTablesPage() {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [error, setError] = useState("");
  const loadTables = useCallback(async () => {
    try {
      const [{ data }, { data: orders }] = await Promise.all([
        axiosClient.get("/api/tables"),
        axiosClient.get("/api/orders"),
      ]);
      const mappedTables = data.map((table) => ({
        ...table,
        activeOrder: orders.find(
          (order) =>
            order.tableId === table.id &&
            !["Completed", "Cancelled"].includes(order.status),
        ),
        status: {
          Available: "empty",
          Occupied: "occupied",
          Reserved: "reserved",
          Maintenance: "maintenance",
        }[table.status] || "empty",
      }));
      // oxlint-disable-next-line react/set-state-in-effect
      setTables(mappedTables);
      // oxlint-disable-next-line react/set-state-in-effect
      // oxlint-disable-next-line react/set-state-in-effect
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không tải được danh sách bàn.");
    }
  }, []);
  useEffect(() => {
    void loadTables();
  }, [loadTables]);
  const stats = [
    [
      "Trống",
      tables.filter((table) => table.status === "empty").length,
      "Có thể nhận khách",
    ],
    [
      "Có khách",
      tables.filter((table) => table.status === "occupied").length,
      "Đang phục vụ",
    ],
    [
      "Đã đặt",
      tables.filter((table) => table.status === "reserved").length,
      "Đã có lịch đặt bàn",
    ],
    [
      "Bảo trì",
      tables.filter((table) => table.status === "maintenance").length,
      "Tạm ngưng sử dụng",
    ],
  ];
  const activeTableId = selectedTable ?? tables[0]?.id;
  const openOrder = (id = activeTableId) => {
    if (id) navigate(`/staff/order/${id}`);
  };
  return (
    <BackofficeLayout title="Minh Anh · Nhân viên">
      <main className="page">
        <PageTitle
          title="Quản lý bàn"
          description="Danh sách bàn được đồng bộ từ hệ thống nhà hàng"
          action={
            <button className="primary" onClick={() => openOrder()}>
              Quản lý bàn
            </button>
          }
        />
        <div className="stats">
          {stats.map(([label, value, hint]) => (
            <div className="stat-card" key={label}>
              <span>{label}</span>
              <strong>{String(value).padStart(2, "0")}</strong>
              <small>{hint}</small>
            </div>
          ))}
        </div>
        <div className="workspace">
          <section>
            <div className="tabs">
              <button className="tab selected">Tất cả bàn · {tables.length}</button>
            </div>
            {error && <div role="alert">{error}</div>}
            <div className="table-grid">
              {tables.map((table) => (
                <TableCard
                  table={table}
                  selected={selectedTable === table.id}
                  onClick={() => setSelectedTable(table.id)}
                  key={table.id}
                />
              ))}
            </div>
          </section>
          <TableDetails
            table={tables.find((table) => table.id === activeTableId)}
            onOpenOrder={() => openOrder()}
          />
        </div>
      </main>
    </BackofficeLayout>
  );
}
