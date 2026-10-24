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
        <strong>Bàn {String(table.id).padStart(2, "0")}</strong>
        <span>{table.status === "maintenance" ? "♧" : "▱"}</span>
      </div>
      <StatusBadge kind={kind}>{label}</StatusBadge>
      <p>
        {table.status === "reserved"
          ? "18:00 · Chị Lan"
          : table.status === "maintenance"
            ? "Đang sửa ghế"
            : table.status === "empty"
              ? `${table.guests} chỗ ngồi`
              : `${table.guests} khách · ${table.minutes} phút`}
      </p>
      <b>{table.total ? formatMoney(table.total) : "—"}</b>
    </button>
  );
}

export function TableDetails({ table, onOpenOrder }) {
  if (!table) return null;
  return (
    <aside className="detail-card">
      <h2>Bàn {String(table.id).padStart(2, "0")}</h2>
      <p>Sảnh chính · {table.guests} / 4 chỗ ngồi</p>
      <div className="detail-list">
        <div>
          <span>Đơn đang phục vụ</span>
          <b>{table.total ? `#AN-1410-00${table.id}` : "—"}</b>
        </div>
        <div>
          <span>Bắt đầu</span>
          <b>{table.total ? "12:20" : "—"}</b>
        </div>
        <div>
          <span>Phụ trách</span>
          <b>Thu Hà</b>
        </div>
      </div>
      {table.total > 0 && (
        <>
          <div className="detail-total">
            <span>Tiền phát sinh</span>
            <strong>{formatMoney(table.total)}</strong>
          </div>
          <small>Chưa gồm ưu đãi và thuế khi thanh toán.</small>
        </>
      )}
      <div className="warning">
        ⚠ Khách gọi nhân viên. Vui lòng kiểm tra tại bàn.
      </div>
      <button className="secondary">Tiếp nhận yêu cầu</button>
      <button className="primary full" onClick={onOpenOrder}>
        Mở bàn & tạo đơn
      </button>
    </aside>
  );
}
