import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

const emptyIngredient = { name: "", unit: "kg", initialStock: 0, minimumStock: 0 };

export default function InventoryManagement() {
  const [ingredients, setIngredients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [bom, setBom] = useState([]);
  const [bomForm, setBomForm] = useState({ productId: "", ingredientId: "", quantity: "" });
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

  const createIngredient = async (event) => {
    event.preventDefault();
    try {
      await axiosClient.post("/api/ingredients", {
        ...form,
        initialStock: Number(form.initialStock),
        minimumStock: Number(form.minimumStock),
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

  return (
    <main className="inventory-page">
      <header>
        <p className="eyebrow">ChefSync · Bếp</p>
        <h1>Kho nguyên vật liệu</h1>
        <p>Theo dõi tồn kho, cảnh báo và lịch sử biến động theo thời gian thực.</p>
      </header>
      {error && <p className="error-message" role="alert">{error}</p>}

      <section className="inventory-grid">
        <form className="panel" onSubmit={createIngredient}>
          <h2>Thêm nguyên liệu</h2>
          <label>Tên nguyên liệu<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Đơn vị<input required value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></label>
          <label>Tồn đầu kỳ<input type="number" min="0" step="0.001" value={form.initialStock} onChange={(e) => setForm({ ...form, initialStock: e.target.value })} /></label>
          <label>Ngưỡng cảnh báo<input type="number" min="0" step="0.001" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} /></label>
          <button type="submit">Lưu nguyên liệu</button>
        </form>

        <form className="panel" onSubmit={adjustStock}>
          <h2>Điều chỉnh kho</h2>
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

      <section className="panel">
        <h2>Tồn kho hiện tại</h2>
        <div className="table-wrap"><table><thead><tr><th>Nguyên liệu</th><th>Đơn vị</th><th>Tồn kho</th><th>Ngưỡng</th><th>Trạng thái</th></tr></thead>
          <tbody>{ingredients.map((ingredient) => <tr key={ingredient.id}><td>{ingredient.name}</td><td>{ingredient.unit}</td><td>{ingredient.currentStock}</td><td>{ingredient.minimumStock}</td><td><span className={ingredient.isLowStock ? "badge warning" : "badge"}>{ingredient.isLowStock ? "Sắp hết" : "Đủ hàng"}</span></td></tr>)}</tbody>
        </table></div>
      </section>

      <section className="panel">
        <h2>Định lượng món ăn (BOM)</h2>
        <div className="bom-toolbar">
          <label>Mã món ăn<input type="number" min="1" value={bomForm.productId} onChange={(e) => setBomForm({ ...bomForm, productId: e.target.value })} /></label>
          <button type="button" onClick={loadBom}>Xem định lượng</button>
        </div>
        <form className="bom-toolbar" onSubmit={addBomItem}>
          <label>Nguyên liệu<select required value={bomForm.ingredientId} onChange={(e) => setBomForm({ ...bomForm, ingredientId: e.target.value })}><option value="">Chọn nguyên liệu</option>{ingredients.map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name} ({ingredient.unit})</option>)}</select></label>
          <label>Số lượng / phần<input required type="number" min="0.000001" step="0.001" value={bomForm.quantity} onChange={(e) => setBomForm({ ...bomForm, quantity: e.target.value })} /></label>
          <button type="submit">Thêm vào BOM</button>
        </form>
        <div className="table-wrap"><table><thead><tr><th>Nguyên liệu</th><th>Đơn vị kho</th><th>Định lượng / phần</th></tr></thead><tbody>{bom.map((item) => <tr key={item.ingredientId}><td>{item.ingredientName}</td><td>{item.unit}</td><td>{item.quantity}</td></tr>)}</tbody></table></div>
      </section>

      <section className="panel">
        <h2>Lịch sử kho</h2>
        <div className="table-wrap"><table><thead><tr><th>Thời gian</th><th>Nguyên liệu</th><th>Loại</th><th>Số lượng</th><th>Tồn sau</th><th>Ghi chú</th></tr></thead>
          <tbody>{transactions.map((transaction) => <tr key={transaction.id}><td>{new Date(transaction.createdAt).toLocaleString("vi-VN")}</td><td>{transaction.ingredientName}</td><td>{transaction.type}</td><td>{transaction.quantity}</td><td>{transaction.afterStock}</td><td>{transaction.note ?? ""}</td></tr>)}</tbody>
        </table></div>
      </section>
    </main>
  );
}
