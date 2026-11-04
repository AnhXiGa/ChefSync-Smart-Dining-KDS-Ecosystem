import { formatMoney } from "../../data/posData";
import { StatusBadge } from "../shared/Ui";

const formatDateTime = (value) => value
  ? new Date(value).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })
  : "—";

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

export function TableDetails({
  table,
  onOpenOrder,
  statuses = [],
  onStatusChange,
  reservation = {},
  onReservationChange,
  reservationSaved = false,
  reservationEditing = false,
  onReservationSave,
  onReservationEdit,
}) {
  if (!table) return null;
  const showOccupancyTimes = table.status === "occupied";
  const showReservationForm = table.apiStatus === "Reserved";
  return (
    <aside className="detail-card">
      <h2>{table.tableNumber}</h2>
      <p>{table.capacity} chỗ ngồi</p>
      <div className="detail-list">
        <div>
          <span>Đơn đang phục vụ</span>
          <b>{table.activeOrder?.orderCode || "Chưa có đơn"}</b>
        </div>
        {showOccupancyTimes && (
          <>
            <div>
              <span>Vào bàn</span>
              <b>{formatDateTime(table.occupiedAt || table.activeOrder?.createdAt)}</b>
            </div>
            <div>
              <span>Kết thúc</span>
              <b>{formatDateTime(table.vacatedAt)}</b>
            </div>
          </>
        )}
        <div>
          <span>Trạng thái</span>
          {onStatusChange ? (
            <select
              className="table-status-select"
              value={table.apiStatus || "Available"}
              onChange={(event) => void onStatusChange(table.id, event.target.value)}
              aria-label={`Cập nhật trạng thái ${table.tableNumber}`}
            >
              {statuses.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          ) : (
            <b>{table.status}</b>
          )}
        </div>
      </div>
      {showReservationForm && onReservationChange && (
        <div className="reservation-details">
          <h3>Thông tin đặt bàn</h3>
          <label>
            <span>Tên người đặt</span>
            <input
              type="text"
              value={reservation.name || ""}
              onChange={(event) => onReservationChange("name", event.target.value)}
              placeholder="Ví dụ: Nguyễn Văn An"
              autoComplete="off"
              disabled={reservationSaved && !reservationEditing}
            />
          </label>
          <label>
            <span>Số điện thoại</span>
            <input
              type="tel"
              value={reservation.phone || ""}
              onChange={(event) => onReservationChange("phone", event.target.value)}
              placeholder="Ví dụ: 0901 234 567"
              inputMode="tel"
              autoComplete="off"
              disabled={reservationSaved && !reservationEditing}
            />
          </label>
          <small>Thông tin chỉ lưu tạm trên trang này.</small>
          <div className="reservation-actions">
            {reservationSaved && !reservationEditing ? (
              <button type="button" className="outline" onClick={onReservationEdit}>
                Chỉnh sửa
              </button>
            ) : (
              <button
                type="button"
                className="primary"
                onClick={onReservationSave}
                disabled={!reservation.name?.trim() || !reservation.phone?.trim()}
              >
                Lưu thông tin
              </button>
            )}
          </div>
        </div>
      )}
      <button className="primary full" onClick={onOpenOrder}>
        Xem chi tiết bàn
      </button>
    </aside>
  );
}
