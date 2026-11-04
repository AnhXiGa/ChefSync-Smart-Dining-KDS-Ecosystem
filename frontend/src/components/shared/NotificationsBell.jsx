import { useCallback, useEffect, useState } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import axiosClient from "../../api/axiosClient";

function getErrorMessage(error) {
  return (
    error.response?.data?.detail ||
    error.response?.data?.message ||
    error.message ||
    "Không thể tải thông báo."
  );
}

export function NotificationsBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const loadNotifications = useCallback(async () => {
    try {
      const { data } = await axiosClient.get("/api/notifications", {
        params: { userId },
      });
      setNotifications(data);
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;

    let isActive = true;
    const connection = new HubConnectionBuilder()
      .withUrl(`${axiosClient.defaults.baseURL}/hubs/notifications`)
      .withAutomaticReconnect()
      .build();
    const handleNotificationsChanged = () => {
      if (isActive) void loadNotifications();
    };

    connection.on("NotificationsChanged", handleNotificationsChanged);
    connection.onreconnected(async () => {
      try {
        await connection.invoke("JoinUserNotifications", userId);
        if (isActive) await loadNotifications();
      } catch (connectionError) {
        if (isActive) setError(getErrorMessage(connectionError));
      }
    });

    const connect = async () => {
      await loadNotifications();
      try {
        await connection.start();
        if (!isActive) return;
        await connection.invoke("JoinUserNotifications", userId);
      } catch (connectionError) {
        if (isActive) setError(getErrorMessage(connectionError));
      }
    };
    void connect();

    return () => {
      isActive = false;
      connection.off("NotificationsChanged", handleNotificationsChanged);
      connection.stop().catch((connectionError) => {
        console.error("Could not stop the notifications hub connection.", connectionError);
      });
    };
  }, [loadNotifications, userId]);

  const markAsRead = async (notification) => {
    if (notification.isRead) return;

    try {
      const { data } = await axiosClient.patch(
        `/api/notifications/${notification.id}/read`,
        null,
        { params: { userId } },
      );
      setNotifications((current) =>
        current.map((item) => (item.id === data.id ? data : item)),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosClient.patch("/api/notifications/read-all", null, {
        params: { userId },
      });
      await loadNotifications();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  return (
    <div className="notification-center">
      <button
        type="button"
        className="notification-trigger"
        aria-label={`Thông báo, ${unreadCount} chưa đọc`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        ♧
        {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
      </button>
      {isOpen && (
        <section className="notification-popover" aria-label="Thông báo">
          <div className="notification-popover-header">
            <strong>Thông báo</strong>
            {unreadCount > 0 && (
              <button type="button" onClick={() => void markAllAsRead()}>
                Đọc tất cả
              </button>
            )}
          </div>
          {error && <p className="notification-error" role="alert">{error}</p>}
          {notifications.length === 0 ? (
            <p className="notification-empty">Chưa có thông báo.</p>
          ) : (
            <div className="notification-list">
              {notifications.slice(0, 30).map((notification) => (
                <button
                  type="button"
                  className={`notification-item ${notification.isRead ? "" : "unread"}`}
                  key={notification.id}
                  onClick={() => void markAsRead(notification)}
                >
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                  <time dateTime={notification.createdAt}>
                    {new Date(notification.createdAt).toLocaleString("vi-VN")}
                  </time>
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
