import { Link } from "react-router-dom";
import {
  BackofficeLayout,
  PageTitle,
  StatusBadge,
} from "../../components/shared/Ui";
import { formatMoney } from "../../data/posData";

export function ManagerDashboardPage() {
  return (
    <BackofficeLayout role="manager" title="Minh Anh · Quản lý">
      <main className="page manager-page">
        <PageTitle
          title="Tổng quan vận hành"
          description="Ca trưa · Cập nhật lần cuối lúc 13:05"
          action={<button className="primary">＋ Tạo thông báo</button>}
        />
        <div className="stats">
          <div className="stat-card">
            <span>Doanh thu hôm nay</span>
            <strong>{formatMoney(12500000)}</strong>
            <small>↑ 12,5% so với hôm qua</small>
          </div>
          <div className="stat-card">
            <span>Đơn đang phục vụ</span>
            <strong>18</strong>
            <small>8 bàn có khách mới</small>
          </div>
          <div className="stat-card">
            <span>Chờ bếp xử lý</span>
            <strong>07</strong>
            <small>2 đơn quá 15 phút</small>
          </div>
          <div className="stat-card">
            <span>Khoản chờ thu</span>
            <strong>{formatMoney(267300)}</strong>
            <small>5 hóa đơn cần xác nhận</small>
          </div>
        </div>
        <div className="manager-grid">
          <section className="detail-card">
            <h2>Trạng thái khu vực</h2>
            <p>Theo dõi nhanh toàn bộ nhà hàng trong ca hiện tại.</p>
            <div className="manager-stat-row">
              <span>Sảnh chính</span>
              <StatusBadge>12 / 12 bàn hoạt động</StatusBadge>
            </div>
            <div className="manager-stat-row">
              <span>Sân vườn</span>
              <StatusBadge kind="blue">8 / 12 bàn hoạt động</StatusBadge>
            </div>
            <div className="manager-stat-row">
              <span>Bếp KDS</span>
              <StatusBadge kind="orange">7 đơn đang chờ</StatusBadge>
            </div>
            <Link className="primary manager-link" to="/staff/tables">
              Mở màn hình vận hành
            </Link>
          </section>
          <section className="detail-card">
            <h2>Truy cập nhanh</h2>
            <div className="quick-links">
              <Link to="/staff/tables">▦ Quản lý bàn</Link>
              <Link to="/kitchen">♨ Điều phối bếp</Link>
              <Link to="/staff/payments">▣ Đối soát thanh toán</Link>
              <Link to="/customer/5">⌁ Xem giao diện khách QR</Link>
            </div>
          </section>
        </div>
      </main>
    </BackofficeLayout>
  );
}
