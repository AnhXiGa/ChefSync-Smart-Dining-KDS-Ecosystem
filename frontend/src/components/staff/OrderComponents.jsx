import { formatMoney } from "../../data/posData";
import { FoodImage, StatusBadge } from "../shared/Ui";

export function MenuCard({ item, onAdd }) {
  return (
    <article className="menu-card">
      <FoodImage tone={item.tone} />
      <h3>{item.name}</h3>
      <div className="menu-meta">
        <strong>{formatMoney(item.price)}</strong>
        <small>{item.time}</small>
      </div>
      <button className="add-button" onClick={onAdd}>
        ＋ Thêm món
      </button>
    </article>
  );
}

export function OrderSummary({
  cart,
  total,
  onRemove,
  onSave,
  onPayment,
  saving = false,
  paymentDisabled = false,
  existingOrder = null,
}) {
  const displayItems = cart.length > 0
    ? cart
    : (existingOrder?.items || []).map((item) => ({
        ...item,
        name: item.productName,
        price: item.unitPrice,
      }));
  const displayTotal = cart.length > 0 ? total : existingOrder?.totalAmount || 0;
  return (
    <aside className="order-summary">
      <h2>{existingOrder?.orderCode || "Chưa có đơn"}</h2>
      <p>Gọi món qua QR · {displayItems.length} món</p>
      <div className="summary-badges">
        <StatusBadge>Đơn: Đang thực hiện</StatusBadge>
        <StatusBadge kind="orange">Chưa thanh toán</StatusBadge>
      </div>
      {displayItems.length === 0 ? (
        <div className="empty-order">
          Chưa có món mới.
          <br />
          Chọn món ở danh sách bên trái.
        </div>
      ) : (
        displayItems.map((item) => (
          <div className="order-line" key={item.name}>
            <div>
              <strong>{item.name}</strong>
              <small>
                {item.quantity} × {formatMoney(item.price)}
              </small>
              <small>Ít dầu, không hành</small>
            </div>
            <b>{formatMoney(item.price * item.quantity)}</b>
            {cart.length > 0 && <button
              onClick={() => onRemove(item.name)}
              aria-label={`Xóa ${item.name}`}
            >
              ×
            </button>}
          </div>
        ))
      )}
      <label className="note-label">
        Yêu cầu đặc biệt của đơn
        <textarea placeholder="Mang món chính cùng lúc giúp mình nhé." />
      </label>
      <div className="summary-total">
        <span>Tạm tính</span>
        <strong>{formatMoney(displayTotal)}</strong>
      </div>
      {cart.length > 0 && (
        <button className="primary full" onClick={onSave} disabled={saving}>
          {saving ? "Đang gửi…" : "Lưu & gửi bếp"}
        </button>
      )}
      <button
        className="secondary full"
        onClick={onPayment}
        disabled={paymentDisabled}
      >
        Thanh toán đơn hiện tại
      </button>
    </aside>
  );
}
