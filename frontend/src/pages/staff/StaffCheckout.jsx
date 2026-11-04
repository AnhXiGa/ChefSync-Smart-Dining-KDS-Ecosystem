import { useCallback, useEffect, useMemo, useState } from "react";
import { BackofficeLayout, PageTitle } from "../../components/shared/Ui";
import { getOrders } from "../../api/orderApi";
import { getTables } from "../../api/tableApi";
import { getPaymentByOrder } from "../../api/paymentApi";
import { OrderInvoice } from "../../components/staff/payment/OrderInvoice";
import { CashPaymentModal } from "../../components/staff/payment/CashPaymentModal";
import { SepayPaymentModal } from "../../components/staff/payment/SepayPaymentModal";
import { PaymentStatus } from "../../components/staff/payment/PaymentStatus";

const money = (value) => `${new Intl.NumberFormat("vi-VN").format(value || 0)} ₫`;

export function StaffCheckout() {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState({});
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
      setSelectedTableId((current) => current ?? tableData.find((table) => activeOrders.some((order) => order.tableId === table.id))?.id ?? null);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không tải được dữ liệu thanh toán.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const checkoutTables = useMemo(() => {
    const activeTableIds = new Set(orders.map((order) => order.tableId));
    return tables
      .filter((table) => activeTableIds.has(table.id))
      .filter((table) => table.tableNumber.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi")))
      .filter((table) => statusFilter === "all" || payments[orders.find((order) => order.tableId === table.id)?.id]?.status === statusFilter);
  }, [orders, payments, query, statusFilter, tables]);

  const selectedOrder = orders.find((order) => order.tableId === selectedTableId);
  const selectedPayment = selectedOrder ? payments[selectedOrder.id] : null;
  const canPay = selectedOrder && !["Paid"].includes(selectedPayment?.status);

  const handleSuccess = async (payment) => {
    setReceipt({ order: selectedOrder, payment });
    setModal(null);
    await load();
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
            <OrderInvoice order={selectedOrder} />
            {selectedOrder && (
              <div className="checkout-actions">
                {selectedPayment && <PaymentStatus status={selectedPayment.status} />}
                <button className="primary" onClick={() => setModal("cash")} disabled={!canPay}>Thanh toán tiền mặt</button>
                <button className="secondary" onClick={() => setModal("sepay")} disabled={!canPay}>Thanh toán SePay QR</button>
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
            <h2>Hóa đơn {receipt.order.orderCode}</h2>
            <p>Bàn {receipt.order.tableNumber} · {money(receipt.order.totalAmount)}</p>
            <PaymentStatus status={receipt.payment.status} />
            {receipt.payment.transactionCode && <p>Mã giao dịch: {receipt.payment.transactionCode}</p>}
            <div className="table-operation-actions">
              <button className="secondary" onClick={() => window.print()}>In hóa đơn</button>
              <button className="primary" onClick={() => setReceipt(null)}>Đóng</button>
            </div>
          </section>
        </div>
      )}
    </BackofficeLayout>
  );
}
