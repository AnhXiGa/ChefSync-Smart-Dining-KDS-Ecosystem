import { useCallback, useEffect, useState } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import axiosClient from "../../api/axiosClient";
import {
  BackofficeLayout,
  PageTitle,
  StatusBadge,
} from "../../components/shared/Ui";

const kitchenColumns = [
  { status: "new", title: "Mới vào", kind: "orange" },
  { status: "preparing", title: "Đang chế biến", kind: "blue" },
  { status: "ready", title: "Sẵn sàng", kind: "green" },
];

const itemActions = {
  Pending: { endpoint: "accept", label: "Nhận món" },
  Accepted: { endpoint: "start", label: "Bắt đầu chế biến" },
  Preparing: { endpoint: "ready", label: "Báo món sẵn sàng" },
  Ready: { endpoint: "served", label: "Xác nhận đã phục vụ" },
};

const statusLabels = {
  Pending: "Chờ nhận",
  Accepted: "Đã nhận",
  Preparing: "Đang chế biến",
  Ready: "Sẵn sàng",
  Served: "Đã phục vụ",
};

function getErrorMessage(error) {
  return (
    error.response?.data?.detail ||
    error.response?.data?.message ||
    error.message ||
    "Lỗi không xác định."
  );
}

function getOrderStage(order) {
  if (order.items.some((item) => ["Pending", "Accepted"].includes(item.status))) {
    return "new";
  }
  if (order.items.some((item) => item.status === "Preparing")) {
    return "preparing";
  }
  return "ready";
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function KitchenDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [busyItems, setBusyItems] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  const loadOrders = useCallback(async () => {
    try {
      const { data } = await axiosClient.get("/api/kds/orders");
      setOrders(data);
      setError("");
    } catch (requestError) {
      setError(`Không thể tải đơn bếp: ${getErrorMessage(requestError)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyUpdatedItem = useCallback((updatedItem) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === updatedItem.orderId
          ? {
              ...order,
              items: order.items.map((item) =>
                item.id === updatedItem.id ? updatedItem : item,
              ),
            }
          : order,
      ),
    );
  }, []);

  useEffect(() => {
    let isActive = true;
    const baseUrl = axiosClient.defaults.baseURL.replace(/\/$/, "");
    const connection = new HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/orders`)
      .withAutomaticReconnect()
      .build();

    const handleItemStatusChanged = (updatedItem) => {
      if (isActive) applyUpdatedItem(updatedItem);
    };
    const handleOrdersChanged = () => {
      if (isActive) void loadOrders();
    };

    connection.on("OrderItemStatusChanged", handleItemStatusChanged);
    connection.on("KdsOrdersChanged", handleOrdersChanged);
    connection.onreconnecting(() => {
      if (isActive) setConnectionStatus("connecting");
    });
    connection.onreconnected(async () => {
      try {
        await connection.invoke("JoinKitchen");
        await loadOrders();
        if (isActive) setConnectionStatus("connected");
      } catch (connectionError) {
        if (!isActive) return;
        setConnectionStatus("disconnected");
        setError(
          `Không thể đăng ký cập nhật bếp: ${getErrorMessage(connectionError)}`,
        );
      }
    });
    connection.onclose((connectionError) => {
      if (!isActive) return;
      setConnectionStatus("disconnected");
      if (connectionError) {
        setError(
          `Mất kết nối cập nhật bếp: ${getErrorMessage(connectionError)}`,
        );
      }
    });

    const connect = async () => {
      try {
        await loadOrders();
        await connection.start();
        if (!isActive) return;
        await connection.invoke("JoinKitchen");
        await loadOrders();
        if (isActive) setConnectionStatus("connected");
      } catch (connectionError) {
        if (!isActive) return;
        setConnectionStatus("disconnected");
        setError(
          `Không thể kết nối cập nhật bếp: ${getErrorMessage(connectionError)}`,
        );
      }
    };

    void connect();

    return () => {
      isActive = false;
      connection.off("OrderItemStatusChanged", handleItemStatusChanged);
      connection.off("KdsOrdersChanged", handleOrdersChanged);
      connection.stop().catch((connectionError) => {
        console.error("Could not stop the kitchen hub connection.", connectionError);
      });
    };
  }, [applyUpdatedItem, loadOrders]);

  const advanceItem = async (item) => {
    const action = itemActions[item.status];
    if (!action) return;

    setBusyItems((current) => new Set(current).add(item.id));
    setError("");
    try {
      const { data } = await axiosClient.patch(
        `/api/kds/order-items/${item.id}/${action.endpoint}`,
      );
      applyUpdatedItem(data);
    } catch (requestError) {
      setError(`Không thể cập nhật món: ${getErrorMessage(requestError)}`);
    } finally {
      setBusyItems((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
  };

  const connectionLabel =
    connectionStatus === "connected"
      ? "Đang đồng bộ"
      : connectionStatus === "connecting"
        ? "Đang kết nối"
        : "Mất kết nối";

  return (
    <BackofficeLayout role="kitchen" title="Điều phối bếp">
      <main className="page kitchen-page">
        <PageTitle
          title="Điều phối bếp"
          description="Ca hiện tại · Khu bếp chính · Cập nhật trạng thái theo thời gian thực"
          action={
            <button
              className="primary"
              onClick={() => void loadOrders()}
              disabled={loading}
            >
              ↻ Cập nhật
            </button>
          }
        />
        <div className="kitchen-toolbar">
          <StatusBadge kind="orange">{orders.length} đơn đang xử lý</StatusBadge>
          <StatusBadge kind={connectionStatus === "connected" ? "green" : "orange"}>
            {connectionLabel}
          </StatusBadge>
          <span>
            {orders.reduce((total, order) => total + order.items.length, 0)} món
          </span>
        </div>
        {error && (
          <div className="kitchen-error" role="alert">
            {error}
          </div>
        )}
        <div className="kitchen-board">
          {kitchenColumns.map((column) => {
            const columnOrders = orders.filter(
              (order) => getOrderStage(order) === column.status,
            );
            return (
              <section className="kitchen-column" key={column.status}>
                <div className="column-title">
                  <h2>{column.title}</h2>
                  <StatusBadge kind={column.kind}>{columnOrders.length}</StatusBadge>
                </div>
                {loading && orders.length === 0 ? (
                  <p className="kitchen-empty">Đang tải đơn hàng...</p>
                ) : columnOrders.length === 0 ? (
                  <p className="kitchen-empty">Chưa có đơn hàng.</p>
                ) : (
                  columnOrders.map((order) => (
                    <article className="kitchen-ticket" key={order.id}>
                      <div className="ticket-head">
                        <strong>Bàn {order.tableNumber}</strong>
                        <span>{formatTime(order.createdAt)}</span>
                      </div>
                      <small>{order.orderCode}</small>
                      {order.items.map((item) => {
                        const action = itemActions[item.status];
                        return (
                          <div className="kitchen-item" key={item.id}>
                            <div className="kitchen-item-details">
                              <strong>
                                {item.quantity} × {item.productName}
                              </strong>
                              <StatusBadge
                                kind={
                                  item.status === "Ready" || item.status === "Served"
                                    ? "green"
                                    : item.status === "Preparing"
                                      ? "blue"
                                      : item.status === "Accepted"
                                        ? "orange"
                                        : "gray"
                                }
                              >
                                {statusLabels[item.status] ?? item.status}
                              </StatusBadge>
                            </div>
                            {item.note && (
                              <p className="kitchen-item-note">Ghi chú: {item.note}</p>
                            )}
                            {action && (
                              <button
                                className="secondary full"
                                onClick={() => void advanceItem(item)}
                                disabled={busyItems.has(item.id)}
                              >
                                {busyItems.has(item.id)
                                  ? "Đang cập nhật..."
                                  : action.label}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </article>
                  ))
                )}
              </section>
            );
          })}
        </div>
      </main>
    </BackofficeLayout>
  );
}
