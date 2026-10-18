import { useState } from "react";
import {
  BackofficeLayout,
  PageTitle,
  StatusBadge,
} from "../../components/shared/Ui";
import { adminModules } from "../../data/adminData";

export function AdminModulePage({ module }) {
  const config = adminModules[module] || adminModules.menu;
  const [query, setQuery] = useState("");
  const rows = config.rows.filter((row) =>
    row.join(" ").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <BackofficeLayout role="manager" title="Minh Anh · Quản lý">
      <main className="page admin-module-page">
        <PageTitle
          title={config.title}
          description={config.description}
          action={<button className="primary">{config.action}</button>}
        />
        <div className="module-toolbar">
          <div className="search">
            ⌕{" "}
            <input
              placeholder="Tìm kiếm..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <button className="secondary">Bộ lọc</button>
          <button className="secondary">Xuất báo cáo</button>
        </div>
        <section className="data-card">
          <div className="data-card-head">
            <div>
              <strong>{rows.length} bản ghi</strong>
              <p>Dữ liệu cập nhật theo ca trưa hôm nay</p>
            </div>
            <StatusBadge>
              {module === "expenses" ? "Theo dõi ngân sách" : "Đang đồng bộ"}
            </StatusBadge>
          </div>
          <div className="data-table">
            <div className="data-row data-header">
              {config.columns.map((column) => (
                <span key={column}>{column}</span>
              ))}
            </div>
            {rows.map((row, index) => (
              <div className="data-row" key={`${row[0]}-${index}`}>
                {row.map((cell, cellIndex) => (
                  <span key={`${cell}-${cellIndex}`}>
                    {cellIndex === row.length - 1 ? (
                      <StatusBadge
                        kind={
                          String(cell).includes("Sắp") ||
                          String(cell).includes("Chờ")
                            ? "orange"
                            : "green"
                        }
                      >
                        {cell}
                      </StatusBadge>
                    ) : (
                      cell
                    )}
                  </span>
                ))}
                <button className="row-action">⋮</button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </BackofficeLayout>
  );
}
