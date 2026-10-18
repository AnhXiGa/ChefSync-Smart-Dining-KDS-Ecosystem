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

export function OrderSummary({ cart, total, onRemove, onSave }) {
  return (
    <aside className="order-summary">
      <h2>Đơn #AN-1410-005</h2>
      <p>Gọi tại bàn qua QR · {cart.length || 3} món</p>
      <div className="summary-badges">
        <StatusBadge>Đơn: Đang thực hiện</StatusBadge>
        <StatusBadge kind="orange">Chưa thanh toán</StatusBadge>
      </div>
      {cart.length === 0 ? (
        <div className="empty-order">
          Chưa có món mới.
          <br />
          Chọn món ở danh sách bên trái.
        </div>
      ) : (
        cart.map((item) => (
          <div className="order-line" key={item.name}>
            <div>
              <strong>{item.name}</strong>
              <small>
                {item.quantity} × {formatMoney(item.price)}
              </small>
              <small>Ít dầu, không hành</small>
            </div>
            <b>{formatMoney(item.price * item.quantity)}</b>
            <button
              onClick={() => onRemove(item.name)}
              aria-label={`Xóa ${item.name}`}
            >
              ×
            </button>
          </div>
        ))
      )}
      <label className="note-label">
        Yêu cầu đặc biệt của đơn
        <textarea placeholder="Mang món chính cùng lúc giúp mình nhé." />
      </label>
      <div className="summary-total">
        <span>Tạm tính</span>
        <strong>{formatMoney(total || 275000)}</strong>
      </div>
      <button className="primary full" onClick={onSave}>
        Lưu & gửi bếp
      </button>
    </aside>
  );
}
