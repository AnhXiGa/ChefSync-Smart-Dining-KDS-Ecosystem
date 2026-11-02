import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BackofficeLayout,
  PageTitle,
  StatusBadge,
} from "../../components/shared/Ui";
import { adminModules } from "../../data/adminData";
import axiosClient from "../../api/axiosClient";

const inventoryModules = new Set(["inventory", "bom", "stock-in", "stock-out"]);

function getError(error, fallback) {
  return error.response?.data?.message ?? fallback;
}

function InventoryModule({ module, config }) {
  const [ingredients, setIngredients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [bom, setBom] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    unit: "kg",
    initialStock: "",
    minimumStock: "",
    costPerUnit: "",
    ingredientId: "",
    quantity: "",
    note: "",
  });

  const load = useCallback(async () => {
    try {
      const [ingredientResponse, transactionResponse, menuResponse] =
        await Promise.all([
          axiosClient.get("/api/ingredients"),
          axiosClient.get("/api/inventory/transactions"),
          axiosClient.get("/api/menu"),
        ]);
      const menuProducts = menuResponse.data.flatMap(
        (category) => category.products ?? [],
      );
      setIngredients(ingredientResponse.data);
      setTransactions(transactionResponse.data);
      setProducts(menuProducts);
      setError("");
      if (selectedProduct) {
        const bomResponses = await Promise.all(
          menuProducts.map((product) =>
            axiosClient.get(`/api/products/${product.id}/bom`),
          ),
        );
        setBom(
          bomResponses
            .flatMap((response) => response.data)
            .filter((item) => String(item.productId) === String(selectedProduct)),
        );
      }
    } catch (requestError) {
      setError(getError(requestError, "Không thể tải dữ liệu kho."));
    }
  }, [selectedProduct]);

  useEffect(() => {
    // Initial API synchronization belongs to this effect.
    // oxlint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

  const filteredIngredients = useMemo(
    () =>
      ingredients.filter((ingredient) =>
        ingredient.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [ingredients, query],
  );

  const submitIngredient = async (event) => {
    event.preventDefault();
    try {
      await axiosClient.post("/api/ingredients", {
        name: form.name,
        unit: form.unit,
        initialStock: Number(form.initialStock),
        minimumStock: Number(form.minimumStock),
        costPerUnit: Number(form.costPerUnit),
      });
      setForm({ ...form, name: "", initialStock: "", minimumStock: "", costPerUnit: "" });
      await load();
    } catch (requestError) {
      setError(getError(requestError, "Không thể thêm nguyên liệu."));
    }
  };

  const submitAdjustment = async (event) => {
    event.preventDefault();
    const isReceipt = module === "stock-in";
    const quantity = Number(form.quantity);
    if (isReceipt && quantity <= 0) {
      setError("Số lượng nhập phải lớn hơn 0.");
      return;
    }
    try {
      const endpoint = isReceipt
        ? `/api/inventory/receipts/${form.ingredientId}`
        : `/api/inventory/adjustments/${form.ingredientId}`;
      await axiosClient.post(endpoint, {
        quantity: isReceipt ? quantity : -Math.abs(quantity),
        note: form.note,
      });
      setForm({ ...form, ingredientId: "", quantity: "", note: "" });
      await load();
    } catch (requestError) {
      setError(getError(requestError, "Không thể ghi nhận biến động kho."));
    }
  };

  const loadBom = async (productId) => {
    setSelectedProduct(productId);
    if (!productId) {
      setBom([]);
      return;
    }
    try {
      const response = await axiosClient.get(`/api/products/${productId}/bom`);
      setBom(response.data);
    } catch (requestError) {
      setError(getError(requestError, "Không thể tải định lượng món ăn."));
    }
  };

  const submitBom = async (event) => {
    event.preventDefault();
    try {
      await axiosClient.post(`/api/products/${selectedProduct}/bom/items`, {
        ingredientId: Number(form.ingredientId),
        quantity: Number(form.quantity),
      });
      setForm({ ...form, ingredientId: "", quantity: "" });
      await loadBom(selectedProduct);
    } catch (requestError) {
      setError(getError(requestError, "Không thể lưu định lượng."));
    }
  };

  if (module === "bom") {
    return (
      <>
        <PageTitle title={config.title} description={config.description} />
        <div className="module-toolbar">
          <select
            value={selectedProduct}
            onChange={(event) => loadBom(event.target.value)}
            aria-label="Chọn món ăn"
          >
            <option value="">Chọn món ăn</option>
            {products.map((product) => (
              <option value={product.id} key={product.id}>{product.name}</option>
            ))}
          </select>
        </div>
        {error && <p className="login-error" role="alert">{error}</p>}
        <section className="data-card">
          <div className="data-card-head">
            <div><strong>{bom.length} nguyên liệu</strong><p>Định lượng cho một phần món ăn</p></div>
            <StatusBadge>{selectedProduct ? "Đang đồng bộ" : "Chưa chọn món"}</StatusBadge>
          </div>
          <form className="module-toolbar inventory-inline-form" onSubmit={submitBom}>
            <select required value={form.ingredientId} onChange={(event) => setForm({ ...form, ingredientId: event.target.value })}>
              <option value="">Chọn nguyên liệu</option>
              {ingredients.map((ingredient) => <option value={ingredient.id} key={ingredient.id}>{ingredient.name} ({ingredient.unit})</option>)}
            </select>
            <input required type="number" min="0.000001" step="0.001" placeholder="Số lượng / phần" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} />
            <button className="primary" type="submit" disabled={!selectedProduct}>Thêm nguyên liệu</button>
          </form>
          <div className="data-table">
            <div className="data-row data-header"><span>Nguyên liệu</span><span>Đơn vị</span><span>Định lượng / phần</span><span /></div>
            {bom.map((item) => <div className="data-row" key={item.ingredientId}><span>{item.ingredientName}</span><span>{item.unit}</span><span>{item.quantity}</span><span /></div>)}
          </div>
        </section>
      </>
    );
  }

  if (module === "stock-in" || module === "stock-out") {
    const rows = transactions.filter((item) =>
      module === "stock-in" ? item.type === "Receipt" : item.type !== "Receipt",
    );
    return (
      <>
        <PageTitle title={config.title} description={config.description} />
        {error && <p className="login-error" role="alert">{error}</p>}
        <section className="data-card">
          <div className="data-card-head"><div><strong>{rows.length} bản ghi</strong><p>Lịch sử biến động từ database</p></div><StatusBadge>Đang đồng bộ</StatusBadge></div>
          <form className="module-toolbar inventory-inline-form" onSubmit={submitAdjustment}>
            <select required value={form.ingredientId} onChange={(event) => setForm({ ...form, ingredientId: event.target.value })}>
              <option value="">Chọn nguyên liệu</option>
              {ingredients.map((ingredient) => <option value={ingredient.id} key={ingredient.id}>{ingredient.name}</option>)}
            </select>
            <input required type="number" min="0.001" step="0.001" placeholder="Số lượng" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} />
            <input placeholder="Ghi chú" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
            <button className="primary" type="submit">Ghi nhận</button>
          </form>
          <div className="data-table">
            <div className="data-row data-header"><span>Nguyên liệu</span><span>Loại biến động</span><span>Số lượng</span><span>Tồn sau</span><span>Thời gian</span><span /></div>
            {rows.map((item) => <div className="data-row" key={item.id}><span>{item.ingredientName}</span><span>{item.type}</span><span>{item.quantity > 0 ? `+${item.quantity}` : item.quantity}</span><span>{item.afterStock}</span><span>{new Date(item.createdAt).toLocaleString("vi-VN")}</span><span /></div>)}
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageTitle title={config.title} description={config.description} />
      {error && <p className="login-error" role="alert">{error}</p>}
      <div className="module-toolbar">
        <div className="search">⌕ <input placeholder="Tìm kiếm..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <button className="secondary" type="button" onClick={load}>Làm mới</button>
      </div>
      <section className="data-card">
        <div className="data-card-head"><div><strong>{filteredIngredients.length} bản ghi</strong><p>Dữ liệu tồn kho hiện tại</p></div><StatusBadge>Đang đồng bộ</StatusBadge></div>
        <div className="data-table">
          <div className="data-row data-header"><span>Nguyên vật liệu</span><span>Đơn vị</span><span>Tồn hiện tại</span><span>Tồn tối thiểu</span><span>Trạng thái</span><span /></div>
          {filteredIngredients.map((item) => <div className="data-row" key={item.id}><span>{item.name}</span><span>{item.unit}</span><span>{item.currentStock}</span><span>{item.minimumStock}</span><span><StatusBadge kind={item.isLowStock ? "orange" : "green"}>{item.isLowStock ? "Sắp hết" : "Đủ hàng"}</StatusBadge></span><span /></div>)}
        </div>
      </section>
      <section className="data-card inventory-create-card">
        <div className="data-card-head"><div><strong>Thêm nguyên vật liệu</strong><p>Lưu trực tiếp vào kho</p></div></div>
        <form className="module-toolbar inventory-inline-form" onSubmit={submitIngredient}>
          <input required placeholder="Tên nguyên liệu" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input required placeholder="Đơn vị" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
          <input required type="number" min="0" step="0.001" placeholder="Tồn đầu kỳ" value={form.initialStock} onChange={(event) => setForm({ ...form, initialStock: event.target.value })} />
          <input required type="number" min="0" step="0.001" placeholder="Tồn tối thiểu" value={form.minimumStock} onChange={(event) => setForm({ ...form, minimumStock: event.target.value })} />
          <button className="primary" type="submit">Lưu</button>
        </form>
      </section>
    </>
  );
}

export function AdminModulePage({ module }) {
  const config = adminModules[module] || adminModules.menu;
  const [query, setQuery] = useState("");
  const rows = config.rows.filter((row) =>
    row.join(" ").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <BackofficeLayout role="manager" title="Minh Anh · Quản lý">
      <main className="page admin-module-page">
        {inventoryModules.has(module) ? <InventoryModule module={module} config={config} /> : (
          <>
            <PageTitle title={config.title} description={config.description} action={<button className="primary">{config.action}</button>} />
            <div className="module-toolbar"><div className="search">⌕ <input placeholder="Tìm kiếm..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><button className="secondary">Bộ lọc</button><button className="secondary">Xuất báo cáo</button></div>
            <section className="data-card"><div className="data-card-head"><div><strong>{rows.length} bản ghi</strong><p>Dữ liệu cập nhật theo ca trưa hôm nay</p></div><StatusBadge>{module === "expenses" ? "Theo dõi ngân sách" : "Đang đồng bộ"}</StatusBadge></div><div className="data-table"><div className="data-row data-header">{config.columns.map((column) => <span key={column}>{column}</span>)}</div>{rows.map((row, index) => <div className="data-row" key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <span key={`${cell}-${cellIndex}`}>{cellIndex === row.length - 1 ? <StatusBadge kind={String(cell).includes("Sắp") || String(cell).includes("Chờ") ? "orange" : "green"}>{cell}</StatusBadge> : cell}</span>)}<button className="row-action">⋮</button></div>)}</div></section>
          </>
        )}
      </main>
    </BackofficeLayout>
  );
}
