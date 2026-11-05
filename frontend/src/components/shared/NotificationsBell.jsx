import { useCallback, useEffect, useRef, useState } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import axiosClient from "../../api/axiosClient";

const PAGE_SIZE = 5;
const NOTIFICATION_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const pageRef = useRef(1);

  const loadNotifications = useCallback(async (requestedPage = pageRef.current) => {
    try {
      const { data } = await axiosClient.get("/api/notifications", {
        params: { userId, page: requestedPage, pageSize: PAGE_SIZE },
      });

      if (Array.isArray(data)) {
        const cutoff = Date.now() - NOTIFICATION_RETENTION_MS;
        const currentNotifications = data.filter(
          (notification) => new Date(notification.createdAt).getTime() >= cutoff,
        );
        const pageCount = Math.ceil(currentNotifications.length / PAGE_SIZE);
        const currentPage = Math.min(
          requestedPage,
          Math.max(pageCount, 1),
        );
        const startIndex = (currentPage - 1) * PAGE_SIZE;

        setNotifications(currentNotifications.slice(startIndex, startIndex + PAGE_SIZE));
        setPage(currentPage);
        pageRef.current = currentPage;
        setTotalPages(pageCount);
        setTotalCount(currentNotifications.length);
        setUnreadCount(currentNotifications.filter((item) => !item.isRead).length);
      } else if (data && Array.isArray(data.items)) {
        setNotifications(data.items);
        setPage(data.page);
        pageRef.current = data.page;
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
        setUnreadCount(data.unreadCount);
      } else {
        throw new Error("Định dạng dữ liệu thông báo không hợp lệ.");
      }

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
      if (isActive) void loadNotifications(pageRef.current);
    };
    const refreshInterval = window.setInterval(
      () => void loadNotifications(pageRef.current),
      60 * 60 * 1000,
    );

    connection.on("NotificationsChanged", handleNotificationsChanged);
    connection.onreconnected(async () => {
      try {
        await connection.invoke("JoinUserNotifications", userId);
        if (isActive) await loadNotifications(pageRef.current);
      } catch (connectionError) {
        if (isActive) setError(getErrorMessage(connectionError));
      }
    });

    const connect = async () => {
      await loadNotifications(1);
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
      window.clearInterval(refreshInterval);
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
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosClient.patch("/api/notifications/read-all", null, {
        params: { userId },
      });
      setUnreadCount(0);
      await loadNotifications(pageRef.current);
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
              {notifications.map((notification) => (
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
          {totalPages > 1 && (
            <nav className="notification-pagination" aria-label="Phân trang thông báo">
              <span>
                {Math.min((page - 1) * PAGE_SIZE + 1, totalCount)}–{Math.min(page * PAGE_SIZE, totalCount)} / {totalCount}
              </span>
              <div>
                <button
                  type="button"
                  aria-label="Trang trước"
                  disabled={page <= 1}
                  onClick={() => void loadNotifications(page - 1)}
                >
                  Trước
                </button>
                <span>Trang {page}/{totalPages}</span>
                <button
                  type="button"
                  aria-label="Trang sau"
                  disabled={page >= totalPages}
                  onClick={() => void loadNotifications(page + 1)}
                >
                  Sau
                </button>
              </div>
            </nav>
          )}
        </section>
      )}
    </div>
  );
}
