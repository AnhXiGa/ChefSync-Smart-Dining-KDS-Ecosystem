import { useState } from "react";
import { confirmCashPayment, createPayment } from "../../../api/paymentApi";

const money = (value) => `${new Intl.NumberFormat("vi-VN").format(value || 0)} ₫`;
const cashDenominations = [50000, 100000, 200000, 500000];

export function CashPaymentModal({ order, existingPayment, onClose, onSuccess }) {
  const [receivedAmount, setReceivedAmount] = useState(
    existingPayment?.receivedAmount?.toString() || "",
  );
  const [payment, setPayment] = useState(existingPayment);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const received = Number(receivedAmount);
  const valid = Number.isFinite(received) && received >= order.totalAmount;
  const exactAmount = Math.ceil(order.totalAmount / 1000) * 1000;

  const chooseAmount = (amount) => {
    setReceivedAmount(String(amount));
    setError("");
  };

  const handleAmountChange = (event) => {
    const digits = event.target.value.replace(/\D/g, "");
    setReceivedAmount(digits);
    setError("");
  };

  const submit = async () => {
    if (!valid) {
      setError("Số tiền khách đưa phải lớn hơn hoặc bằng tổng tiền.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const currentPayment = payment || await createPayment({
        orderId: order.id,
        paymentMethod: "Cash",
        receivedAmount: received,
      });
      setPayment(currentPayment);
      const paid = await confirmCashPayment(currentPayment.id);
      await onSuccess(paid);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể hoàn tất thanh toán tiền mặt.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="payment-modal-overlay" role="presentation">
      <section className="payment-modal" role="dialog" aria-modal="true" aria-labelledby="cash-payment-title">
        <div className="checkout-modal-heading">
          <div><p className="eyebrow">TIỀN MẶT</p><h2 id="cash-payment-title">Thanh toán {order.orderCode}</h2></div>
          <button className="table-operation-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>
        <div className="cash-total-card">
          <span>Tổng tiền cần thu</span>
          <strong>{money(order.totalAmount)}</strong>
        </div>
        <label className="table-operation-field">Số tiền khách đưa
          <div className="cash-amount-input">
            <input
              type="text"
              inputMode="numeric"
              min={order.totalAmount}
              value={receivedAmount ? new Intl.NumberFormat("vi-VN").format(received) : ""}
              onChange={handleAmountChange}
              placeholder="Nhập số tiền"
              autoFocus
              disabled={Boolean(existingPayment)}
              aria-label="Số tiền khách đưa"
            />
            <span>VND</span>
          </div>
        </label>
        <div className="cash-quick-heading">
          <span>Chọn nhanh mệnh giá</span>
          <button type="button" onClick={() => chooseAmount(exactAmount)} disabled={Boolean(existingPayment)}>
            Đủ tiền · {money(exactAmount)}
          </button>
        </div>
        <div className="cash-denominations">
          {cashDenominations.map((amount) => (
            <button
              type="button"
              key={amount}
              onClick={() => chooseAmount(amount)}
              disabled={Boolean(existingPayment)}
            >
              {money(amount)}
            </button>
          ))}
        </div>
        <p className="checkout-change">Tiền thừa: <strong>{valid ? money(received - order.totalAmount) : "—"}</strong></p>
        {payment && <p className="payment-success">Đã nhận giao dịch #{payment.id}.</p>}
        {error && <div className="table-operation-error" role="alert">{error}</div>}
        <div className="table-operation-actions">
          <button className="secondary" onClick={onClose}>Đóng</button>
          <button className="primary" onClick={submit} disabled={busy || Boolean(payment)}>
            {busy ? "Đang xác nhận…" : "Xác nhận thanh toán"}
          </button>
        </div>
      </section>
    </div>
  );
}
