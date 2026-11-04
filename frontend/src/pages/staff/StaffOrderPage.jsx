import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { BackofficeLayout, PageTitle } from "../../components/shared/Ui";
import { OrderSummary } from "../../components/staff/OrderComponents";
import { OrderStatusPanel } from "../../components/shared/OrderStatusPanel";
import { useTableOrderUpdates } from "../../hooks/useTableOrderUpdates";
import { TableOperationsModal } from "../../components/staff/TableOperationsModal";

export function StaffOrderPage() {
  const { tableId = "5" } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [operation, setOperation] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [payment, setPayment] = useState(null);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const orderUpdates = useTableOrderUpdates(tableId);
  const loadOperationsData = useCallback(async () => {
    try {
      const [{ data: tableData }, { data: orderData }] = await Promise.all([
        axiosClient.get("/api/tables"),
        axiosClient.get("/api/orders"),
      ]);
      // oxlint-disable-next-line react/set-state-in-effect
      setTables(tableData);
      // oxlint-disable-next-line react/set-state-in-effect
      setOrders(orderData);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không tải được dữ liệu thao tác bàn.");
    }
  }, []);
  useEffect(() => {
    void loadOperationsData();
  }, [loadOperationsData]);
  const activeOrder = orders.find(
    (order) =>
      order.tableId === Number(tableId) &&
      !["Completed", "Cancelled"].includes(order.status),
  );
  const currentTable = tables.find((table) => table.id === Number(tableId));
  const completeOperation = async (updatedOrder) => {
    await loadOperationsData();
    if (updatedOrder?.tableId && updatedOrder.tableId !== Number(tableId)) {
      navigate(`/staff/order/${updatedOrder.tableId}`);
    }
  };
  const createPayment = async () => {
    if (!activeOrder) {
      setError("Bàn chưa có đơn cần thanh toán.");
      return;
    }

    setPaymentBusy(true);
    setError("");
    try {
      const { data } = await axiosClient.post("/api/payments", {
        orderId: activeOrder.id,
        paymentMethod,
        receivedAmount:
          paymentMethod === "Cash" ? Number(receivedAmount) : null,
      });
      setPayment(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể tạo thanh toán.");
    } finally {
      setPaymentBusy(false);
    }
  };
  const confirmCashPayment = async () => {
    if (!payment) return;
    setPaymentBusy(true);
    setError("");
    try {
      await axiosClient.post(`/api/payments/${payment.id}/confirm-cash`);
      setPayment(null);
      setReceivedAmount("");
      await loadOperationsData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể xác nhận thanh toán.");
    } finally {
      setPaymentBusy(false);
    }
  };
  return (
    <BackofficeLayout title="Minh Anh · Nhân viên">
      <main className="page">
        <PageTitle
          eyebrow="Nhà hàng An Nhiên / Thu ngân"
          title={`${currentTable?.tableNumber || `Bàn #${tableId}`} · Chi tiết bàn`}
          description={
            currentTable
              ? `${currentTable.capacity} chỗ ngồi · Trạng thái: ${currentTable.status}`
              : "Đang tải thông tin bàn..."
          }
          action={
            <div className="title-actions">
              <button className="secondary" onClick={() => setOperation("transfer")}>
                Chuyển bàn
              </button>
              <button className="secondary" onClick={() => setOperation("merge")}>
                Gộp bàn
              </button>
              <button className="secondary" onClick={() => setOperation("split")}>
                Tách bàn
              </button>
            </div>
          }
        />
        <OrderStatusPanel {...orderUpdates} />
        {error && <div role="alert">{error}</div>}
        <div className="order-layout">
          <section>
            <section className="detail-card">
              <h2>Đơn từ QR</h2>
              {activeOrder ? (
                <>
                  <p>{activeOrder.orderCode} · {activeOrder.items.length} món</p>
                  {activeOrder.items.map((item) => (
                    <div className="invoice-row" key={item.id}>
                      <span>{item.quantity} × {item.productName}</span>
                      <b>{new Intl.NumberFormat("vi-VN").format(item.subtotal)} ₫</b>
                    </div>
                  ))}
                </>
              ) : (
                <p>Chưa có đơn đang phục vụ tại bàn này.</p>
              )}
            </section>
          </section>
          <OrderSummary
            cart={[]}
            total={0}
            onPayment={() => setPayment({ open: true })}
            paymentDisabled={!activeOrder}
            existingOrder={activeOrder}
          />
        </div>
      </main>
      {operation && (
        <TableOperationsModal
          operation={operation}
          activeOrder={activeOrder}
          tables={tables}
          orders={orders}
          onClose={() => setOperation(null)}
          onSuccess={completeOperation}
        />
      )}
      {payment?.open && (
        <div className="table-operation-overlay" role="presentation">
          <section className="table-operation-dialog" role="dialog" aria-modal="true" aria-labelledby="payment-title">
            <div className="table-operation-heading">
              <div>
                <p className="eyebrow">THANH TOÁN</p>
                <h2 id="payment-title">Thanh toán {activeOrder?.orderCode}</h2>
              </div>
              <button className="table-operation-close" onClick={() => setPayment(null)} aria-label="Đóng">×</button>
            </div>
            <p className="table-operation-order">
              Tổng tiền: {new Intl.NumberFormat("vi-VN").format(activeOrder?.totalAmount || 0)} ₫
            </p>
            <label className="table-operation-field">
              Phương thức
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                <option value="Cash">Tiền mặt</option>
                <option value="BankTransfer">Chuyển khoản</option>
              </select>
            </label>
            {paymentMethod === "Cash" && (
              <label className="table-operation-field">
                Tiền khách đưa
                <input
                  type="number"
                  min={activeOrder?.totalAmount || 0}
                  value={receivedAmount}
                  onChange={(event) => setReceivedAmount(event.target.value)}
                  placeholder="Nhập số tiền"
                />
              </label>
            )}
            {payment?.qrCodeUrl && (
              <div className="payment-qr-result">
                <img src={payment.qrCodeUrl} alt="Mã QR thanh toán" />
                <p>Nội dung chuyển khoản: <strong>{payment.transferContent}</strong></p>
                <p>Trạng thái: {payment.status}</p>
              </div>
            )}
            {payment?.changeAmount !== undefined && payment?.changeAmount !== null && (
              <p className="table-operation-order">
                Tiền thừa: {new Intl.NumberFormat("vi-VN").format(payment.changeAmount)} ₫
              </p>
            )}
            {payment?.status === "Pending" && paymentMethod === "Cash" && (
              <button className="primary full" onClick={confirmCashPayment} disabled={paymentBusy}>
                {paymentBusy ? "Đang xác nhận…" : "Xác nhận đã thu tiền"}
              </button>
            )}
            {!payment?.id && (
              <button className="primary full" onClick={createPayment} disabled={paymentBusy}>
                {paymentBusy ? "Đang tạo…" : "Tạo thanh toán"}
              </button>
            )}
            {payment?.qrCodeUrl && (
              <button className="secondary full" onClick={() => setPayment(null)}>
                Đóng sau khi chuyển khoản
              </button>
            )}
          </section>
        </div>
      )}
    </BackofficeLayout>
  );
}
