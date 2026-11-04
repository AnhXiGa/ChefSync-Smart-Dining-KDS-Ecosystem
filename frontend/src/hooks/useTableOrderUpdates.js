import { useCallback, useEffect, useState } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import axiosClient from "../api/axiosClient";

const activeOrderStatuses = new Set([
  "Pending",
  "Confirmed",
  "Preparing",
  "Ready",
]);

function getErrorMessage(error) {
  return (
    error.response?.data?.detail ||
    error.response?.data?.message ||
    error.message ||
    "Lỗi không xác định."
  );
}

export function useTableOrderUpdates(tableId) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  const loadOrders = useCallback(async () => {
    try {
      const { data } = await axiosClient.get(`/api/orders/table/${tableId}`);
      const activeOrders = data.filter((order) =>
        activeOrderStatuses.has(order.status),
      );
      setOrders(activeOrders);
      setError("");
      return activeOrders;
    } catch (requestError) {
      setError(`Không thể tải trạng thái đơn: ${getErrorMessage(requestError)}`);
      return null;
    }
  }, [tableId]);

  useEffect(() => {
    let isActive = true;
    const baseUrl = axiosClient.defaults.baseURL.replace(/\/$/, "");
    const connection = new HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/orders`)
      .withAutomaticReconnect()
      .build();

    const joinOrders = async (tableOrders) => {
      await Promise.all(
        tableOrders.map((order) => connection.invoke("JoinOrder", order.id)),
      );
    };

    const handleItemStatusChanged = (updatedItem) => {
      if (!isActive) return;

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === updatedItem.orderId
            ? {
                ...order,
                items: order.items.map((item) =>
                  item.id === updatedItem.id
                    ? { ...item, status: updatedItem.status }
                    : item,
                ),
              }
            : order,
        ),
      );
    };

    connection.on("OrderItemStatusChanged", handleItemStatusChanged);
    connection.onreconnecting(() => {
      if (isActive) setConnectionStatus("connecting");
    });
    connection.onreconnected(async () => {
      try {
        const latestOrders = await loadOrders();
        if (!isActive) return;
        await joinOrders(latestOrders ?? []);
        setConnectionStatus("connected");
      } catch (connectionError) {
        if (!isActive) return;
        setConnectionStatus("disconnected");
        setError(
          `Không thể đăng ký cập nhật đơn: ${getErrorMessage(connectionError)}`,
        );
      }
    });
    connection.onclose((connectionError) => {
      if (!isActive) return;
      setConnectionStatus("disconnected");
      if (connectionError) {
        setError(
          `Mất kết nối cập nhật đơn: ${getErrorMessage(connectionError)}`,
        );
      }
    });

    const connect = async () => {
      try {
        const initialOrders = await loadOrders();
        await connection.start();
        if (!isActive) return;
        await joinOrders(initialOrders ?? []);
        const latestOrders = await loadOrders();
        if (latestOrders) await joinOrders(latestOrders);
        if (isActive) setConnectionStatus("connected");
      } catch (connectionError) {
        if (!isActive) return;
        setConnectionStatus("disconnected");
        setError(
          `Không thể kết nối cập nhật đơn: ${getErrorMessage(connectionError)}`,
        );
      }
    };

    void connect();

    return () => {
      isActive = false;
      connection.off("OrderItemStatusChanged", handleItemStatusChanged);
      connection.stop().catch((connectionError) => {
        console.error("Could not stop the order hub connection.", connectionError);
      });
    };
  }, [loadOrders]);

  return { orders, error, connectionStatus };
}
