import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { BackofficeLayout, PageTitle } from "../../components/shared/Ui";
import { usePosOrderChanges } from "../../hooks/usePosOrderChanges";
import "./ManagerTablesPage.css";

const statuses = [
  ["Available", "Trống"],
  ["Occupied", "Có khách"],
  ["Reserved", "Đã đặt"],
  ["Maintenance", "Bảo trì"],
];

const appUrl = (token) => {
  const base = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, "");
  return `${base}/customer?token=${encodeURIComponent(token)}`;
};

const qrImage = (url) => `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=12&data=${encodeURIComponent(url)}`;

function messageOf(error, fallback) {
  return error.response?.data?.message || fallback;
}

export function ManagerTablesPage() {
  const [tables, setTables] = useState([]);
  const [form, setForm] = useState({ tableNumber: "", capacity: 4 });
  const [editing, setEditing] = useState(null);
  const [selectedQr, setSelectedQr] = useState(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadTables = useCallback(async () => {
    try {
      const response = await axiosClient.get("/api/tables");
      setTables(response.data);
      setError("");
    } catch (requestError) {
      setError(messageOf(requestError, "Không tải được danh sách bàn. Hãy kiểm tra backend và kết nối cơ sở dữ liệu."));
    }
  }, []);
  const handleOrdersChanged = useCallback(() => {
    void loadTables();
  }, [loadTables]);
  const handleHubError = useCallback((connectionError) => {
    setError(messageOf(connectionError, "Mất kết nối cập nhật đơn realtime."));
  }, []);
  usePosOrderChanges(handleOrdersChanged, handleHubError);

  // This effect synchronizes the page with the tables API on entry.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => { void loadTables(); }, [loadTables]);

  const filteredTables = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi");
    return tables.filter((table) => table.tableNumber.toLocaleLowerCase("vi").includes(normalized));
  }, [tables, query]);

  const submitTable = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (editing) {
        await axiosClient.put(`/api/tables/${editing.id}`, form);
      } else {
        await axiosClient.post("/api/tables", form);
      }
      setForm({ tableNumber: "", capacity: 4 });
      setEditing(null);
      await loadTables();
    } catch (requestError) {
      setError(messageOf(requestError, "Không thể lưu thông tin bàn."));
    } finally {
      setBusy(false);
    }
  };

  const editTable = (table) => {
    setEditing(table);
    setForm({ tableNumber: table.tableNumber, capacity: table.capacity });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateStatus = async (tableId, status) => {
    try {
      await axiosClient.patch(`/api/tables/${tableId}/status`, { status });
      await loadTables();
    } catch (requestError) {
      setError(messageOf(requestError, "Không thể cập nhật trạng thái bàn."));
    }
  };

  const deleteTable = async (table) => {
    if (!window.confirm(`Xóa bàn ${table.tableNumber}? Thao tác này không thể hoàn tác.`)) return;
    try {
      await axiosClient.delete(`/api/tables/${table.id}`);
      await loadTables();
    } catch (requestError) {
      setError(messageOf(requestError, "Không thể xóa bàn."));
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ tableNumber: "", capacity: 4 });
  };

  return (
    <BackofficeLayout role="manager">
      <main className="page manager-tables-page">
        <PageTitle
          eyebrow="QUẢN TRỊ NHÀ HÀNG"
          title="Quản lý bàn & mã QR"
          description="Mỗi bàn có một mã QR cố định. Khách quét mã để mở thực đơn và gửi món đến đúng bàn."
        />

        {error && <div className="table-error" role="alert">{error}<button onClick={() => setError("")} aria-label="Đóng">×</button></div>}

        <section className="table-manager-card">
          <div className="table-manager-card-heading">
            <div>
              <h2>{editing ? `Chỉnh sửa bàn ${editing.tableNumber}` : "Thêm bàn mới"}</h2>
              <p>Mã QR được tạo một lần khi thêm bàn và giữ nguyên khi sửa tên hoặc sức chứa.</p>
            </div>
          </div>
          <form className="table-manager-form" onSubmit={submitTable}>
            <label>Tên / số bàn
              <input required maxLength={20} value={form.tableNumber} onChange={(event) => setForm({ ...form, tableNumber: event.target.value })} placeholder="Ví dụ: Bàn 01" />
            </label>
            <label>Sức chứa
              <input required type="number" min="1" max="100" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })} />
            </label>
            <button className="table-primary-button" disabled={busy}>{busy ? "Đang lưu…" : editing ? "Lưu thay đổi" : "+ Thêm bàn"}</button>
            {editing && <button type="button" className="table-secondary-button" onClick={cancelEdit}>Hủy</button>}
          </form>
        </section>

        <section className="table-manager-card table-list-card">
          <div className="table-manager-card-heading table-list-heading">
            <div><h2>Danh sách bàn <span className="table-count">{tables.length}</span></h2><p>Mã QR tiếp tục hoạt động sau khi bàn đổi trạng thái.</p></div>
            <input className="table-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm bàn…" aria-label="Tìm bàn" />
          </div>
          {filteredTables.length === 0 ? (
            <div className="table-empty">{tables.length ? "Không tìm thấy bàn phù hợp." : "Chưa có bàn nào. Thêm bàn để tạo mã QR."}</div>
          ) : (
            <div className="managed-table-list">
              <div className="managed-table-row managed-table-header"><span>BÀN</span><span>SỨC CHỨA</span><span>TRẠNG THÁI</span><span>MÃ QR</span><span>THAO TÁC</span></div>
              {filteredTables.map((table) => (
                <div className="managed-table-row" key={table.id}>
                  <strong>{table.tableNumber}</strong>
                  <span>{table.capacity} người</span>
                  <select value={table.status} onChange={(event) => updateStatus(table.id, event.target.value)} aria-label={`Trạng thái ${table.tableNumber}`}>
                    {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <button className="table-qr-button" onClick={() => setSelectedQr(table)}>Xem / in QR</button>
                  <div className="table-row-actions">
                    <button onClick={() => editTable(table)}>Sửa</button>
                    <button className="table-delete-button" onClick={() => deleteTable(table)}>Xóa</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {selectedQr && (
        <div className="table-qr-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedQr(null); }}>
          <section className="table-qr-dialog" role="dialog" aria-modal="true" aria-labelledby="table-qr-title">
            <button className="table-qr-close" onClick={() => setSelectedQr(null)} aria-label="Đóng">×</button>
            <div className="print-qr-content">
              <p className="table-qr-eyebrow">SMART DINING</p>
              <h2 id="table-qr-title">Mã QR · {selectedQr.tableNumber}</h2>
              <p>Quét mã để xem thực đơn và gọi món tại bàn.</p>
              <img className="table-qr-image" src={qrImage(appUrl(selectedQr.qrToken))} alt={`Mã QR cho ${selectedQr.tableNumber}`} />
              <small>{appUrl(selectedQr.qrToken)}</small>
            </div>
            <div className="table-qr-actions"><a href={appUrl(selectedQr.qrToken)} target="_blank" rel="noreferrer">Mở trang khách</a><button className="table-primary-button" onClick={() => window.print()}>In mã QR</button></div>
          </section>
        </div>
      )}
    </BackofficeLayout>
  );
}
