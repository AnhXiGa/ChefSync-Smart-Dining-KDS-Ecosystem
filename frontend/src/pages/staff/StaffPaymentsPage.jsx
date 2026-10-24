import {
  BackofficeLayout,
  PageTitle,
  StatusBadge,
} from "../../components/shared/Ui";
import { invoiceItems, invoices } from "../../data/paymentsData";
import { formatMoney } from "../../data/posData";

export function StaffPaymentsPage() {
  return (
    <BackofficeLayout title="Thanh Tâm · Thu ngân">
      <main className="page">
        <PageTitle
          title="Thanh toán & hóa đơn"
          description="Ca trưa · Thu ngân: Thanh Tâm · Kiểm tra khoản thu trước khi xác nhận"
          action={<button className="secondary">Lịch sử hóa đơn</button>}
        />
        <div className="payment-layout">
          <section className="invoice-list">
            <h2>Cần thanh toán · 5</h2>
            <div className="search">
              <input placeholder="Tìm bàn, mã đơn..." />
            </div>
            {invoices.map(([table, amount, hint], index) => (
              <button
                className={`invoice-item ${index === 0 ? "active" : ""}`}
                key={table}
              >
                <span>
                  {table}
                  <small>{hint}</small>
                </span>
                <b>{formatMoney(amount)}</b>
              </button>
            ))}
            <div className="info-box">
              ⓘ Trạng thái khoản thu được liên kết với trạng thái phục vụ của
              đơn.
            </div>
          </section>
          <section className="invoice-detail">
            <h2>Hóa đơn Bàn 05</h2>
            <p>#AN-1410-005 · Mở 12:20 · Yêu cầu lúc 13:05</p>
            <div className="summary-badges">
              <StatusBadge>Đơn: Hoàn tất</StatusBadge>
              <StatusBadge kind="orange">Chưa thanh toán</StatusBadge>
            </div>
            {invoiceItems.map(([name, price]) => (
              <div className="invoice-row" key={name}>
                <span>{name}</span>
                <b>{formatMoney(price)}</b>
              </div>
            ))}
            <div className="calculation">
              <div>
                <span>Tạm tính</span>
                <b>{formatMoney(275000)}</b>
              </div>
              <div>
                <span>Giảm giá 10%</span>
                <b>-27.500 ₫</b>
              </div>
              <div>
                <span>Thuế GTGT 8%</span>
                <b>19.800 ₫</b>
              </div>
              <div className="grand">
                <span>Tổng thanh toán</span>
                <strong>267.300 ₫</strong>
              </div>
            </div>
            <div className="info-box">
              ⓘ Giá món lưu theo đơn đã đặt. Thuế = 247.500 ₫ × 8% = 19.800 ₫.
            </div>
            <button className="secondary full">
              ▣ &nbsp; In hóa đơn tạm tính
            </button>
          </section>
          <section className="payment-box">
            <h2>Khoản thanh toán</h2>
            <StatusBadge kind="orange">Chờ nhân viên xác nhận</StatusBadge>
            <div className="payment-methods">
              <button className="active">Tiền mặt</button>
              <button>Chuyển khoản</button>
              <button>QR</button>
            </div>
            <label>
              Số tiền cần thu
              <input value="267.300 ₫" readOnly />
            </label>
            <div className="qr-code">
              ▦<br />▦
            </div>
            <div className="payment-rows">
              <div>
                <span>Khoản #TT-005-01</span>
                <b>QR</b>
              </div>
              <div>
                <span>Số tiền</span>
                <b>267.300 ₫</b>
              </div>
              <div>
                <span>Đã xác nhận thu</span>
                <b>0 ₫</b>
              </div>
              <div className="due">
                <span>Còn phải thu</span>
                <strong>267.300 ₫</strong>
              </div>
            </div>
            <button className="secondary full">
              ＋ &nbsp; Thêm khoản thanh toán
            </button>
          </section>
        </div>
      </main>
    </BackofficeLayout>
  );
}
