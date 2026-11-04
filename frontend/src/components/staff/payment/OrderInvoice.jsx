import { PaymentStatus } from "./PaymentStatus";

const money = (value) => `${new Intl.NumberFormat("vi-VN").format(value || 0)} ₫`;

export function OrderInvoice({ order, paymentStatus, onCancelPayment, cancelBusy = false }) {
  if (!order) {
    return <div className="checkout-empty">Chọn bàn có order để xem hóa đơn.</div>;
  }
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="checkout-invoice">
      <div className="checkout-invoice-heading">
        <div>
          <p className="eyebrow">HÓA ĐƠN</p>
          <h2>{order.orderCode}</h2>
          <p>Bàn {order.tableNumber}</p>
          <p className="checkout-time-range">
            Vào bàn: {new Date(order.createdAt).toLocaleString("vi-VN")}
            {order.completedAt && <> · Kết thúc: {new Date(order.completedAt).toLocaleString("vi-VN")}</>}
          </p>
        </div>
        {(paymentStatus || onCancelPayment) && (
          <div className="checkout-invoice-status">
            {paymentStatus && <PaymentStatus status={paymentStatus} />}
            {onCancelPayment && (
              <button
                className="checkout-cancel-payment"
                type="button"
                onClick={onCancelPayment}
                disabled={cancelBusy}
              >
                {cancelBusy ? "Đang hủy…" : "Hủy hóa đơn"}
              </button>
            )}
          </div>
        )}
      </div>
      <div className="checkout-items">
        {items.map((item) => (
          <div className="checkout-item" key={item.id}>
            <span>{item.productName}<small>{item.quantity} × {money(item.unitPrice)}</small></span>
            <strong>{money(item.subtotal)}</strong>
          </div>
        ))}
      </div>
      <div className="checkout-totals">
        <div><span>Tạm tính</span><strong>{money(order.subtotal)}</strong></div>
        <div><span>Giảm giá</span><strong>- {money(order.discount)}</strong></div>
        <div><span>Thuế</span><strong>{money(order.tax)}</strong></div>
        <div className="checkout-grand-total"><span>Tổng thanh toán</span><strong>{money(order.totalAmount)}</strong></div>
      </div>
    </div>
  );
}
