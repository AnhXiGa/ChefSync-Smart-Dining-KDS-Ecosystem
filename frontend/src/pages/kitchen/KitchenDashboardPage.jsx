import { useState } from "react";
import { kitchenColumns, kitchenOrders } from "../../data/posData";
import {
  BackofficeLayout,
  PageTitle,
  StatusBadge,
} from "../../components/shared/Ui";

export function KitchenDashboardPage() {
  const [orders, setOrders] = useState(kitchenOrders);
  const advance = (id) =>
    setOrders((items) =>
      items.map((order) =>
        order.id === id
          ? { ...order, status: order.status === "new" ? "cooking" : "ready" }
          : order,
      ),
    );
  return (
    <BackofficeLayout role="kitchen" title="Điều phối bếp">
      <main className="page kitchen-page">
        <PageTitle
          title="Điều phối bếp"
          description="Ca trưa · Khu bếp chính · Đồng bộ thời gian thực"
          action={<button className="primary">↻ Cập nhật</button>}
        />
        <div className="kitchen-toolbar">
          <StatusBadge kind="orange">07 đơn đang xử lý</StatusBadge>
          <span>Thời gian trung bình: 14 phút</span>
          <button className="secondary">Lọc khu vực</button>
        </div>
        <div className="kitchen-board">
          {kitchenColumns.map(([status, title, kind]) => (
            <section className="kitchen-column" key={status}>
              <div className="column-title">
                <h2>{title}</h2>
                <StatusBadge kind={kind}>
                  {orders.filter((order) => order.status === status).length}
                </StatusBadge>
              </div>
              {orders
                .filter((order) => order.status === status)
                .map((order) => (
                  <article className="kitchen-ticket" key={order.id}>
                    <div className="ticket-head">
                      <strong>{order.table}</strong>
                      <span>{order.time}</span>
                    </div>
                    <small>{order.id}</small>
                    {order.items.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                    <button
                      className="primary full"
                      onClick={() => advance(order.id)}
                    >
                      {status === "new"
                        ? "Nhận đơn"
                        : status === "cooking"
                          ? "Báo món sẵn sàng"
                          : "Hoàn tất"}
                    </button>
                  </article>
                ))}
            </section>
          ))}
        </div>
      </main>
    </BackofficeLayout>
  );
}
