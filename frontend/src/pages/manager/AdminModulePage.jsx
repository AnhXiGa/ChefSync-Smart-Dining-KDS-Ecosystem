import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BackofficeLayout,
  PageTitle,
  StatusBadge,
} from "../../components/shared/Ui";
import { adminModules } from "../../data/adminData";
import axiosClient from "../../api/axiosClient";
import "./InventoryMovements.css";
import FinancialReportModule from "./FinancialReportModule";

const inventoryModules = new Set(["inventory", "bom"]);
function getError(error, fallback) {
  return error.response?.data?.message ?? fallback;
}

const movementOptions = [
  { value: "Receipt", label: "Nhập hàng", direction: 1 },
  { value: "Waste", label: "Hao hụt", direction: -1 },
  { value: "AdjustmentIncrease", label: "Điều chỉnh tăng", direction: 1 },
  { value: "AdjustmentDecrease", label: "Điều chỉnh giảm", direction: -1 },
  { value: "Return", label: "Hoàn trả", direction: 1 },
];

const movementLabels = Object.fromEntries(
  movementOptions.map(({ value, label }) => [value, label]),
);

function getMovementType(transaction) {
  if (transaction.type === "Receipt") return "Receipt";
  if (transaction.type === "Issue") return "Issue";

  const note = transaction.note ?? "";
  const option = movementOptions.find(
    ({ value, label }) =>
      value !== "Receipt" && note.startsWith(`${label}:`),
  );
  return option?.value ?? "Adjustment";
}

function getMovementLabel(type) {
  if (type === "Issue") return "Tiêu hao bán hàng";
  return movementLabels[type] ?? "Điều chỉnh";
}

function getMovementNote(transaction) {
  const type = getMovementType(transaction);
  const label = movementLabels[type];
  if (!label || type === "Receipt") return transaction.note || "—";
  return (transaction.note ?? "").replace(`${label}:`, "").trim() || "—";
}

function InventoryMovementsModule({ config }) {
  const [ingredients, setIngredients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState({
    type: "Waste",
    ingredientId: "",
    quantity: "",
    note: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ingredientResponse, transactionResponse] = await Promise.all([
        axiosClient.get("/api/ingredients"),
        axiosClient.get("/api/inventory/transactions"),
      ]);
      setIngredients(ingredientResponse.data);
      setTransactions(transactionResponse.data);
      setError("");
    } catch (requestError) {
      setError(getError(requestError, "Không thể tải dữ liệu biến động kho."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load the current inventory journal when this page opens.
    // oxlint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

  const selectedIngredient = ingredients.find(
    (ingredient) => String(ingredient.id) === form.ingredientId,
  );
  const selectedMovement = movementOptions.find(
    ({ value }) => value === form.type,
  );
  const quantity = Number(form.quantity);
  const signedQuantity = quantity * (selectedMovement?.direction ?? 1);
  const projectedStock = selectedIngredient
    ? selectedIngredient.currentStock + signedQuantity
    : null;

  const filteredTransactions = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("vi");
    return transactions.filter((transaction) => {
      const type = getMovementType(transaction);
      const matchesType = filterType === "all" || type === filterType;
      const matchesQuery =
        !term ||
        `${transaction.ingredientName} ${transaction.referenceType ?? ""} ${
          transaction.referenceId ?? ""
        } ${transaction.note ?? ""}`
          .toLocaleLowerCase("vi")
          .includes(term);
      return matchesType && matchesQuery;
    });
  }, [filterType, query, transactions]);

  const submitMovement = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!selectedIngredient || !Number.isFinite(quantity) || quantity <= 0) {
      setError("Vui lòng chọn nguyên liệu và nhập số lượng lớn hơn 0.");
      return;
    }
    if (!form.note.trim()) {
      setError("Vui lòng nhập lý do cho biến động kho.");
      return;
    }
    if (projectedStock < 0) {
      setError("Tồn kho sau biến động không thể nhỏ hơn 0.");
      return;
    }

    const movementLabel = getMovementLabel(form.type);
    const isReceipt = form.type === "Receipt";
    const note = isReceipt
      ? form.note.trim()
      : `${movementLabel}: ${form.note.trim()}`.trim();

    setSubmitting(true);
    try {
      await axiosClient.post(
        `/api/inventory/${isReceipt ? "receipts" : "adjustments"}/${form.ingredientId}`,
        { quantity: signedQuantity, note },
      );
      setForm((current) => ({ ...current, quantity: "", note: "" }));
      setNotice("Đã ghi nhận biến động kho.");
      await load();
    } catch (requestError) {
      setError(getError(requestError, "Không thể ghi nhận biến động kho."));
    } finally {
      setSubmitting(false);
    }
  };

  const exportLog = () => {
    const columns = [
      ["Thời gian", (item) => new Date(item.createdAt).toLocaleString("vi-VN")],
      ["Nguyên liệu", (item) => item.ingredientName],
      ["Loại", (item) => getMovementLabel(getMovementType(item))],
      ["Số lượng", (item) => `${item.quantity > 0 ? "+" : ""}${item.quantity} ${item.unit}`],
      ["Trước → Sau", (item) => `${item.beforeStock} → ${item.afterStock} ${item.unit}`],
      ["Tham chiếu", (item) => `${item.referenceType ?? ""} ${item.referenceId ?? ""}`.trim()],
      ["Ghi chú", (item) => getMovementNote(item)],
    ];
    const escapeCsv = (value) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = filteredTransactions.map((transaction) =>
      columns.map(([, getValue]) => escapeCsv(getValue(transaction))).join(","),
    );
    const csv = [
      columns.map(([label]) => escapeCsv(label)).join(","),
      ...rows,
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "nhat-ky-bien-dong-kho.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageTitle
        title={config.title}
        description={config.description}
        action={
          <div className="inventory-movement-actions">
            <button className="secondary" type="button" onClick={() => void load()}>
              ↻ Làm mới
            </button>
            <button className="secondary" type="button" onClick={exportLog}>
              Xuất nhật ký
            </button>
          </div>
        }
      />
      {error && <p className="login-error" role="alert">{error}</p>}

      <section className="inventory-movement-toolbar">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm nguyên liệu hoặc tham chiếu..."
          aria-label="Tìm nguyên liệu hoặc tham chiếu"
        />
        <select
          value={filterType}
          onChange={(event) => setFilterType(event.target.value)}
          aria-label="Lọc loại biến động"
        >
          <option value="all">Tất cả loại biến động</option>
          <option value="Receipt">Nhập hàng</option>
          <option value="Issue">Tiêu hao bán hàng</option>
          <option value="Waste">Hao hụt</option>
          <option value="Adjustment">Điều chỉnh</option>
          <option value="AdjustmentIncrease">Điều chỉnh tăng</option>
          <option value="AdjustmentDecrease">Điều chỉnh giảm</option>
          <option value="Return">Hoàn trả</option>
        </select>
      </section>

      <section className="inventory-movement-layout">
        <div className="data-card inventory-movement-history">
          <div className="data-card-head">
            <div>
              <strong>{filteredTransactions.length} bản ghi</strong>
              <p>Nhật ký nhập, tiêu hao và điều chỉnh tồn kho</p>
            </div>
            <StatusBadge>{loading ? "Đang tải" : "Đang đồng bộ"}</StatusBadge>
          </div>
          <div className="inventory-movement-table-wrap">
            <table className="inventory-movement-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Nguyên liệu</th>
                  <th>Loại</th>
                  <th>Số lượng</th>
                  <th>Trước → Sau</th>
                  <th>Tham chiếu / ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {!loading && filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="inventory-movement-empty">
                      Không tìm thấy bản ghi phù hợp.
                    </td>
                  </tr>
                )}
                {filteredTransactions.map((transaction) => {
                  const type = getMovementType(transaction);
                  const reference = transaction.referenceId
                    ? `${transaction.referenceType ?? "Tham chiếu"} #${transaction.referenceId}`
                    : transaction.referenceType === "Manual"
                      ? "Thủ công"
                      : transaction.referenceType ?? "—";
                  return (
                    <tr key={transaction.id}>
                      <td>{new Date(transaction.createdAt).toLocaleString("vi-VN")}</td>
                      <td className="inventory-movement-name">{transaction.ingredientName}</td>
                      <td><span className={`movement-type movement-type-${type.toLowerCase()}`}>{getMovementLabel(type)}</span></td>
                      <td className={transaction.quantity < 0 ? "movement-negative" : "movement-positive"}>
                        {transaction.quantity > 0 ? "+" : ""}{transaction.quantity} {transaction.unit}
                      </td>
                      <td>{transaction.beforeStock} → {transaction.afterStock} {transaction.unit}</td>
                      <td>
                        <span className="inventory-movement-reference">{reference}</span>
                        {getMovementNote(transaction) !== "—" && (
                          <small className="inventory-movement-note">{getMovementNote(transaction)}</small>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="data-card inventory-movement-form-card">
          <div className="data-card-head">
            <div>
              <strong>Ghi nhận biến động</strong>
              <p>Thao tác sẽ cập nhật tồn kho ngay</p>
            </div>
          </div>
          <form onSubmit={submitMovement}>
            <label>
              Loại biến động
              <select
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
              >
                {movementOptions.map(({ value, label }) => (
                  <option value={value} key={value}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              Nguyên liệu
              <select
                required
                value={form.ingredientId}
                onChange={(event) => setForm({ ...form, ingredientId: event.target.value })}
              >
                <option value="">Chọn nguyên liệu</option>
                {ingredients.map((ingredient) => (
                  <option value={ingredient.id} key={ingredient.id}>
                    {ingredient.name} · {ingredient.unit}
                  </option>
                ))}
              </select>
            </label>
            <div className="inventory-movement-stock">
              <span>Tồn hiện tại</span>
              <strong>
                {selectedIngredient
                  ? `${selectedIngredient.currentStock} ${selectedIngredient.unit}`
                  : "—"}
              </strong>
            </div>
            <label>
              Số lượng {selectedMovement?.direction === -1 ? "xuất" : "nhập"}
              <div className="inventory-movement-quantity">
                <input
                  required
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={form.quantity}
                  onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                />
                <span>{selectedIngredient?.unit ?? "đơn vị"}</span>
              </div>
            </label>
            <div className="inventory-movement-stock">
              <span>Tồn sau biến động</span>
              <strong>
                {projectedStock === null
                  ? "—"
                  : `${projectedStock} ${selectedIngredient.unit}`}
              </strong>
            </div>
            <label>
              Lý do bắt buộc
              <textarea
                required
                maxLength="500"
                value={form.note}
                onChange={(event) => setForm({ ...form, note: event.target.value })}
                placeholder="Nhập lý do biến động"
              />
            </label>
            {notice && <p className="inventory-movement-notice" role="status">{notice}</p>}
            <button className="primary" type="submit" disabled={submitting || ingredients.length === 0}>
              {submitting ? "Đang ghi nhận..." : "Xác nhận biến động"}
            </button>
          </form>
        </aside>
      </section>
    </>
  );
}

export function LegacyMenuManagementModule({ config }) {
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (query.trim()) params.search = query.trim();
      if (categoryId !== "ALL") params.categoryId = categoryId;
      const response = await axiosClient.get("/api/menu", { params });
      setCategories(response.data);
      setError("");
    } catch (requestError) {
      setError(getError(requestError, "Không thể tải danh sách món ăn."));
    } finally {
      setLoading(false);
    }
  }, [categoryId, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadMenu(), 250);
    return () => window.clearTimeout(timer);
  }, [loadMenu]);

  const products = categories.flatMap((category) =>
    (category.products ?? []).map((product) => ({
      ...product,
      categoryName: category.name,
    })),
  );
  const categoryOptions = categories.filter((category) =>
    (category.products ?? []).length > 0 || category.id === Number(categoryId),
  );

  return (
    <>
      <PageTitle title={config.title} description={config.description} action={<button className="primary" type="button" disabled>＋ Thêm món ăn</button>} />
      <div className="module-toolbar menu-toolbar">
        <div className="search">⌕ <input placeholder="Tìm tên món ăn..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} aria-label="Lọc theo danh mục">
          <option value="ALL">Tất cả danh mục</option>
          {categoryOptions.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
        </select>
        <button className="secondary" type="button" onClick={() => void loadMenu()}>Làm mới</button>
      </div>
      {error && <p className="login-error" role="alert">{error}</p>}
      <section className="data-card">
        <div className="data-card-head">
          <div><strong>{loading ? "Đang tải..." : `${products.length} món ăn`}</strong><p>Dữ liệu món ăn và danh mục từ database</p></div>
          <StatusBadge>{loading ? "Đang tải" : "Đang đồng bộ"}</StatusBadge>
        </div>
        <div className="data-table menu-data-table">
          <div className="data-row data-header"><span>Món ăn</span><span>Danh mục</span><span>Giá bán</span><span>Thời gian</span><span>Trạng thái</span><span /></div>
          {!loading && products.length === 0 && <div className="menu-empty">Không tìm thấy món ăn phù hợp.</div>}
          {products.map((product) => (
            <div className="data-row" key={product.id}>
              <span className="menu-product-cell">
                {product.imageUrl
                  ? <img src={product.imageUrl} alt="" className="menu-product-image" />
                  : <span className="menu-product-placeholder" aria-hidden="true">🍽</span>}
                <span><strong>{product.name}</strong>{product.description && <small>{product.description}</small>}</span>
              </span>
              <span>{product.categoryName}</span>
              <span>{new Intl.NumberFormat("vi-VN").format(product.price)} ₫</span>
              <span>{product.preparationTime ? `${product.preparationTime} phút` : "—"}</span>
              <span><StatusBadge kind="green">Đang bán</StatusBadge></span>
              <span />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function MenuManagementModule({ config }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [updatingProductId, setUpdatingProductId] = useState(null);
  const [form, setForm] = useState({ categoryId: "", name: "", description: "", price: "", imageUrl: "", preparationTime: "", isAvailable: true });

  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (query.trim()) params.search = query.trim();
      if (categoryId !== "ALL") params.categoryId = categoryId;
      const [productsResponse, categoriesResponse] = await Promise.all([
        axiosClient.get("/api/products", { params }),
        axiosClient.get("/api/categories"),
      ]);
      setProducts(productsResponse.data);
      setCategories(categoriesResponse.data);
      setError("");
    } catch (requestError) {
      setError(getError(requestError, "Không thể tải danh sách món ăn."));
    } finally {
      setLoading(false);
    }
  }, [categoryId, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadMenu(), 250);
    return () => window.clearTimeout(timer);
  }, [loadMenu]);

  const startCreate = () => {
    setEditing("new");
    setForm({ categoryId: categories[0]?.id ? String(categories[0].id) : "", name: "", description: "", price: "", imageUrl: "", preparationTime: "", isAvailable: true });
    setError("");
  };

  const startEdit = (product) => {
    setEditing(product.id);
    setForm({ categoryId: String(product.categoryId), name: product.name, description: product.description || "", price: String(product.price), imageUrl: product.imageUrl || "", preparationTime: product.preparationTime ? String(product.preparationTime) : "", isAvailable: product.isAvailable });
    setError("");
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = { ...form, categoryId: Number(form.categoryId), price: Number(form.price), preparationTime: form.preparationTime ? Number(form.preparationTime) : null };
    try {
      if (editing === "new") await axiosClient.post("/api/products", payload);
      else await axiosClient.put(`/api/products/${editing}`, payload);
      setEditing(null);
      await loadMenu();
    } catch (requestError) {
      setError(getError(requestError, "Không thể lưu món ăn."));
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (product) => {
    setUpdatingProductId(product.id);
    setError("");
    try {
      await axiosClient.patch(`/api/products/${product.id}/availability`, { isAvailable: !product.isAvailable });
      await loadMenu();
    } catch (requestError) {
      setError(getError(requestError, "Không thể thay đổi trạng thái món ăn."));
    } finally {
      setUpdatingProductId(null);
    }
  };

  return (
    <>
      <PageTitle title={config.title} description={config.description} action={<button className="primary" type="button" onClick={startCreate} disabled={categories.length === 0}>+ Thêm món ăn</button>} />
      <div className="module-toolbar menu-toolbar">
        <div className="search"><input placeholder="Tìm tên món ăn..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} aria-label="Lọc theo danh mục">
          <option value="ALL">Tất cả danh mục</option>
          {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
        </select>
        <button className="secondary" type="button" onClick={() => void loadMenu()}>Làm mới</button>
      </div>
      {error && <p className="login-error" role="alert">{error}</p>}
      <section className="data-card">
        <div className="data-card-head">
          <div><strong>{loading ? "Đang tải..." : `${products.length} món ăn`}</strong><p>Danh sách gồm cả món đang bán và món đang ẩn</p></div>
          <StatusBadge>{loading ? "Đang tải" : "Đang đồng bộ"}</StatusBadge>
        </div>
        <div className="data-table menu-data-table">
          <div className="data-row data-header"><span>Món ăn</span><span>Danh mục</span><span>Giá bán</span><span>Thời gian</span><span>Trạng thái</span><span>Thao tác</span></div>
          {!loading && products.length === 0 && <div className="menu-empty">Không tìm thấy món ăn phù hợp.</div>}
          {products.map((product) => (
            <div className="data-row" key={product.id}>
              <span className="menu-product-cell">
                {product.imageUrl ? <img src={product.imageUrl} alt="" className="menu-product-image" /> : <span className="menu-product-placeholder" aria-hidden="true">🍽</span>}
                <span><strong>{product.name}</strong>{product.description && <small>{product.description}</small>}</span>
              </span>
              <span>{product.categoryName}</span>
              <span>{new Intl.NumberFormat("vi-VN").format(product.price)} ₫</span>
              <span>{product.preparationTime ? `${product.preparationTime} phút` : "—"}</span>
              <span><StatusBadge kind={product.isAvailable ? "green" : "gray"}>{product.isAvailable ? "Đang bán" : "Đang ẩn"}</StatusBadge></span>
              <span className="menu-product-actions">
                <button type="button" className="row-action" onClick={() => startEdit(product)}>Sửa</button>
                <button type="button" className="row-action" onClick={() => void toggleAvailability(product)} disabled={updatingProductId === product.id}>
                  {updatingProductId === product.id ? "Đang lưu..." : product.isAvailable ? "Ẩn" : "Hiện"}
                </button>
              </span>
            </div>
          ))}
        </div>
      </section>
      {editing !== null && (
        <section className="data-card category-form-card product-form-card">
          <div className="data-card-head"><strong>{editing === "new" ? "Thêm món ăn" : "Chỉnh sửa món ăn"}</strong><button className="row-action" type="button" onClick={() => setEditing(null)}>Đóng</button></div>
          <form className="product-form" onSubmit={saveProduct}>
            <label>Tên món<input required maxLength={150} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label>Danh mục<select required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="" disabled>Chọn danh mục</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label>Giá bán<input required type="number" min="0" step="1000" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
            <label>Thời gian chuẩn bị (phút)<input type="number" min="1" max="1440" value={form.preparationTime} onChange={(event) => setForm({ ...form, preparationTime: event.target.value })} /></label>
            <label className="product-form-wide">Mô tả<textarea maxLength={1000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <label className="product-form-wide">Ảnh (URL)<input type="text" maxLength={500} value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://..." /></label>
            <label className="product-availability"><input type="checkbox" checked={form.isAvailable} onChange={(event) => setForm({ ...form, isAvailable: event.target.checked })} /> Hiện món trên thực đơn khách</label>
            <div className="product-form-actions"><button className="primary" type="submit" disabled={saving || !form.categoryId}>{saving ? "Đang lưu..." : "Lưu món ăn"}</button><button className="secondary" type="button" onClick={() => setEditing(null)}>Hủy</button></div>
          </form>
        </section>
      )}
    </>
  );
}

function CategoryManagementModule({ config }) {
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", displayOrder: 0, isActive: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get("/api/categories");
      setCategories(response.data);
      setError("");
    } catch (requestError) {
      setError(getError(requestError, "Không thể tải danh sách danh mục."));
    } finally {
      setLoading(false);
    }
  }, []);

  const startCreate = () => {
    setEditing("new");
    setForm({ name: "", description: "", displayOrder: categories.length + 1, isActive: true });
  };

  const startEdit = (category) => {
    setEditing(category.id);
    setForm({
      name: category.name,
      description: category.description || "",
      displayOrder: category.displayOrder || 0,
      isActive: category.isActive,
    });
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...form, displayOrder: Number(form.displayOrder) };
      if (editing === "new") await axiosClient.post("/api/categories", payload);
      else await axiosClient.put(`/api/categories/${editing}`, payload);
      setEditing(null);
      await loadCategories();
    } catch (requestError) {
      setError(getError(requestError, "Không thể lưu danh mục."));
    }
  };

  const toggleCategory = async (category) => {
    try {
      await axiosClient.patch(`/api/categories/${category.id}/status`, { isActive: !category.isActive });
      await loadCategories();
    } catch (requestError) {
      setError(getError(requestError, "Không thể cập nhật trạng thái danh mục."));
    }
  };

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  return (
    <>
      <PageTitle title={config.title} description={config.description} action={<button className="primary" type="button" onClick={startCreate}>＋ Thêm danh mục</button>} />
      {error && <p className="login-error" role="alert">{error}</p>}
      <section className="data-card">
        <div className="data-card-head">
          <div><strong>{loading ? "Đang tải..." : `${categories.length} danh mục`}</strong><p>Danh mục đang được đọc từ menu database</p></div>
          <button className="secondary" type="button" onClick={() => void loadCategories()}>Làm mới</button>
        </div>
        <div className="data-table category-data-table">
          <div className="data-row data-header"><span>Danh mục</span><span>Số món</span><span>Thứ tự</span><span>Trạng thái</span><span>Thao tác</span></div>
          {!loading && categories.length === 0 && <div className="menu-empty">Chưa có danh mục.</div>}
          {categories.map((category) => (
            <div className="data-row" key={category.id}>
              <span><strong>{category.name}</strong></span>
              <span>{category.productCount ?? 0} món</span>
              <span>{category.displayOrder ?? "—"}</span>
              <span><StatusBadge kind={category.isActive ? "green" : "gray"}>{category.isActive ? "Đang hoạt động" : "Đã tắt"}</StatusBadge></span>
              <span className="category-actions">
                <button type="button" className="row-action" onClick={() => startEdit(category)}>Sửa</button>
                <button type="button" className="row-action" onClick={() => void toggleCategory(category)}>{category.isActive ? "Tắt" : "Bật"}</button>
              </span>
            </div>
          ))}
        </div>
      </section>
      {editing !== null && (
        <section className="data-card category-form-card">
          <div className="data-card-head"><strong>{editing === "new" ? "Thêm danh mục" : "Sửa danh mục"}</strong><button className="row-action" type="button" onClick={() => setEditing(null)}>Đóng</button></div>
          <form className="category-form" onSubmit={saveCategory}>
            <input required maxLength={100} placeholder="Tên danh mục" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <input placeholder="Mô tả" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            <input required type="number" min="0" placeholder="Thứ tự" value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} />
            <label><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Đang hoạt động</label>
            <button className="primary" type="submit">Lưu danh mục</button>
          </form>
        </section>
      )}
    </>
  );
}

function InventoryModule({ module, config }) {
  const [ingredients, setIngredients] = useState([]);
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
      const [ingredientResponse, menuResponse] = await Promise.all([
        axiosClient.get("/api/ingredients"),
        axiosClient.get("/api/menu"),
      ]);
      const menuProducts = menuResponse.data.flatMap(
        (category) => category.products ?? [],
      );
      setIngredients(ingredientResponse.data);
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

function SuppliersModule({ config }) {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await axiosClient.get("/api/suppliers");
      setSuppliers(response.data);
      setError("");
    } catch (requestError) {
      setError(getError(requestError, "Không thể tải danh sách nhà cung cấp."));
    }
  }, []);

  useEffect(() => {
    // Load suppliers when this module opens.
    // oxlint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await axiosClient.put(`/api/suppliers/${editingId}`, form);
      } else {
        await axiosClient.post("/api/suppliers", form);
      }
      setForm({ name: "", phone: "", email: "", address: "" });
      setEditingId(null);
      await load();
    } catch (requestError) {
      setError(getError(requestError, "Không thể lưu nhà cung cấp."));
    }
  };

  const edit = (supplier) => {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name,
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? "",
    });
  };

  const toggleStatus = async (supplier) => {
    try {
      await axiosClient.patch(`/api/suppliers/${supplier.id}/status`, {
        isActive: !supplier.isActive,
      });
      await load();
    } catch (requestError) {
      setError(getError(requestError, "Không thể cập nhật nhà cung cấp."));
    }
  };

  return (
    <>
      <PageTitle title={config.title} description={config.description} />
      {error && <p className="login-error" role="alert">{error}</p>}
      <section className="data-card">
        <div className="data-card-head"><div><strong>{suppliers.length} nhà cung cấp</strong><p>Danh bạ được lưu trong database</p></div><button className="secondary" type="button" onClick={load}>Làm mới</button></div>
        <div className="data-table supplier-table">
          <div className="data-row data-header"><span>Nhà cung cấp</span><span>Liên hệ</span><span>Địa chỉ</span><span>Số phiếu</span><span>Trạng thái</span><span /></div>
          {suppliers.map((supplier) => (
            <div className="data-row" key={supplier.id}>
              <span><strong>{supplier.name}</strong></span>
              <span>{supplier.phone || "—"}<small>{supplier.email || ""}</small></span>
              <span>{supplier.address || "—"}</span>
              <span>{supplier.purchaseOrderCount}</span>
              <span><StatusBadge kind={supplier.isActive ? "green" : "orange"}>{supplier.isActive ? "Hoạt động" : "Ngừng hợp tác"}</StatusBadge></span>
              <span className="supplier-actions">
                <button className="secondary" type="button" onClick={() => edit(supplier)}>Sửa</button>
                <button className="secondary" type="button" onClick={() => toggleStatus(supplier)}>{supplier.isActive ? "Ngừng" : "Mở lại"}</button>
              </span>
            </div>
          ))}
          {suppliers.length === 0 && <div className="users-empty">Chưa có nhà cung cấp.</div>}
        </div>
      </section>
      <section className="data-card users-form-card">
        <div className="data-card-head"><div><strong>{editingId ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp"}</strong><p>Thông tin liên hệ và địa chỉ</p></div></div>
        <form className="supplier-form" onSubmit={submit}>
          <input required maxLength={150} placeholder="Tên nhà cung cấp" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input maxLength={20} placeholder="Số điện thoại" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <input type="email" maxLength={150} placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <input maxLength={300} placeholder="Địa chỉ" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
          <button className="primary" type="submit">{editingId ? "Lưu thay đổi" : "Thêm nhà cung cấp"}</button>
          {editingId && <button className="secondary" type="button" onClick={() => { setEditingId(null); setForm({ name: "", phone: "", email: "", address: "" }); }}>Hủy sửa</button>}
        </form>
      </section>
    </>
  );
}

function PurchaseOrdersModule({ config }) {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [error, setError] = useState("");
  const [updatingOrderIds, setUpdatingOrderIds] = useState([]);
  const [items, setItems] = useState([{ ingredientId: "", quantity: "", unitPrice: "" }]);
  const [form, setForm] = useState({ supplierId: "", note: "" });

  const load = useCallback(async () => {
    try {
      const [orderResponse, supplierResponse, ingredientResponse] = await Promise.all([
        axiosClient.get("/api/purchase-orders"),
        axiosClient.get("/api/suppliers"),
        axiosClient.get("/api/ingredients"),
      ]);
      setOrders(orderResponse.data);
      setSuppliers(supplierResponse.data);
      setIngredients(ingredientResponse.data);
      setError("");
    } catch (requestError) {
      setError(getError(requestError, "Không thể tải phiếu nhập hàng."));
    }
  }, []);

  useEffect(() => {
    // Load purchase orders and their supplier and ingredient options.
    // oxlint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

  const updateItem = (index, key, value) => {
    setItems((current) => current.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [key]: value } : item,
    ));
  };

  const createOrder = async (event) => {
    event.preventDefault();
    let user;
    try {
      user = JSON.parse(localStorage.getItem("smart-pos-user") ?? "null");
    } catch {
      setError("Không đọc được thông tin tài khoản đăng nhập.");
      return;
    }
    if (!user?.id) {
      setError("Vui lòng đăng nhập lại trước khi tạo phiếu nhập.");
      return;
    }

    try {
      await axiosClient.post("/api/purchase-orders", {
        supplierId: Number(form.supplierId),
        createdByUserId: Number(user.id),
        note: form.note,
        items: items.map((item) => ({
          ingredientId: Number(item.ingredientId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      });
      setForm({ supplierId: "", note: "" });
      setItems([{ ingredientId: "", quantity: "", unitPrice: "" }]);
      await load();
    } catch (requestError) {
      setError(getError(requestError, "Không thể tạo phiếu nhập hàng."));
    }
  };

  const receiveOrder = async (order) => {
    setUpdatingOrderIds((current) => [...current, order.id]);
    try {
      const response = await axiosClient.patch(`/api/purchase-orders/${order.id}/receive`);
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? {
                ...item,
                status: response.data.order.status,
                receivedAt: response.data.order.receivedAt,
              }
            : item,
        ),
      );
      setError("");
    } catch (requestError) {
      try {
        const response = await axiosClient.get(`/api/purchase-orders/${order.id}`);
        if (response.data.status === "Received") {
          setOrders((current) =>
            current.map((item) => item.id === order.id ? response.data : item),
          );
          setError("");
        } else {
          setError(getError(requestError, "Không thể nhận phiếu nhập hàng."));
        }
      } catch {
        setError(getError(requestError, "Không thể nhận phiếu nhập hàng."));
      }
    } finally {
      setUpdatingOrderIds((current) => current.filter((id) => id !== order.id));
    }
  };

  const cancelOrder = async (order) => {
    setUpdatingOrderIds((current) => [...current, order.id]);
    try {
      await axiosClient.patch(`/api/purchase-orders/${order.id}/cancel`);
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? { ...item, status: "Cancelled" } : item,
        ),
      );
      setError("");
    } catch (requestError) {
      setError(getError(requestError, "Không thể hủy phiếu nhập hàng."));
    } finally {
      setUpdatingOrderIds((current) => current.filter((id) => id !== order.id));
    }
  };

  return (
    <>
      <PageTitle title={config.title} description={config.description} />
      {error && <p className="login-error" role="alert">{error}</p>}
      <section className="data-card">
        <div className="data-card-head"><div><strong>{orders.length} phiếu nhập</strong><p>Kho chỉ được cộng khi xác nhận nhận hàng</p></div><button className="secondary" type="button" onClick={load}>Làm mới</button></div>
        <div className="data-table purchase-order-table">
          <div className="data-row data-header"><span>Mã phiếu / Nhà cung cấp</span><span>Nguyên liệu</span><span>Ngày tạo</span><span>Tổng tiền</span><span>Trạng thái</span><span>Thao tác</span></div>
          {orders.map((order) => (
            <div className="data-row" key={order.id}>
              <span><strong>{order.purchaseCode}</strong><small>{order.supplierName}</small></span>
              <span>{order.items.map((item) => `${item.ingredientName}: ${item.quantity} ${item.unit}`).join(", ")}</span>
              <span>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</span>
              <span>{Number(order.totalAmount).toLocaleString("vi-VN")} ₫</span>
              <span><StatusBadge kind={order.status === "Received" ? "green" : order.status === "Cancelled" ? "orange" : "blue"}>{order.status === "Received" ? "Đã nhận" : order.status === "Cancelled" ? "Đã hủy" : order.status}</StatusBadge></span>
              <span className="supplier-actions">
                {order.status !== "Received" && order.status !== "Cancelled" && <button className="primary" type="button" disabled={updatingOrderIds.includes(order.id)} onClick={() => receiveOrder(order)}>{updatingOrderIds.includes(order.id) ? "Đang cập nhật..." : "Nhận hàng"}</button>}
                {order.status !== "Received" && order.status !== "Cancelled" && <button className="secondary" type="button" disabled={updatingOrderIds.includes(order.id)} onClick={() => cancelOrder(order)}>Hủy</button>}
              </span>
            </div>
          ))}
          {orders.length === 0 && <div className="users-empty">Chưa có phiếu nhập hàng.</div>}
        </div>
      </section>
      <section className="data-card users-form-card">
        <div className="data-card-head"><div><strong>Tạo phiếu nhập hàng</strong><p>Xác nhận “Nhận hàng” sẽ cộng số lượng vào kho một lần</p></div></div>
        <form className="purchase-order-form" onSubmit={createOrder}>
          <select required value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })}>
            <option value="">Chọn nhà cung cấp</option>
            {suppliers.filter((supplier) => supplier.isActive).map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.name}</option>)}
          </select>
          <input placeholder="Ghi chú" maxLength={500} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
          {items.map((item, index) => (
            <div className="purchase-order-item" key={index}>
              <select required value={item.ingredientId} onChange={(event) => updateItem(index, "ingredientId", event.target.value)}>
                <option value="">Chọn nguyên liệu</option>
                {ingredients.filter((ingredient) => ingredient.isActive).map((ingredient) => <option value={ingredient.id} key={ingredient.id}>{ingredient.name} ({ingredient.unit})</option>)}
              </select>
              <input required type="number" min="0.001" step="0.001" placeholder="Số lượng" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} />
              <input required type="number" min="0" step="0.01" placeholder="Đơn giá" value={item.unitPrice} onChange={(event) => updateItem(index, "unitPrice", event.target.value)} />
              {items.length > 1 && <button className="secondary" type="button" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Xóa dòng</button>}
            </div>
          ))}
          <div className="purchase-order-actions">
            <button className="secondary" type="button" onClick={() => setItems((current) => [...current, { ingredientId: "", quantity: "", unitPrice: "" }])}>＋ Thêm nguyên liệu</button>
            <button className="primary" type="submit" disabled={!suppliers.some((supplier) => supplier.isActive) || ingredients.length === 0}>Tạo phiếu nhập</button>
          </div>
        </form>
      </section>
    </>
  );
}

function UsersModule({ config }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    password: "",
    position: "",
    roleId: "",
  });

  const load = useCallback(async () => {
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        axiosClient.get("/api/users"),
        axiosClient.get("/api/roles"),
      ]);
      setUsers(usersResponse.data);
      setRoles(rolesResponse.data);
      setError("");
    } catch (requestError) {
      setError(getError(requestError, "Không thể tải tài khoản và vai trò."));
    }
  }, []);

  useEffect(() => {
    // Load persisted accounts and roles when the module opens.
    // oxlint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        `${user.fullName} ${user.email} ${user.employeeCode} ${(user.roles ?? []).join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [users, query],
  );

  const createUser = async (event) => {
    event.preventDefault();
    try {
      const response = await axiosClient.post("/api/users", {
        ...userForm,
        roleIds: userForm.roleId ? [Number(userForm.roleId)] : [],
      });
      setUsers((currentUsers) => [
        response.data,
        ...currentUsers.filter((user) => user.id !== response.data.id),
      ]);
      setError("");
      setUserForm({
        fullName: "",
        email: "",
        password: "",
        position: "",
        roleId: "",
      });
    } catch (requestError) {
      setError(getError(requestError, "Không thể tạo tài khoản."));
    }
  };

  const updateUserRole = async (userId, roleId) => {
    if (!roleId) return;
    try {
      await axiosClient.put(`/api/users/${userId}/roles`, {
        roleIds: [Number(roleId)],
      });
      const selectedRole = roles.find((role) => role.id === Number(roleId));
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                roleIds: [Number(roleId)],
                roles: selectedRole ? [selectedRole.name] : user.roles,
              }
            : user,
        ),
      );
      await load();
    } catch (requestError) {
      setError(getError(requestError, "Không thể cập nhật vai trò tài khoản."));
    }
  };

  const toggleUserStatus = async (user) => {
    try {
      await axiosClient.patch(`/api/users/${user.id}/status`, {
        isActive: !user.isActive,
      });
      await load();
    } catch (requestError) {
      setError(getError(requestError, "Không thể cập nhật trạng thái tài khoản."));
    }
  };

  return (
    <>
      <PageTitle title={config.title} description={config.description} />
      {error && <p className="login-error" role="alert">{error}</p>}
      <div className="module-toolbar">
        <div className="search">⌕ <input placeholder="Tìm tài khoản..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <button className="secondary" type="button" onClick={load}>Làm mới</button>
      </div>
      <section className="data-card">
        <div className="data-card-head"><div><strong>{filteredUsers.length} tài khoản</strong><p>Danh sách nhân viên từ database</p></div><StatusBadge>Đang đồng bộ</StatusBadge></div>
        <div className="data-table users-table">
          <div className="data-row data-header"><span>Nhân viên</span><span>Email</span><span>Vai trò</span><span>Chức vụ</span><span>Trạng thái</span><span /></div>
          {filteredUsers.map((user) => (
            <div className="data-row" key={user.id}>
              <span><strong>{user.fullName}</strong><small>{user.employeeCode}</small></span>
              <span>{user.email}</span>
              <span><select value={user.roleIds?.[0]?.toString() ?? ""} onChange={(event) => updateUserRole(user.id, event.target.value)} aria-label={`Vai trò của ${user.fullName}`}>
                <option value="" disabled>Chọn vai trò</option>
                {roles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}
              </select></span>
              <span>{user.position || "—"}</span>
              <span><StatusBadge kind={user.isActive ? "green" : "orange"}>{user.isActive ? "Hoạt động" : "Đã khóa"}</StatusBadge></span>
              <button className="secondary user-status-action" type="button" onClick={() => toggleUserStatus(user)}>{user.isActive ? "Khóa" : "Mở"}</button>
            </div>
          ))}
          {filteredUsers.length === 0 && <div className="users-empty">Không tìm thấy tài khoản nào.</div>}
        </div>
      </section>
      <section className="data-card users-form-card">
        <div className="data-card-head"><div><strong>Tạo tài khoản</strong><p>Mật khẩu được mã hóa trước khi lưu vào database</p></div></div>
        <form className="users-form" onSubmit={createUser}>
          <input required placeholder="Họ và tên" value={userForm.fullName} onChange={(event) => setUserForm({ ...userForm, fullName: event.target.value })} />
          <input required type="email" placeholder="Email" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} />
          <input required type="password" minLength={8} placeholder="Mật khẩu (ít nhất 8 ký tự)" value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} />
          <input placeholder="Chức vụ" value={userForm.position} onChange={(event) => setUserForm({ ...userForm, position: event.target.value })} />
          <select required value={userForm.roleId} onChange={(event) => setUserForm({ ...userForm, roleId: event.target.value })} aria-label="Chọn vai trò">
            <option value="" disabled>Chọn vai trò</option>
            {roles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}
          </select>
          <button className="primary" type="submit">Tạo tài khoản</button>
        </form>
      </section>
    </>
  );
}

export function AdminModulePage({ module }) {
  const config = adminModules[module] || adminModules.menu;
  const [query, setQuery] = useState("");
  const rows = (config.rows ?? []).filter((row) =>
    row.join(" ").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <BackofficeLayout role="manager" title="Minh Anh · Quản lý">
      <main className="page admin-module-page">
        {module === "menu" ? <MenuManagementModule config={config} /> : module === "categories" ? <CategoryManagementModule config={config} /> : module === "users" ? <UsersModule config={config} /> : module === "suppliers" ? <SuppliersModule config={config} /> : module === "purchase-orders" ? <PurchaseOrdersModule config={config} /> : module === "stock-movements" ? <InventoryMovementsModule config={config} /> : module === "expenses" ? <FinancialReportModule /> : inventoryModules.has(module) ? <InventoryModule module={module} config={config} /> : (
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
