const labels = {
  Pending: "Đang chờ thanh toán",
  Paid: "Đã thanh toán",
  Failed: "Thanh toán thất bại",
  Cancelled: "Đã hủy",
};

export function PaymentStatus({ status }) {
  return (
    <span className={`payment-status payment-status-${(status || "Pending").toLowerCase()}`}>
      {labels[status] || status || "Chưa thanh toán"}
    </span>
  );
}
