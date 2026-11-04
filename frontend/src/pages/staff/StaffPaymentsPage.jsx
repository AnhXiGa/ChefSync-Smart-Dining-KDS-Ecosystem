import {
  BackofficeLayout,
  PageTitle,
} from "../../components/shared/Ui";

export function StaffPaymentsPage() {
  return (
    <BackofficeLayout title="Thanh toán">
      <main className="page">
        <PageTitle
          title="Thanh toán & hóa đơn"
          description="Các khoản thanh toán được hiển thị sau khi có đơn hàng thực tế."
        />
        <div className="info-box">
          Chưa có dữ liệu thanh toán.
        </div>
      </main>
    </BackofficeLayout>
  );
}
