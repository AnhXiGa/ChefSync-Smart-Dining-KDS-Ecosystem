import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { BackofficeLayout, PageTitle } from "../../components/shared/Ui";
import { getPaymentByOrder } from "../../api/paymentApi";
import {
  TableCard,
  TableDetails,
} from "../../components/staff/TableComponents";

const tableStatuses = [
  ["Available", "Trống"],
  ["Occupied", "Có khách"],
  ["Reserved", "Đã đặt"],
  ["Maintenance", "Bảo trì"],
];

export function StaffTablesPage() {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [reservationDetails, setReservationDetails] = useState({});
  const [savedReservations, setSavedReservations] = useState({});
  const [editingReservations, setEditingReservations] = useState({});
  const [error, setError] = useState("");
  const loadTables = useCallback(async () => {
    try {
      const [{ data }, { data: orders }] = await Promise.all([
        axiosClient.get("/api/tables"),
        axiosClient.get("/api/orders"),
      ]);
      const activeCandidates = orders.filter(
        (order) => !["Completed", "Cancelled"].includes(order.status),
      );
      const paymentEntries = await Promise.all(
        activeCandidates.map(async (order) => [
          order.id,
          await getPaymentByOrder(order.id).catch(() => null),
        ]),
      );
      const payments = Object.fromEntries(paymentEntries);
      const mappedTables = data.map((table) => ({
        ...table,
        apiStatus: table.status,
        activeOrder: orders.find(
          (order) =>
            order.tableId === table.id &&
            !["Completed", "Cancelled"].includes(order.status) &&
            payments[order.id]?.status !== "Paid",
        ),
      })).map((table) => ({
        ...table,
        status: table.activeOrder && table.apiStatus !== "Maintenance"
          ? "occupied"
          : {
            Available: "empty",
            Occupied: "occupied",
            Reserved: "reserved",
            Maintenance: "maintenance",
          }[table.apiStatus] || "empty",
      }));
      // oxlint-disable-next-line react/set-state-in-effect
      setTables(mappedTables);
      // oxlint-disable-next-line react/set-state-in-effect
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không tải được danh sách bàn.");
    }
  }, []);
  useEffect(() => {
    void loadTables();
    const intervalId = window.setInterval(() => {
      void loadTables();
    }, 5000);
    const handleFocus = () => void loadTables();
    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadTables]);
  const stats = [
    [
      "Trống",
      tables.filter((table) => table.status === "empty").length,
      "Có thể nhận khách",
    ],
    [
      "Có khách",
      tables.filter((table) => table.status === "occupied").length,
      "Đang phục vụ",
    ],
    [
      "Đã đặt",
      tables.filter((table) => table.status === "reserved").length,
      "Đã có lịch đặt bàn",
    ],
    [
      "Bảo trì",
      tables.filter((table) => table.status === "maintenance").length,
      "Tạm ngưng sử dụng",
    ],
  ];
  const activeTableId = selectedTable ?? tables[0]?.id;
  const openOrder = (id = activeTableId) => {
    if (id) navigate(`/staff/order/${id}`);
  };
  const updateTableStatus = async (tableId, status) => {
    try {
      await axiosClient.patch(`/api/tables/${tableId}/status`, { status });
      await loadTables();
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể cập nhật trạng thái bàn.");
    }
  };
  const updateReservationDetails = (field, value) => {
    if (!activeTableId) return;
    setReservationDetails((current) => ({
      ...current,
      [activeTableId]: {
        ...current[activeTableId],
        [field]: value,
      },
    }));
  };
  const saveReservation = () => {
    if (!activeTableId) return;
    setSavedReservations((current) => ({
      ...current,
      [activeTableId]: true,
    }));
    setEditingReservations((current) => ({
      ...current,
      [activeTableId]: false,
    }));
  };
  const editReservation = () => {
    if (!activeTableId) return;
    setEditingReservations((current) => ({
      ...current,
      [activeTableId]: true,
    }));
  };
  const activeTable = tables.find((table) => table.id === activeTableId);
  return (
    <BackofficeLayout title="Minh Anh · Nhân viên">
      <main className="page">
        <PageTitle
          title="Quản lý bàn"
          description="Danh sách bàn được đồng bộ từ hệ thống nhà hàng"
        />
        <div className="stats">
          {stats.map(([label, value, hint]) => (
            <div className="stat-card" key={label}>
              <span>{label}</span>
              <strong>{String(value).padStart(2, "0")}</strong>
              <small>{hint}</small>
            </div>
          ))}
        </div>
        <div className="workspace">
          <section>
            <div className="tabs">
              <button className="tab selected">Tất cả bàn · {tables.length}</button>
            </div>
            {error && <div role="alert">{error}</div>}
            <div className="table-grid">
              {tables.map((table) => (
                <TableCard
                  table={table}
                  selected={selectedTable === table.id}
                  onClick={() => setSelectedTable(table.id)}
                  key={table.id}
                />
              ))}
            </div>
          </section>
          <TableDetails
            table={activeTable}
            onOpenOrder={() => openOrder()}
            statuses={tableStatuses}
            onStatusChange={updateTableStatus}
            reservation={reservationDetails[activeTableId] || {}}
            onReservationChange={updateReservationDetails}
            reservationSaved={Boolean(savedReservations[activeTableId])}
            reservationEditing={Boolean(editingReservations[activeTableId])}
            onReservationSave={saveReservation}
            onReservationEdit={editReservation}
          />
        </div>
      </main>
    </BackofficeLayout>
  );
}
