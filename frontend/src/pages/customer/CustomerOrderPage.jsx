import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { formatMoney } from "../../data/posData";
import { FoodImage, StatusBadge } from "../../components/shared/Ui";
import { OrderStatusPanel } from "../../components/shared/OrderStatusPanel";
import { useTableOrderUpdates } from "../../hooks/useTableOrderUpdates";

export function CustomerOrderPage() {
  const { tableId = "5" } = useParams();
  const [menuItems, setMenuItems] = useState([]);
  const [error, setError] = useState("");
  const [cart, setCart] = useState([]);
  const orderUpdates = useTableOrderUpdates(tableId);
  useEffect(() => {
    axiosClient.get("/api/customer/menu")
      .then(({ data }) => setMenuItems(data.flatMap((group) => group.products.map((product) => ({
        ...product,
        category: group.name,
        time: product.preparationTime ? `${product.preparationTime} phút` : "",
        tone: "default",
      })))))
      .catch((requestError) => setError(requestError.response?.data?.message || "Không tải được thực đơn."));
  }, []);
  const add = (item) =>
    setCart((items) =>
      items.some((entry) => entry.name === item.name)
        ? items.map((entry) =>
            entry.name === item.name
              ? { ...entry, quantity: entry.quantity + 1 }
              : entry,
          )
        : [...items, { ...item, quantity: 1 }],
    );
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return (
    <main className="customer-page">
      <header className="customer-header">
        <div className="brand">
          <span className="brand-mark">♜</span>Smart POS
        </div>
        <span>Bàn {String(tableId).padStart(2, "0")} · Nhà hàng An Nhiên</span>
      </header>
      <div className="customer-content">
        <div className="customer-intro">
          <p>Xin chào 👋</p>
          <h1>Đặt món tại bàn</h1>
          <span>Chọn món yêu thích, bếp sẽ chuẩn bị ngay cho bạn.</span>
        </div>
        <OrderStatusPanel {...orderUpdates} />
        {error && <div role="alert">{error}</div>}
        <div className="customer-categories">
          <button className="selected">Tất cả</button>
          <button>Món chính</button>
          <button>Món phụ</button>
          <button>Đồ uống</button>
        </div>
        <div className="customer-menu">
          {menuItems.map((item) => (
            <article className="customer-item" key={item.name}>
              <FoodImage tone={item.tone} />
              <div>
                <h2>{item.name}</h2>
                <p>
                  {item.time} · {item.category}
                </p>
                <strong>{formatMoney(item.price)}</strong>
              </div>
              <button onClick={() => add(item)}>＋</button>
            </article>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="customer-cart">
            <div>
              <StatusBadge>{cart.length} món đã chọn</StatusBadge>
              <strong>{formatMoney(total)}</strong>
            </div>
            <button className="primary">Xem đơn & gọi món →</button>
          </div>
        )}
      </div>
    </main>
  );
}
