import { useEffect, useMemo, useState } from "react";
import { BackofficeLayout, PageTitle } from "../../components/shared/Ui";
import { getPaymentHistory } from "../../api/paymentApi";
import { getOrder } from "../../api/orderApi";
import { OrderInvoice } from "../../components/staff/payment/OrderInvoice";
import { PaymentStatus } from "../../components/staff/payment/PaymentStatus";

const money = (value) => `${new Intl.NumberFormat("vi-VN").format(value || 0)} ₫`;

export function StaffPayments() {
  const [payments, setPayments] = useState([]);
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPaymentHistory()
      .then(setPayments)
      .catch((requestError) => setError(requestError.response?.data?.message || "Không tải được lịch sử thanh toán."));
  }, []);

  const openInvoice = async (payment) => {
    setSelectedPayment(payment);
    setSelectedOrder(null);
    setDetailLoading(true);
    try {
      setSelectedOrder(await getOrder(payment.orderId));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không tải được chi tiết hóa đơn.");
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = useMemo(() => payments.filter((payment) => {
    const matchesQuery = `${payment.orderCode} ${payment.tableNumber}`.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi"));
    return matchesQuery && (method === "all" || payment.paymentMethod === method) && (status === "all" || payment.status === status);
  }), [method, payments, query, status]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedPayments = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [method, query, status]);

  return (
    <BackofficeLayout title="Thu ngân · Quản lý hóa đơn">
      <main className="page checkout-page">
        <PageTitle title="Quản lý hóa đơn" description="Lọc, xem chi tiết và in lại hóa đơn từ các giao dịch thực tế." />
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
          {filtered.length === 0 ? <div className="checkout-empty">Chưa có giao dịch phù hợp.</div> : paginatedPayments.map((payment) => (
            <div className="payment-history-row payment-history-clickable" key={payment.id} onClick={() => void openInvoice(payment)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") void openInvoice(payment); }}>
              <span>#{payment.id}</span><span>{payment.orderCode}<small>{payment.tableNumber}</small></span><strong>{money(payment.amount)}</strong><span>{payment.paymentMethod === "Cash" ? "Tiền mặt" : "Chuyển khoản"}</span><PaymentStatus status={payment.status} /><span>{new Date(payment.paidAt || payment.createdAt).toLocaleString("vi-VN")}</span>
            </div>
          ))}
          {filtered.length > 0 && (
            <div className="payment-pagination" aria-label="Phân trang hóa đơn">
              <span>
                Hiển thị {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, filtered.length)} / {filtered.length}
              </span>
              <div>
                <button
                  className="secondary"
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={currentPage === 1}
                >
                  Trước
                </button>
                <strong>Trang {currentPage} / {pageCount}</strong>
                <button
                  className="secondary"
                  type="button"
                  onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                  disabled={currentPage === pageCount}
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      {selectedPayment && (
        <div className="payment-modal-overlay" role="presentation">
          <section className="payment-modal invoice-detail-modal" role="dialog" aria-modal="true" aria-labelledby="invoice-detail-title">
            <div className="checkout-modal-heading">
              <div><p className="eyebrow">CHI TIẾT HÓA ĐƠN</p></div>
              <button className="table-operation-close" onClick={() => setSelectedPayment(null)} aria-label="Đóng">×</button>
            </div>
            {detailLoading ? <div className="checkout-empty">Đang tải chi tiết hóa đơn…</div> : selectedOrder ? (
              <>
                <OrderInvoice order={selectedOrder} />
                <div className="invoice-detail-payment">
                  <PaymentStatus status={selectedPayment.status} />
                  <span>{selectedPayment.paymentMethod === "Cash" ? "Tiền mặt" : "Chuyển khoản SePay"}</span>
                  {selectedPayment.transactionCode && <small>Mã giao dịch: {selectedPayment.transactionCode}</small>}
                </div>
                <div className="table-operation-actions">
                  <button className="secondary" onClick={() => window.print()}>In lại hóa đơn</button>
                  <button className="primary" onClick={() => setSelectedPayment(null)}>Đóng</button>
                </div>
              </>
            ) : <div className="checkout-empty">Không có dữ liệu chi tiết hóa đơn.</div>}
          </section>
        </div>
      )}
    </BackofficeLayout>
  );
}
