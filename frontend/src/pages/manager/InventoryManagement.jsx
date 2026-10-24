import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import "./InventoryManagement.css";

const emptyIngredient = { name: "", unit: "kg", initialStock: 0, minimumStock: 0 };

export default function InventoryManagement() {
  const [ingredients, setIngredients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [bom, setBom] = useState([]);
  const [bomForm, setBomForm] = useState({ productId: "", ingredientId: "", quantity: "" });
  const [orderId, setOrderId] = useState("1");
  const [form, setForm] = useState(emptyIngredient);
  const [adjustment, setAdjustment] = useState({ ingredientId: "", quantity: "", note: "" });
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [ingredientResponse, transactionResponse] = await Promise.all([
        axiosClient.get("/api/ingredients"),
        axiosClient.get("/api/inventory/transactions"),
      ]);
      setIngredients(ingredientResponse.data);
      setTransactions(transactionResponse.data);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Không thể tải dữ liệu kho.");
    }
  };

  useEffect(() => { load(); }, []);

  const lowStockCount = ingredients.filter((ingredient) => ingredient.isLowStock).length;
  const totalStockItems = ingredients.length;

  const createIngredient = async (event) => {
    event.preventDefault();
    try {
      await axiosClient.post("/api/ingredients", {
        ...form,
        initialStock: Number(form.initialStock),
        minimumStock: Number(form.minimumStock),
        costPerUnit: Number(form.costPerUnit),
      });
      setForm(emptyIngredient);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Không thể thêm nguyên liệu.");
    }
  };

  const adjustStock = async (event) => {
    event.preventDefault();
    try {
      await axiosClient.post(`/api/inventory/adjustments/${adjustment.ingredientId}`, {
        quantity: Number(adjustment.quantity),
        note: adjustment.note,
      });
      setAdjustment({ ingredientId: "", quantity: "", note: "" });
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Không thể điều chỉnh tồn kho.");
    }
  };

  const loadBom = async () => {
    if (!bomForm.productId) return;
    try {
      const response = await axiosClient.get(`/api/products/${bomForm.productId}/bom`);
      setBom(response.data);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Không thể tải định lượng món ăn.");
    }
  };

  const addBomItem = async (event) => {
    event.preventDefault();
    try {
      await axiosClient.post(`/api/products/${bomForm.productId}/bom/items`, {
        ingredientId: Number(bomForm.ingredientId),
        quantity: Number(bomForm.quantity),
      });
      setBomForm({ ...bomForm, ingredientId: "", quantity: "" });
      await loadBom();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Không thể lưu định lượng.");
    }
  };

  const acceptOrder = async (event) => {
    event.preventDefault();
    try {
      await axiosClient.patch(`/api/orders/${orderId}/status`, { status: "Accepted" });
      await load();
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Không thể chấp nhận đơn hàng.");
    }
  };

  return (
    <main className="inventory-page">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">ChefSync · Bếp</p>
          <h1>Kho nguyên vật liệu</h1>
          <p className="page-description">Theo dõi tồn kho, định lượng món và các biến động trong ngày.</p>
        </div>
        <button className="refresh-button" type="button" onClick={load}>↻ Làm mới</button>
      </header>
      {error && <p className="error-message" role="alert">{error}</p>}

      <section className="inventory-stats">
        <div className="inventory-stat"><span className="stat-icon green">▣</span><div><span>Tổng nguyên liệu</span><strong>{totalStockItems}</strong><small>Đang quản lý</small></div></div>
        <div className="inventory-stat"><span className="stat-icon blue">↗</span><div><span>Giao dịch gần đây</span><strong>{transactions.length}</strong><small>Lịch sử kho</small></div></div>
        <div className="inventory-stat"><span className="stat-icon orange">!</span><div><span>Cần bổ sung</span><strong>{lowStockCount}</strong><small>Nguyên liệu sắp hết</small></div></div>
      </section>

      <section className="inventory-grid">
        <form className="panel" onSubmit={createIngredient}>
          <div className="panel-header"><div><span className="panel-kicker">DANH MỤC KHO</span><h2>Thêm nguyên liệu</h2></div><span className="panel-symbol">＋</span></div>
          <label>Tên nguyên liệu<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Đơn vị<input required value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></label>
          <label>Tồn đầu kỳ<input type="number"  value={form.initialStock} onChange={(e) => setForm({ ...form, initialStock: e.target.value })} /></label>
          <label>Ngưỡng cảnh báo<input type="number"  value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} /></label>
          <label>Giá<input type="number"  value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} /></label>
          <button type="submit">Lưu nguyên liệu</button>
        </form>

        <form className="panel" onSubmit={adjustStock}>
          <div className="panel-header"><div><span className="panel-kicker">NHẬP / XUẤT</span><h2>Điều chỉnh kho</h2></div><span className="panel-symbol">↕</span></div>
          <label>Nguyên liệu
            <select required value={adjustment.ingredientId} onChange={(e) => setAdjustment({ ...adjustment, ingredientId: e.target.value })}>
              <option value="">Chọn nguyên liệu</option>
              {ingredients.map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>)}
            </select>
          </label>
          <label>Số lượng (+ nhập / - hao hụt)<input required type="number" step="0.001" value={adjustment.quantity} onChange={(e) => setAdjustment({ ...adjustment, quantity: e.target.value })} /></label>
          <label>Ghi chú<input value={adjustment.note} onChange={(e) => setAdjustment({ ...adjustment, note: e.target.value })} /></label>
          <button type="submit">Ghi nhận biến động</button>
        </form>
      </section>

      <section className="panel inventory-section">
        <div className="section-heading"><div><span className="panel-kicker">TỔNG QUAN</span><h2>Tồn kho hiện tại</h2></div><span className="section-count">{ingredients.length} nguyên liệu</span></div>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Nguyên liệu</th><th>Đơn vị</th><th>Tồn kho</th><th>Ngưỡng</th><th>Trạng thái</th></tr></thead>
          <tbody>{ingredients.length === 0 ? <tr><td className="empty-state" colSpan="5">Chưa có nguyên liệu. Hãy thêm nguyên liệu mới.</td></tr> : ingredients.map((ingredient) => <tr key={ingredient.id}><td className="name-cell">{ingredient.name}</td><td>{ingredient.unit}</td><td className="number-cell">{ingredient.currentStock}</td><td className="number-cell">{ingredient.minimumStock}</td><td><span className={ingredient.isLowStock ? "badge warning" : "badge"}>{ingredient.isLowStock ? "Sắp hết" : "Đủ hàng"}</span></td></tr>)}</tbody>
        </table></div>
      </section>

      <section className="panel inventory-section">
        <div className="section-heading"><div><span className="panel-kicker">CÔNG THỨC MÓN</span><h2>Định lượng món ăn (BOM)</h2></div><span className="section-count">Theo từng phần</span></div>
        <div className="bom-toolbar">
          <label>Mã món ăn<input type="number" min="1" value={bomForm.productId} onChange={(e) => setBomForm({ ...bomForm, productId: e.target.value })} /></label>
          <button type="button" onClick={loadBom}>Xem định lượng</button>
        </div>
        <form className="bom-toolbar" onSubmit={addBomItem}>
          <label>Nguyên liệu<select required value={bomForm.ingredientId} onChange={(e) => setBomForm({ ...bomForm, ingredientId: e.target.value })}><option value="">Chọn nguyên liệu</option>{ingredients.map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name} ({ingredient.unit})</option>)}</select></label>
          <label>Số lượng / phần<input required type="number"  value={bomForm.quantity} onChange={(e) => setBomForm({ ...bomForm, quantity: e.target.value })} /></label>
          <button type="submit">Thêm vào BOM</button>
        </form>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Nguyên liệu</th><th>Đơn vị kho</th><th>Định lượng / phần</th></tr></thead><tbody>{bom.length === 0 ? <tr><td className="empty-state" colSpan="3">Chưa có định lượng cho món này.</td></tr> : bom.map((item) => <tr key={item.ingredientId}><td className="name-cell">{item.ingredientName}</td><td><span className="unit-pill">{item.unit}</span></td><td className="number-cell">{item.quantity}</td></tr>)}</tbody></table></div>
      </section>

      <section className="panel accept-panel">
        <div className="section-heading"><div><span className="panel-kicker">KIỂM TRA NGHIỆP VỤ</span><h2>Chấp nhận đơn và trừ kho</h2></div><span className="test-badge">TRANSACTION</span></div>
        <p>Chuyển đơn Pending sang Accepted. Hệ thống sẽ kiểm tra BOM, kiểm tra đủ kho và ghi lịch sử xuất kho trong cùng một transaction.</p>
        <form className="bom-toolbar" onSubmit={acceptOrder}>
          <label>Mã đơn hàng
            <input type="number" min="1" required value={orderId} onChange={(event) => setOrderId(event.target.value)} />
          </label>
          <button type="submit">Accepted và trừ kho</button>
        </form>
        <p className="test-hint">Dữ liệu mẫu: đơn 9001 gồm 3 phần Phở bò, dự kiến trừ 0.300 kg thịt bò.</p>
      </section>

      <section className="panel inventory-section">
        <div className="section-heading"><div><span className="panel-kicker">THEO DÕI</span><h2>Lịch sử kho</h2></div><span className="section-count">{transactions.length} giao dịch</span></div>
        <div className="table-wrap"><table className="data-table transaction-table"><thead><tr><th>Thời gian</th><th>Nguyên liệu</th><th>Loại</th><th>Số lượng</th><th>Tồn sau</th><th>Ghi chú</th></tr></thead>
          <tbody>{transactions.length === 0 ? <tr><td className="empty-state" colSpan="6">Chưa có giao dịch kho.</td></tr> : transactions.map((transaction) => <tr key={transaction.id}><td className="date-cell">{new Date(transaction.createdAt).toLocaleString("vi-VN")}</td><td className="name-cell">{transaction.ingredientName}</td><td><span className={`transaction-pill ${transaction.type.toLowerCase()}`}>{transaction.type}</span></td><td className={`number-cell ${transaction.quantity < 0 ? "negative-number" : "positive-number"}`}>{transaction.quantity > 0 ? `+${transaction.quantity}` : transaction.quantity}</td><td className="number-cell">{transaction.afterStock}</td><td className="note-cell">{transaction.note ?? "—"}</td></tr>)}</tbody>
        </table></div>
      </section>
    </main>
  );
}
