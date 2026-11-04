import { formatMoney } from "../../data/posData";
import { StatusBadge } from "../shared/Ui";

export function TableCard({ table, selected, onClick }) {
  const label =
    table.status === "occupied"
      ? "Có khách"
      : table.status === "reserved"
        ? "Đã đặt"
        : table.status === "maintenance"
          ? "Bảo trì"
          : "Trống";
  const kind =
    table.status === "occupied"
      ? "green"
      : table.status === "reserved"
        ? "blue"
        : table.status === "maintenance"
          ? "red"
          : "gray";
  return (
    <button
      className={`table-card ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <div className="table-card-head">
        <strong>{table.tableNumber}</strong>
        <span>{table.status === "maintenance" ? "♧" : "▱"}</span>
      </div>
      <StatusBadge kind={kind}>{label}</StatusBadge>
      <p>
        {table.status === "reserved"
          ? "18:00 · Chị Lan"
          : table.status === "maintenance"
            ? "Đang sửa ghế"
            : table.status === "empty"
              ? `${table.capacity} chỗ ngồi`
              : `${table.capacity} chỗ ngồi`}
      </p>
      <b>{table.total ? formatMoney(table.total) : "—"}</b>
    </button>
  );
}

export function TableDetails({ table, onOpenOrder }) {
  if (!table) return null;
  return (
    <aside className="detail-card">
      <h2>{table.tableNumber}</h2>
      <p>{table.capacity} chỗ ngồi</p>
      <div className="detail-list">
        <div>
          <span>Đơn đang phục vụ</span>
          <b>{table.activeOrder?.orderCode || "Chưa có đơn"}</b>
        </div>
        <div>
          <span>Bắt đầu</span>
          <b>
            {table.activeOrder
              ? new Date(table.activeOrder.createdAt).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </b>
        </div>
        <div>
          <span>Trạng thái</span>
          <b>{table.status}</b>
        </div>
      </div>
      <button className="primary full" onClick={onOpenOrder}>
        Xem chi tiết bàn
      </button>
    </aside>
  );
}
