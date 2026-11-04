import { useEffect, useMemo, useState } from "react";
import { BackofficeLayout, PageTitle } from "../../components/shared/Ui";
import { getPaymentHistory } from "../../api/paymentApi";
import { PaymentStatus } from "../../components/staff/payment/PaymentStatus";

const money = (value) => `${new Intl.NumberFormat("vi-VN").format(value || 0)} ₫`;

export function StaffPayments() {
  const [payments, setPayments] = useState([]);
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("all");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    getPaymentHistory()
      .then(setPayments)
      .catch((requestError) => setError(requestError.response?.data?.message || "Không tải được lịch sử thanh toán."));
  }, []);

  const filtered = useMemo(() => payments.filter((payment) => {
    const matchesQuery = `${payment.orderCode} ${payment.tableNumber}`.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi"));
    return matchesQuery && (method === "all" || payment.paymentMethod === method) && (status === "all" || payment.status === status);
  }), [method, payments, query, status]);

  return (
    <BackofficeLayout title="Thu ngân · Lịch sử thanh toán">
      <main className="page checkout-page">
        <PageTitle title="Lịch sử thanh toán" description="Dữ liệu giao dịch thực tế từ backend." />
        {error && <div className="table-operation-error" role="alert">{error}</div>}
        <div className="payment-history-toolbar">
          <input className="checkout-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã order hoặc số bàn…" />
          <select className="checkout-filter" value={method} onChange={(event) => setMethod(event.target.value)}>
            <option value="all">Tất cả phương thức</option><option value="Cash">Tiền mặt</option><option value="BankTransfer">Chuyển khoản</option>
          </select>
          <select className="checkout-filter" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Tất cả trạng thái</option><option value="Pending">Pending</option><option value="Paid">Paid</option><option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div className="payment-history-table">
          <div className="payment-history-row payment-history-header"><span>Payment</span><span>Order / Bàn</span><span>Số tiền</span><span>Phương thức</span><span>Trạng thái</span><span>Thời gian</span></div>
          {filtered.length === 0 ? <div className="checkout-empty">Chưa có giao dịch phù hợp.</div> : filtered.map((payment) => (
            <div className="payment-history-row" key={payment.id}>
              <span>#{payment.id}</span><span>{payment.orderCode}<small>{payment.tableNumber}</small></span><strong>{money(payment.amount)}</strong><span>{payment.paymentMethod === "Cash" ? "Tiền mặt" : "Chuyển khoản"}</span><PaymentStatus status={payment.status} /><span>{new Date(payment.paidAt || payment.createdAt).toLocaleString("vi-VN")}</span>
            </div>
          ))}
        </div>
      </main>
    </BackofficeLayout>
  );
}
