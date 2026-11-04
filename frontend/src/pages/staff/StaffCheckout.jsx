import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BackofficeLayout, PageTitle } from "../../components/shared/Ui";
import { getOrders, updateOrderDiscount } from "../../api/orderApi";
import { getTables } from "../../api/tableApi";
import { cancelPayment, getPaymentByOrder } from "../../api/paymentApi";
import { OrderInvoice } from "../../components/staff/payment/OrderInvoice";
import { CashPaymentModal } from "../../components/staff/payment/CashPaymentModal";
import { SepayPaymentModal } from "../../components/staff/payment/SepayPaymentModal";
import { PaymentStatus } from "../../components/staff/payment/PaymentStatus";

const money = (value) => `${new Intl.NumberFormat("vi-VN").format(value || 0)} ₫`;

export function StaffCheckout() {
  const [searchParams] = useSearchParams();
  const requestedTableId = Number(searchParams.get("tableId"));
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState({});
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [discountBusy, setDiscountBusy] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [modal, setModal] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [tableData, orderData] = await Promise.all([getTables(), getOrders()]);
      const activeOrders = orderData.filter((order) => !["Completed", "Cancelled"].includes(order.status));
      const paymentEntries = await Promise.all(activeOrders.map(async (order) => [order.id, await getPaymentByOrder(order.id)]));
      setTables(tableData);
      setOrders(activeOrders);
      setPayments(Object.fromEntries(paymentEntries));
      setSelectedTableId((current) => current ??
        tableData.find((table) =>
          table.id === requestedTableId &&
          activeOrders.some((order) => order.tableId === table.id),
        )?.id ??
        tableData.find((table) => activeOrders.some((order) => order.tableId === table.id))?.id ??
        null);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không tải được dữ liệu thanh toán.");
    } finally {
      setLoading(false);
    }
  }, [requestedTableId]);

  useEffect(() => {
    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [load]);

  const checkoutTables = useMemo(() => {
    const activeTableIds = new Set(orders.map((order) => order.tableId));
    return tables
      .filter((table) => activeTableIds.has(table.id))
      .filter((table) => table.tableNumber.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi")))
      .filter((table) => statusFilter === "all" || payments[orders.find((order) => order.tableId === table.id)?.id]?.status === statusFilter);
  }, [orders, payments, query, statusFilter, tables]);

  const selectedOrder = orders.find((order) => order.tableId === selectedTableId);
  const selectedPayment = selectedOrder ? payments[selectedOrder.id] : null;
  const payableItems = selectedOrder?.items?.filter((item) => item.status !== "Cancelled") || [];
  const allItemsServed = payableItems.length > 0 && payableItems.every((item) => item.status === "Served");
  const canPay = selectedOrder &&
    !["Paid"].includes(selectedPayment?.status) &&
    allItemsServed;
  const discountValue = selectedOrder
    ? (selectedOrder.subtotal * (Number(discountPercentage) || 0)) / 100
    : 0;
  const checkoutTotal = selectedOrder
    ? Math.max(0, selectedOrder.subtotal + selectedOrder.tax - discountValue)
    : 0;

  const updateDiscount = async () => {
    if (!selectedOrder) return;
    const percentage = Number(discountPercentage);
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      setError("Giảm giá phải từ 0% đến 100%.");
      return;
    }
    setDiscountBusy(true);
    setError("");
    try {
      await updateOrderDiscount(selectedOrder.id, percentage);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể cập nhật giảm giá.");
    } finally {
      setDiscountBusy(false);
    }
  };

  const cancelPendingPayment = async () => {
    if (!selectedPayment?.id || selectedPayment.status !== "Pending") return;
    setCancelBusy(true);
    setError("");
    try {
      await cancelPayment(selectedPayment.id);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể hủy thanh toán.");
    } finally {
      setCancelBusy(false);
    }
  };

  const handleSuccess = async (payment) => {
    const completedOrder = selectedOrder;
    if (!completedOrder || !payment) {
      setError("Không lấy được dữ liệu hóa đơn sau khi thanh toán.");
      return;
    }

    setReceipt({ order: completedOrder, payment });
    setModal(null);
    void load();
  };

  return (
    <BackofficeLayout title="Thu ngân · Checkout">
      <main className="page checkout-page">
        <PageTitle
          eyebrow="THU NGÂN / CHECKOUT"
          title="Thanh toán tại bàn"
          description="Chọn bàn có order từ QR, kiểm tra hóa đơn và xác nhận thanh toán."
          action={<button className="secondary" onClick={() => void load()}>↻ Làm mới</button>}
        />
        {error && <div className="table-operation-error" role="alert">{error}</div>}
        <div className="checkout-layout">
          <section className="checkout-table-panel">
            <div className="checkout-panel-heading"><h2>Bàn cần thanh toán</h2><strong>{checkoutTables.length}</strong></div>
            <input className="checkout-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm số bàn…" />
            <select className="checkout-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="Pending">Đang chờ</option>
              <option value="Paid">Đã thanh toán</option>
              <option value="Cancelled">Đã hủy</option>
            </select>
            {loading ? <div className="checkout-empty">Đang tải…</div> : checkoutTables.length === 0 ? <div className="checkout-empty">Không có bàn có order chưa thanh toán.</div> : checkoutTables.map((table) => {
              const order = orders.find((item) => item.tableId === table.id);
              const payment = payments[order.id];
              return (
                <button className={`checkout-table-row ${selectedTableId === table.id ? "selected" : ""}`} onClick={() => setSelectedTableId(table.id)} key={table.id}>
                  <span><strong>{table.tableNumber}</strong><small>{table.status} · {order.orderCode}</small></span>
                  <span><PaymentStatus status={payment?.status || "Pending"} /><b>{money(order.totalAmount)}</b></span>
                </button>
              );
            })}
          </section>
          <section className="checkout-detail-panel">
            <OrderInvoice
              order={selectedOrder}
              paymentStatus={selectedPayment?.status}
              onCancelPayment={selectedPayment?.status === "Pending" ? () => void cancelPendingPayment() : null}
              cancelBusy={cancelBusy}
            />
            {selectedOrder && (
              <div className="checkout-actions">
                <div className="checkout-discount">
                  <label htmlFor="checkout-discount">Giảm giá (%)</label>
                  <div>
                    <input
                      id="checkout-discount"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={discountPercentage}
                      onChange={(event) => setDiscountPercentage(event.target.value)}
                      placeholder="0"
                    />
                    <button className="secondary" type="button" onClick={() => void updateDiscount()} disabled={discountBusy}>
                      {discountBusy ? "Đang lưu…" : "Áp dụng"}
                    </button>
                  </div>
                  <small>Giảm: {money(discountValue)} · Tổng: {money(checkoutTotal)}</small>
                </div>
                {selectedPayment?.status === "Cancelled" && (
                  <p className="checkout-payment-hint checkout-payment-cancelled">
                    Giao dịch cũ đã hủy. Order và bàn vẫn đang mở, bạn có thể thanh toán lại.
                  </p>
                )}
                {selectedOrder && !allItemsServed && (
                  <p className="checkout-payment-hint">
                    Chỉ có thể thanh toán sau khi bếp đã xác nhận phục vụ đủ tất cả món.
                  </p>
                )}
                <div className="checkout-payment-buttons">
                  <button className="primary" onClick={() => setModal("cash")} disabled={!canPay}>
                    {selectedPayment?.status === "Cancelled" ? "Thanh toán lại tiền mặt" : "Thanh toán tiền mặt"}
                  </button>
                  <button className="secondary" onClick={() => setModal("sepay")} disabled={!canPay}>
                    {selectedPayment?.status === "Cancelled" ? "Thanh toán lại SePay QR" : "Thanh toán SePay QR"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      {modal === "cash" && <CashPaymentModal order={selectedOrder} existingPayment={selectedPayment?.status === "Pending" ? selectedPayment : null} onClose={() => setModal(null)} onSuccess={handleSuccess} />}
      {modal === "sepay" && <SepayPaymentModal order={selectedOrder} onClose={() => setModal(null)} onSuccess={handleSuccess} />}
      {receipt && (
        <div className="payment-modal-overlay" role="presentation">
          <section className="payment-modal receipt-modal" role="dialog" aria-modal="true">
            <p className="eyebrow">THANH TOÁN THÀNH CÔNG</p>
            <OrderInvoice order={receipt.order} />
            <PaymentStatus status={receipt.payment.status} />
            <p>Phương thức: {receipt.payment.paymentMethod === "Cash" ? "Tiền mặt" : "Chuyển khoản SePay"}</p>
            {receipt.payment.transactionCode && <p>Mã giao dịch: {receipt.payment.transactionCode}</p>}
            <div className="table-operation-actions receipt-actions">
              <button className="secondary" onClick={() => window.print()}>In / lưu PDF</button>
              <button className="primary" onClick={() => setReceipt(null)}>Đóng</button>
            </div>
          </section>
        </div>
      )}
    </BackofficeLayout>
  );
}
