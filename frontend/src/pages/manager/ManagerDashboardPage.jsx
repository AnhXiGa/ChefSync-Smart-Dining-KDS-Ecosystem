import { Link } from "react-router-dom";
import {
  BackofficeLayout,
  PageTitle,
  StatusBadge,
} from "../../components/shared/Ui";

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
            <strong>—</strong>
            <small>Chưa có dữ liệu</small>
          </div>
          <div className="stat-card">
            <span>Đơn đang phục vụ</span>
            <strong>—</strong>
            <small>Chưa có dữ liệu</small>
          </div>
          <div className="stat-card">
            <span>Chờ bếp xử lý</span>
            <strong>—</strong>
            <small>Chưa có dữ liệu</small>
          </div>
          <div className="stat-card">
            <span>Khoản chờ thu</span>
            <strong>—</strong>
            <small>Chưa có dữ liệu</small>
          </div>
        </div>
        <div className="manager-grid">
          <section className="detail-card">
            <h2>Trạng thái khu vực</h2>
            <p>Theo dõi nhanh toàn bộ nhà hàng trong ca hiện tại.</p>
            <div className="manager-stat-row">
              <span>Sảnh chính</span>
              <StatusBadge>Chưa có dữ liệu</StatusBadge>
            </div>
            <div className="manager-stat-row">
              <span>Sân vườn</span>
              <StatusBadge kind="blue">Chưa có dữ liệu</StatusBadge>
            </div>
            <div className="manager-stat-row">
              <span>Bếp KDS</span>
              <StatusBadge kind="orange">Chưa có dữ liệu</StatusBadge>
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
            </div>
          </section>
        </div>
      </main>
    </BackofficeLayout>
  );
}
