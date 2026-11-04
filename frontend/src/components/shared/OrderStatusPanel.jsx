import { StatusBadge } from "./Ui";

const statusLabels = {
  Pending: "Chờ bếp nhận",
  Accepted: "Đã nhận",
  Preparing: "Đang chế biến",
  Ready: "Sẵn sàng",
  Served: "Đã phục vụ",
};

function getStatusKind(status) {
  if (status === "Ready" || status === "Served") return "green";
  if (status === "Preparing") return "blue";
  if (status === "Accepted") return "orange";
  return "gray";
}

export function OrderStatusPanel({ orders, error, connectionStatus }) {
  const connectionLabel =
    connectionStatus === "connected"
      ? "Đang đồng bộ"
      : connectionStatus === "connecting"
        ? "Đang kết nối"
        : "Mất kết nối";

  return (
    <section className="live-order-panel" aria-live="polite">
      <div className="live-order-panel-head">
        <h2>Trạng thái món đang gọi</h2>
        <StatusBadge kind={connectionStatus === "connected" ? "green" : "orange"}>
          {connectionLabel}
        </StatusBadge>
      </div>
      {error && <p className="live-order-error">{error}</p>}
      {orders.length === 0 ? (
        <p className="live-order-empty">Hiện chưa có đơn đang xử lý tại bàn này.</p>
      ) : (
        <div className="live-order-list">
          {orders.map((order) => (
            <article className="live-order-card" key={order.id}>
              <div className="live-order-card-head">
                <strong>{order.orderCode}</strong>
                <span>Bàn {order.tableNumber}</span>
              </div>
              {order.items.map((item) => (
                <div className="live-order-item" key={item.id}>
                  <span>
                    {item.quantity} × {item.productName}
                  </span>
                  <StatusBadge kind={getStatusKind(item.status)}>
                    {statusLabels[item.status] ?? item.status}
                  </StatusBadge>
                </div>
              ))}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
