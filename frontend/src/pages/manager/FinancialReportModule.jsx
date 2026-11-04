import { useCallback, useEffect, useState } from "react";
import { PageTitle } from "../../components/shared/Ui";
import axiosClient from "../../api/axiosClient";
import "./FinancialReportModule.css";

function getLocalDateValue(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function getInitialFilters() {
  const today = getLocalDateValue(new Date());
  return { from: today, to: today, paymentMethod: "all" };
}

function toLocalDateStart(date) {
  return new Date(`${date}T00:00:00`).toISOString();
}

function toLocalDateEnd(date) {
  const endDate = new Date(`${date}T00:00:00`);
  endDate.setDate(endDate.getDate() + 1);
  return endDate.toISOString();
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatQuantity(value) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 3,
  }).format(value ?? 0);
}

function getErrorMessage(error) {
  return (
    error.response?.data?.message ??
    error.response?.data?.title ??
    "Không thể tải báo cáo tài chính."
  );
}

function getPaymentMethodLabel(method) {
  return method === "Cash" ? "Tiền mặt" : "Chuyển khoản / QR";
}

function downloadReport(report, filters) {
  const rows = [
    ["Báo cáo tài chính", `${filters.from} - ${filters.to}`],
    ["Chi nhánh", "Chi nhánh Nguyễn Huệ"],
    ["Doanh thu đã thanh toán", report.revenue],
    ["Đơn đã thanh toán", report.paidOrderCount],
    ["Tiền đơn đang chờ", report.pendingAmount],
    ["Đơn đang chờ", report.pendingOrderCount],
    ["Giá vốn nguyên liệu", report.ingredientCost],
    [],
    ["Phương thức thanh toán", "Số giao dịch", "Doanh thu"],
    ...report.paymentMethods.map((method) => [
      getPaymentMethodLabel(method.method),
      method.paymentCount,
      method.amount,
    ]),
    [],
    ["Món bán chạy", "Số phần", "Giá trị món"],
    ...report.topProducts.map((product) => [
      product.name,
      product.quantity,
      product.revenue,
    ]),
    [],
    ["Nguyên liệu tiêu hao", "Số lượng", "Đơn vị", "Giá vốn"],
    ...report.ingredientCosts.map((ingredient) => [
      ingredient.name,
      ingredient.quantity,
      ingredient.unit,
      ingredient.cost,
    ]),
  ];
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "bao-cao-tai-chinh.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function FinancialReportModule() {
  const [filters, setFilters] = useState(getInitialFilters);
  const [appliedFilters, setAppliedFilters] = useState(getInitialFilters);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    if (!appliedFilters.from || !appliedFilters.to || appliedFilters.from > appliedFilters.to) {
      setError("Vui lòng chọn khoảng ngày hợp lệ.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axiosClient.get("/api/reports/financial", {
        params: {
          from: toLocalDateStart(appliedFilters.from),
          to: toLocalDateEnd(appliedFilters.to),
          paymentMethod: appliedFilters.paymentMethod,
          utcOffsetMinutes: -new Date().getTimezoneOffset(),
        },
      });
      setReport(data);
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    // Load the report as external data whenever the applied filters change.
    // oxlint-disable-next-line react/set-state-in-effect
    void loadReport();
  }, [loadReport]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    if (!filters.from || !filters.to || filters.from > filters.to) {
      setError("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
      return;
    }
    setAppliedFilters({ ...filters });
  };

  const maxTrendAmount = Math.max(
    1,
    ...(report?.revenueTrend ?? []).map((point) => point.amount),
  );

  return (
    <>
      <PageTitle
        title="Báo cáo tài chính"
        description="Doanh thu, thanh toán, món bán chạy và giá vốn nguyên liệu."
        action={
          <div className="financial-report-actions">
            <button
              className="secondary"
              type="button"
              onClick={() => report && downloadReport(report, appliedFilters)}
              disabled={!report || loading}
            >
              Xuất Excel
            </button>
            <button
              className="primary"
              type="button"
              onClick={() => window.print()}
              disabled={!report || loading}
            >
              Xuất PDF
            </button>
          </div>
        }
      />

      <form className="financial-report-filters" onSubmit={applyFilters}>
        <label>
          Từ ngày
          <input
            type="date"
            value={filters.from}
            onChange={(event) => updateFilter("from", event.target.value)}
          />
        </label>
        <label>
          Đến ngày
          <input
            type="date"
            value={filters.to}
            onChange={(event) => updateFilter("to", event.target.value)}
          />
        </label>
        <label>
          Phương thức thanh toán
          <select
            value={filters.paymentMethod}
            onChange={(event) => updateFilter("paymentMethod", event.target.value)}
          >
            <option value="all">Tất cả phương thức</option>
            <option value="Cash">Tiền mặt</option>
            <option value="BankTransfer">Chuyển khoản / QR</option>
          </select>
        </label>
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "Đang tải..." : "Áp dụng"}
        </button>
      </form>

      <div className="financial-report-context">
        <span>Chi nhánh Nguyễn Huệ · dữ liệu một chi nhánh</span>
        <span>
          Kỳ báo cáo: {appliedFilters.from} – {appliedFilters.to}
        </span>
      </div>

      {error && <p className="login-error" role="alert">{error}</p>}

      {report && (
        <>
          <section className="financial-report-metrics" aria-label="Tổng quan tài chính">
            <article className="financial-report-metric">
              <span>Doanh thu đã thanh toán</span>
              <strong>{formatCurrency(report.revenue)}</strong>
              <small>Tổng thực thu trong kỳ</small>
            </article>
            <article className="financial-report-metric">
              <span>Đơn đã thanh toán</span>
              <strong>{formatQuantity(report.paidOrderCount)}</strong>
              <small>Trung bình {formatCurrency(report.averagePaidOrder)} / đơn</small>
            </article>
            <article className="financial-report-metric financial-report-pending">
              <span>Tiền đơn đang chờ</span>
              <strong>{formatCurrency(report.pendingAmount)}</strong>
              <small>{report.pendingOrderCount} đơn · chưa tính vào doanh thu</small>
            </article>
            <article className="financial-report-metric">
              <span>Giá vốn nguyên liệu</span>
              <strong>{formatCurrency(report.ingredientCost)}</strong>
              <small>Theo lượng xuất kho và đơn giá nguyên liệu hiện tại</small>
            </article>
          </section>

          <aside className="financial-report-info">
            Doanh thu tính theo khoản thanh toán đã xác nhận. Giá vốn ghi theo thời
            điểm xuất kho khi bếp hoàn tất món; đơn giá sử dụng là giá vốn hiện lưu
            trên nguyên liệu.
          </aside>

          <section className="financial-report-grid">
            <article className="data-card financial-report-panel">
              <div className="data-card-head">
                <div>
                  <strong>Doanh thu theo thời gian</strong>
                  <p>{formatCurrency(report.revenue)} · đơn đã thanh toán</p>
                </div>
              </div>
              {report.revenueTrend.length === 0 ? (
                <p className="financial-report-empty">Không có doanh thu trong kỳ này.</p>
              ) : (
                <div className="financial-report-chart" aria-label="Biểu đồ doanh thu">
                  {report.revenueTrend.map((point) => (
                    <div className="financial-report-bar-column" key={point.label}>
                      <strong>{formatCurrency(point.amount)}</strong>
                      <div
                        className="financial-report-bar"
                        style={{
                          height: `${Math.max(4, (point.amount / maxTrendAmount) * 100)}%`,
                        }}
                        title={`${point.label}: ${formatCurrency(point.amount)}`}
                      />
                      <span>{point.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="data-card financial-report-panel">
              <div className="data-card-head">
                <div>
                  <strong>Phương thức thanh toán</strong>
                  <p>Các khoản thu đã xác nhận</p>
                </div>
              </div>
              <div className="financial-report-methods">
                {report.paymentMethods.length === 0 && (
                  <p className="financial-report-empty">Chưa có khoản thanh toán.</p>
                )}
                {report.paymentMethods.map((method) => (
                  <div className="financial-report-method" key={method.method}>
                    <div>
                      <span>{getPaymentMethodLabel(method.method)}</span>
                      <strong>{formatCurrency(method.amount)}</strong>
                    </div>
                    <div className="financial-report-progress">
                      <i
                        style={{
                          width: `${report.revenue
                            ? (method.amount / report.revenue) * 100
                            : 0}%`,
                        }}
                      />
                    </div>
                    <small>{method.paymentCount} khoản thanh toán</small>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="financial-report-grid">
            <article className="data-card financial-report-panel">
              <div className="data-card-head">
                <div>
                  <strong>Món bán chạy</strong>
                  <p>Đơn đã thanh toán · giá trị món trước giảm giá và thuế</p>
                </div>
              </div>
              <div className="financial-report-table-wrap">
                <table className="financial-report-table">
                  <thead><tr><th>Món</th><th>Số phần</th><th>Giá trị món</th></tr></thead>
                  <tbody>
                    {report.topProducts.map((product) => (
                      <tr key={product.name}>
                        <td>{product.name}</td>
                        <td>{formatQuantity(product.quantity)}</td>
                        <td>{formatCurrency(product.revenue)}</td>
                      </tr>
                    ))}
                    {report.topProducts.length === 0 && (
                      <tr><td colSpan="3" className="financial-report-empty">Chưa có món đã thanh toán.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="data-card financial-report-panel">
              <div className="data-card-head">
                <div>
                  <strong>Tiêu hao &amp; giá vốn nguyên liệu</strong>
                  <p>Theo lịch sử biến động kho trong kỳ</p>
                </div>
              </div>
              <div className="financial-report-table-wrap">
                <table className="financial-report-table">
                  <thead><tr><th>Nguyên liệu</th><th>Tiêu hao</th><th>Giá vốn</th></tr></thead>
                  <tbody>
                    {report.ingredientCosts.map((ingredient) => (
                      <tr key={`${ingredient.name}-${ingredient.unit}`}>
                        <td>{ingredient.name}</td>
                        <td>{formatQuantity(ingredient.quantity)} {ingredient.unit}</td>
                        <td>{formatCurrency(ingredient.cost)}</td>
                      </tr>
                    ))}
                    {report.ingredientCosts.length === 0 && (
                      <tr><td colSpan="3" className="financial-report-empty">Chưa có dữ liệu xuất kho trong kỳ.</td></tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th colSpan="2">Tổng giá vốn theo BOM</th>
                      <th>{formatCurrency(report.ingredientCost)}</th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </article>
          </section>
        </>
      )}
    </>
  );
}
