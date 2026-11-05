import { useEffect, useRef, useState } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import axiosClient from "../api/axiosClient";

export function usePosOrderChanges(onChange, onError) {
  const onChangeRef = useRef(onChange);
  const onErrorRef = useRef(onError);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  useEffect(() => {
    onChangeRef.current = onChange;
    onErrorRef.current = onError;
  }, [onChange, onError]);

  useEffect(() => {
    let isActive = true;
    const connection = new HubConnectionBuilder()
      .withUrl(`${axiosClient.defaults.baseURL}/hubs/orders`)
      .withAutomaticReconnect()
      .build();
    const handleOrdersChanged = () => {
      if (isActive) onChangeRef.current();
    };

    connection.on("OrdersChanged", handleOrdersChanged);
    connection.onreconnecting(() => {
      if (isActive) setConnectionStatus("connecting");
    });
    connection.onreconnected(async () => {
      try {
        await connection.invoke("JoinPos");
        if (!isActive) return;
        setConnectionStatus("connected");
        onChangeRef.current();
      } catch (connectionError) {
        if (!isActive) return;
        setConnectionStatus("disconnected");
        onErrorRef.current?.(connectionError);
      }
    });
    connection.onclose((connectionError) => {
      if (!isActive) return;
      setConnectionStatus("disconnected");
      if (connectionError) onErrorRef.current?.(connectionError);
    });

    const connect = async () => {
      try {
        await connection.start();
        if (!isActive) return;
        await connection.invoke("JoinPos");
        if (isActive) setConnectionStatus("connected");
      } catch (connectionError) {
        if (!isActive) return;
        setConnectionStatus("disconnected");
        onErrorRef.current?.(connectionError);
      }
    };
    void connect();

    return () => {
      isActive = false;
      connection.off("OrdersChanged", handleOrdersChanged);
      connection.stop().catch((connectionError) => {
        console.error("Could not stop the POS order hub connection.", connectionError);
      });
    };
  }, []);

  return connectionStatus;
}
