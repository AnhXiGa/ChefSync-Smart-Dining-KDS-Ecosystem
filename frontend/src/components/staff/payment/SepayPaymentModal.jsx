import { useEffect, useState } from "react";
import { createPayment } from "../../../api/paymentApi";
import { usePaymentStatus } from "../../../hooks/usePaymentStatus";
import { PaymentStatus } from "./PaymentStatus";

const money = (value) => `${new Intl.NumberFormat("vi-VN").format(value || 0)} ₫`;

export function SepayPaymentModal({ order, onClose, onSuccess }) {
  const [paymentId, setPaymentId] = useState(null);
  const [payment, setPayment] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const statusResult = usePaymentStatus(paymentId, Boolean(paymentId));

  useEffect(() => {
    let active = true;
    createPayment({ orderId: order.id, paymentMethod: "BankTransfer" })
      .then((created) => {
        if (!active) return;
        setPayment(created);
        setPaymentId(created.id);
        setError("");
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "Không thể tạo QR thanh toán.");
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => { active = false; };
  }, [order.id]);

  useEffect(() => {
    if (!statusResult.payment) return;
    setPayment(statusResult.payment);
    if (statusResult.payment.status === "Paid") void onSuccess(statusResult.payment);
  }, [onSuccess, statusResult.payment]);

  return (
    <div className="payment-modal-overlay" role="presentation">
      <section className="payment-modal sepay-modal" role="dialog" aria-modal="true" aria-labelledby="sepay-title">
        <div className="checkout-modal-heading">
          <div><p className="eyebrow">SEPAY QR</p><h2 id="sepay-title">Chuyển khoản {order.orderCode}</h2></div>
          <button className="table-operation-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>
        {busy && <p>Đang tạo thông tin QR thanh toán…</p>}
        {error && <div className="table-operation-error" role="alert">{error}</div>}
        {payment && (
          <>
            <div className="sepay-amount">{money(payment.amount)}</div>
            {payment.qrCodeUrl && <img className="sepay-qr" src={payment.qrCodeUrl} alt="QR thanh toán SePay" />}
            <PaymentStatus status={payment.status} />
            {payment.transferContent && <p className="sepay-content">Nội dung: <strong>{payment.transferContent}</strong></p>}
            <p className="sepay-waiting">
              {payment.status === "Pending" ? "Đang chờ backend xác nhận giao dịch từ SePay…" : "Trạng thái được xác nhận bởi backend."}
            </p>
          </>
        )}
        <button className="secondary full" onClick={onClose}>Đóng</button>
      </section>
    </div>
  );
}
