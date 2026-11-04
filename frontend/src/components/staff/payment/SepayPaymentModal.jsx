import { useEffect, useRef, useState } from "react";
import { cancelPayment, createPayment, getPayment } from "../../../api/paymentApi";
import { usePaymentStatus } from "../../../hooks/usePaymentStatus";
import { PaymentStatus } from "./PaymentStatus";

const money = (value) => `${new Intl.NumberFormat("vi-VN").format(value || 0)} ₫`;

export function SepayPaymentModal({ order, onClose, onSuccess }) {
  const [paymentId, setPaymentId] = useState(null);
  const [payment, setPayment] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const paymentRequestRef = useRef(null);
  const statusResult = usePaymentStatus(paymentId, Boolean(paymentId));

  useEffect(() => {
    if (!paymentRequestRef.current) {
      paymentRequestRef.current = createPayment({
        orderId: order.id,
        paymentMethod: "BankTransfer",
      }).then(async (created) => (
        created.qrCodeUrl ? created : getPayment(created.id)
      ));
    }

    paymentRequestRef.current
      .then(async (created) => {
        const current = created.qrCodeUrl ? created : await getPayment(created.id);
        setPayment(current);
        setPaymentId(current.id);
        setError(current.status === "Paid"
          ? "Đơn hàng này đã được thanh toán."
          : !current.qrCodeUrl
            ? "Không nhận được thông tin QR từ máy chủ."
            : "");
      })
      .catch((requestError) => {
        setError(
          requestError.code === "ECONNABORTED"
            ? "Hết thời gian tạo QR. Vui lòng kiểm tra backend rồi thử lại."
            : requestError.response?.data?.message || "Không thể tạo QR thanh toán.",
        );
      })
      .finally(() => {
        setBusy(false);
      });
  }, [order.id]);

  useEffect(() => {
    if (!statusResult.payment) return;
    setPayment(statusResult.payment);
    if (statusResult.payment.status === "Paid") void onSuccess(statusResult.payment);
  }, [onSuccess, statusResult.payment]);

  const cancelQrAndSwitchToCash = async () => {
    if (!payment?.id || payment.status !== "Pending") {
      onClose();
      return;
    }

    setCancelling(true);
    setError("");
    try {
      await cancelPayment(payment.id);
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể hủy giao dịch QR.");
    } finally {
      setCancelling(false);
    }
  };

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
              {payment.status === "Pending" ? "Đang chờ  xác nhận giao dịch từ " : "Trạng thái được xác nhận hệ thống."}
            </p>
          </>
        )}
        <div className="table-operation-actions">
          <button className="secondary" onClick={onClose} disabled={cancelling}>
            Đóng
          </button>
          <button
            className="primary"
            onClick={() => void cancelQrAndSwitchToCash()}
            disabled={busy || cancelling || payment?.status !== "Pending"}
          >
            {cancelling ? "Đang hủy…" : "Hủy QR, chuyển tiền mặt"}
          </button>
        </div>
      </section>
    </div>
  );
}
