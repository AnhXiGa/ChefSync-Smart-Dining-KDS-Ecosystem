import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { initialTables } from "../../data/posData";
import { BackofficeLayout, PageTitle } from "../../components/shared/Ui";
import {
  TableCard,
  TableDetails,
} from "../../components/staff/TableComponents";

export function StaffTablesPage() {
  const navigate = useNavigate();
  const [tables] = useState(initialTables);
  const [selectedTable, setSelectedTable] = useState(5);
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
  const openOrder = (id = selectedTable) => navigate(`/staff/order/${id}`);
  return (
    <BackofficeLayout title="Minh Anh · Nhân viên">
      <main className="page">
        <PageTitle
          title="Quản lý bàn"
          description="Ca trưa · 24 bàn tại 2 khu vực · Sẵn sàng phục vụ"
          action={
            <button className="primary" onClick={() => openOrder()}>
              ＋ Tạo đơn mới
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
              <button className="tab">Tất cả khu vực</button>
              <button className="tab selected">Sảnh chính · 12</button>
              <button className="tab">Sân vườn · 12</button>
            </div>
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
            table={tables.find((table) => table.id === selectedTable)}
            onOpenOrder={() => openOrder()}
          />
        </div>
      </main>
    </BackofficeLayout>
  );
}
