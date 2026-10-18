import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { menuItems } from "../../data/posData";
import { BackofficeLayout, PageTitle } from "../../components/shared/Ui";
import { MenuCard, OrderSummary } from "../../components/staff/OrderComponents";

export function StaffOrderPage() {
  const { tableId = "5" } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState("Tất cả");
  const [cart, setCart] = useState([]);
  const filtered =
    category === "Tất cả"
      ? menuItems
      : menuItems.filter((item) => item.category === category);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
  const remove = (name) =>
    setCart((items) =>
      items.flatMap((item) =>
        item.name === name && item.quantity > 1
          ? [{ ...item, quantity: item.quantity - 1 }]
          : item.name === name
            ? []
            : [item],
      ),
    );
  return (
    <BackofficeLayout title="Minh Anh · Nhân viên">
      <main className="page">
        <PageTitle
          eyebrow="Nhà hàng An Nhiên / Tạo đơn"
          title={`Bàn ${String(tableId).padStart(2, "0")} · Chi tiết & tạo đơn`}
          description="Sảnh chính · 3 khách · Thu Hà phụ trách · Mở bàn lúc 12:20"
          action={
            <div className="title-actions">
              <button className="secondary">Chuyển bàn</button>
              <button className="secondary">Gộp / tách bàn</button>
            </div>
          }
        />
        <div className="order-layout">
          <section>
            <div className="search">
              ⌕ <input placeholder="Tìm theo tên món hoặc mã món..." />
            </div>
            <div className="tabs menu-tabs">
              {["Tất cả", "Món chính", "Món phụ", "Đồ uống", "Tráng miệng"].map(
                (item) => (
                  <button
                    className={`tab ${category === item ? "selected" : ""}`}
                    onClick={() => setCategory(item)}
                    key={item}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
            <div className="menu-grid">
              {filtered.map((item) => (
                <MenuCard item={item} onAdd={() => add(item)} key={item.name} />
              ))}
            </div>
          </section>
          <OrderSummary
            cart={cart}
            total={total}
            onRemove={remove}
            onSave={() => navigate("/staff/tables")}
          />
        </div>
      </main>
    </BackofficeLayout>
  );
}
