import { useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";

function errorMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

export function TableOperationsModal({
  operation,
  activeOrder,
  tables,
  orders,
  onClose,
  onSuccess,
}) {
  const [targetTableId, setTargetTableId] = useState("");
  const [sourceOrderIds, setSourceOrderIds] = useState([]);
  const [splitItems, setSplitItems] = useState({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const availableTables = useMemo(
    () =>
      tables.filter(
        (table) =>
          table.id !== activeOrder?.tableId && table.status !== "Maintenance",
      ),
    [activeOrder, tables],
  );
  const sourceOrders = orders.filter(
    (order) =>
      order.id !== activeOrder?.id &&
      !["Completed", "Cancelled"].includes(order.status),
  );
  const title = {
    transfer: "Chuyển bàn",
    merge: "Gộp đơn",
    split: "Tách đơn",
  }[operation];

  const toggleSource = (orderId) => {
    setSourceOrderIds((current) =>
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId],
    );
  };

  const updateSplitQuantity = (itemId, quantity) => {
    setSplitItems((current) => ({
      ...current,
      [itemId]: Math.max(0, Math.min(Number(quantity) || 0, activeOrder.items.find((item) => item.id === itemId)?.quantity || 0)),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!activeOrder) {
      setError("Bàn hiện tại chưa có đơn đang phục vụ.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      let response;
      if (operation === "transfer") {
        if (!targetTableId) {
          setError("Vui lòng chọn bàn đích.");
          return;
        }
        response = await axiosClient.post(
          `/api/orders/${activeOrder.id}/transfer-table`,
          { targetTableId: Number(targetTableId) },
        );
      } else if (operation === "merge") {
        if (sourceOrderIds.length === 0) {
          setError("Vui lòng chọn ít nhất một đơn cần gộp.");
          return;
        }
        response = await axiosClient.post("/api/orders/merge", {
          targetOrderId: activeOrder.id,
          sourceOrderIds,
        });
      } else {
        const items = Object.entries(splitItems)
          .filter(([, quantity]) => quantity > 0)
          .map(([orderItemId, quantity]) => ({
            orderItemId: Number(orderItemId),
            quantity,
          }));
        if (!targetTableId || items.length === 0) {
          setError("Vui lòng chọn bàn đích và món cần tách.");
          return;
        }
        response = await axiosClient.post(`/api/orders/${activeOrder.id}/split`, {
          targetTableId: Number(targetTableId),
          note: note.trim() || null,
          items,
        });
      }
      await onSuccess(response.data);
      onClose();
    } catch (requestError) {
      setError(errorMessage(requestError, `Không thể ${title.toLowerCase()}.`));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="table-operation-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="table-operation-dialog" role="dialog" aria-modal="true" aria-labelledby="table-operation-title">
        <div className="table-operation-heading">
          <div>
            <p className="eyebrow">THAO TÁC ĐƠN HÀNG</p>
            <h2 id="table-operation-title">{title}</h2>
          </div>
          <button type="button" className="table-operation-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>
        <p className="table-operation-order">
          {activeOrder ? `${activeOrder.orderCode} · ${activeOrder.tableNumber}` : "Chưa có đơn đang phục vụ"}
        </p>
        {!activeOrder && (
          <div className="table-operation-error" role="status">
            Bàn này chưa có đơn đang phục vụ. Hãy tạo đơn trước khi chuyển,
            gộp hoặc tách bàn.
          </div>
        )}
        <form onSubmit={submit}>
          {operation === "transfer" && (
            <label className="table-operation-field">
              Bàn đích
              <select value={targetTableId} onChange={(event) => setTargetTableId(event.target.value)} required>
                <option value="">Chọn bàn đích</option>
                {availableTables.map((table) => (
                  <option value={table.id} key={table.id}>{table.tableNumber} · {table.capacity} chỗ</option>
                ))}
              </select>
            </label>
          )}
          {operation === "merge" && (
            <fieldset className="table-operation-list">
              <legend>Chọn đơn cần gộp vào {activeOrder?.orderCode}</legend>
              {sourceOrders.length === 0 ? <p>Không có đơn đang phục vụ khác.</p> : sourceOrders.map((order) => (
                <label key={order.id}>
                  <input type="checkbox" checked={sourceOrderIds.includes(order.id)} onChange={() => toggleSource(order.id)} />
                  <span>{order.orderCode} · {order.tableNumber}</span>
                  <strong>{order.items.length} món</strong>
                </label>
              ))}
            </fieldset>
          )}
          {operation === "split" && (
            <>
              <label className="table-operation-field">
                Bàn đích
                <select value={targetTableId} onChange={(event) => setTargetTableId(event.target.value)} required>
                  <option value="">Chọn bàn đích</option>
                  {availableTables.map((table) => (
                    <option value={table.id} key={table.id}>{table.tableNumber} · {table.capacity} chỗ</option>
                  ))}
                </select>
              </label>
              <fieldset className="table-operation-list">
                <legend>Số lượng món cần tách</legend>
                {activeOrder?.items.map((item) => (
                  <label key={item.id}>
                    <span>{item.productName} · còn {item.quantity}</span>
                    <input type="number" min="0" max={item.quantity} value={splitItems[item.id] || ""} onChange={(event) => updateSplitQuantity(item.id, event.target.value)} />
                  </label>
                ))}
              </fieldset>
              <label className="table-operation-field">
                Ghi chú
                <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ghi chú cho đơn mới (không bắt buộc)" />
              </label>
            </>
          )}
          {error && <div className="table-operation-error" role="alert">{error}</div>}
          <div className="table-operation-actions">
            <button type="button" className="secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="primary" disabled={busy || !activeOrder}>{busy ? "Đang xử lý…" : title}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
