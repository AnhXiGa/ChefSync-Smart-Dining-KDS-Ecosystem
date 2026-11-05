import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { BackofficeLayout, PageTitle } from "../../components/shared/Ui";
import { OrderSummary } from "../../components/staff/OrderComponents";
import { OrderStatusPanel } from "../../components/shared/OrderStatusPanel";
import { useTableOrderUpdates } from "../../hooks/useTableOrderUpdates";
import { TableOperationsModal } from "../../components/staff/TableOperationsModal";
import { cancelPayment } from "../../api/paymentApi";

const money = (value) => `${new Intl.NumberFormat("vi-VN").format(value || 0)} ₫`;
const cashDenominations = [50000, 100000, 200000, 500000, 1000000];

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
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
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
  useEffect(() => {
    if (orderUpdates.changeVersion > 0) void loadOperationsData();
  }, [loadOperationsData, orderUpdates.changeVersion]);
  const activeOrderBase = orders.find(
    (order) =>
      order.tableId === Number(tableId) &&
      !["Completed", "Cancelled"].includes(order.status),
  );
  const liveOrder = orderUpdates.orders.find((order) => order.id === activeOrderBase?.id);
  const activeOrder = activeOrderBase
    ? { ...activeOrderBase, items: liveOrder?.items || activeOrderBase.items }
    : null;
  const activeItems = activeOrder?.items?.filter((item) => item.status !== "Cancelled") || [];
  const allItemsServed = activeItems.length > 0 &&
    activeItems.every((item) => item.status === "Served");
  const received = Number(receivedAmount);
  const cashAmountValid =
    Number.isFinite(received) &&
    received >= (activeOrder?.totalAmount || 0);
  const exactAmount = Math.ceil((activeOrder?.totalAmount || 0) / 1000) * 1000;
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
    if (!allItemsServed) {
      setError("Chưa thể thanh toán: bếp chưa xác nhận phục vụ đủ tất cả món.");
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
  const cancelPendingPayment = async () => {
    if (!payment?.id || payment.status !== "Pending") return;
    setCancelBusy(true);
    setError("");
    try {
      await cancelPayment(payment.id);
      setPayment(null);
      await loadOperationsData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể hủy thanh toán.");
    } finally {
      setCancelBusy(false);
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
            onPayment={() => {
              navigate(`/staff/checkout?tableId=${tableId}`);
            }}
            paymentDisabled={!activeOrder || !allItemsServed}
            paymentHint={
              activeOrder && !allItemsServed
                ? "Chưa thể thanh toán: chờ bếp xác nhận đã phục vụ đủ món."
                : ""
            }
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
      {paymentOpen && (
        <div className="table-operation-overlay" role="presentation">
          <section className="table-operation-dialog" role="dialog" aria-modal="true" aria-labelledby="payment-title">
            <div className="table-operation-heading">
              <div>
                <p className="eyebrow">THANH TOÁN</p>
                <h2 id="payment-title">Thanh toán {activeOrder?.orderCode}</h2>
              </div>
              <button className="table-operation-close" onClick={() => setPaymentOpen(false)} aria-label="Đóng">×</button>
            </div>
            <p className="table-operation-order">
              Tổng tiền cần thu: <strong>{money(activeOrder?.totalAmount)}</strong>
            </p>
            <label className="table-operation-field">
              Phương thức
                <select
                  value={paymentMethod}
                  onChange={(event) => {
                    setPaymentMethod(event.target.value);
                    setPayment(null);
                    setError("");
                  }}
                >
                  <option value="Cash">Tiền mặt</option>
                  <option value="BankTransfer">Chuyển khoản SePay QR</option>
              </select>
              </label>
              {paymentMethod === "BankTransfer" && !payment && (
                <p className="payment-method-hint">
                  Bấm “Tạo QR thanh toán” để backend sinh mã QR cho đúng số tiền và nội dung đơn hàng.
                </p>
              )}
            {paymentMethod === "Cash" && (
              <div className="cash-payment-entry">
                <label className="table-operation-field">
                Tiền khách đưa
                  <div className="cash-amount-input">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={receivedAmount ? new Intl.NumberFormat("vi-VN").format(received) : ""}
                      onChange={(event) => {
                        setReceivedAmount(event.target.value.replace(/\D/g, ""));
                        setError("");
                      }}
                      placeholder="Nhập số tiền"
                      aria-label="Số tiền khách đưa"
                    />
                    <span>VND</span>
                  </div>
                </label>
                <div className="cash-quick-heading">
                  <span>Mệnh giá nhanh</span>
                  <button
                    type="button"
                    onClick={() => setReceivedAmount(String(exactAmount))}
                    disabled={paymentBusy}
                  >
                    Đủ tiền · {money(exactAmount)}
                  </button>
                </div>
                <div className="cash-denominations">
                  {cashDenominations.map((amount) => (
                    <button
                      type="button"
                      key={amount}
                      onClick={() => setReceivedAmount(String(amount))}
                      disabled={paymentBusy}
                    >
                      {money(amount)}
                    </button>
                  ))}
                </div>
                <p className={`checkout-change ${cashAmountValid ? "is-valid" : ""}`}>
                  Tiền thừa: <strong>{cashAmountValid ? money(received - activeOrder.totalAmount) : "—"}</strong>
                </p>
              </div>
            )}
            {payment?.qrCodeUrl && (
              <div className="payment-qr-result">
                <img src={payment.qrCodeUrl} alt="Mã QR thanh toán" />
                <p>Nội dung chuyển khoản: <strong>{payment.transferContent}</strong></p>
                <p>Trạng thái: {payment.status}</p>
              </div>
            )}
            {payment?.id && paymentMethod === "BankTransfer" && !payment.qrCodeUrl && (
              <div className="table-operation-error" role="alert">
                Backend đã tạo giao dịch nhưng chưa trả về QR. Kiểm tra BankCode và BankAccount trong cấu hình backend rồi thử lại.
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
            {payment?.status === "Pending" && (
              <button
                className="secondary full"
                onClick={() => void cancelPendingPayment()}
                disabled={paymentBusy || cancelBusy}
              >
                {cancelBusy ? "Đang hủy…" : "Hủy thanh toán"}
              </button>
            )}
            {!payment?.id && (
              <button className="primary full" onClick={createPayment} disabled={paymentBusy || (paymentMethod === "Cash" && !cashAmountValid)}>
                {paymentBusy ? "Đang tạo…" : paymentMethod === "BankTransfer" ? "Tạo QR thanh toán" : "Tạo thanh toán"}
              </button>
            )}
            {payment?.qrCodeUrl && (
              <button className="secondary full" onClick={() => setPaymentOpen(false)}>
                Đóng sau khi chuyển khoản
              </button>
            )}
          </section>
        </div>
      )}
    </BackofficeLayout>
  );
}
