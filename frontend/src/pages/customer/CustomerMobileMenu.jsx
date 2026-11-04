import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const configuredApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5266').replace(/\/+$/, '');
const apiUrl = typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1' &&
  /:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/i.test(configuredApiUrl)
  ? configuredApiUrl.replace(/:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/i, `://${window.location.hostname}:5266`)
  : configuredApiUrl;
const API_BASE_URL = `${apiUrl}/api/customer`;

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatTableName = (tableNumber) => {
  const value = String(tableNumber || '').trim();
  if (!value) return '';
  return /^bàn\s/i.test(value) ? value : `Bàn ${value}`;
};

const orderItemStatusLabels = {
  Pending: 'Chờ bếp nhận',
  Accepted: 'Bếp đã nhận',
  Confirmed: 'Bếp đã nhận',
  Preparing: 'Đang chế biến',
  Ready: 'Sẵn sàng',
  Served: 'Đã phục vụ',
  Cancelled: 'Đã hủy',
};

const tableStatusLabels = {
  Available: 'Bàn trống',
  Occupied: 'Đang phục vụ',
  Reserved: 'Đã đặt trước',
  Maintenance: 'Đang bảo trì',
};

function CustomerMobileMenu() {
  const [searchParams] = useSearchParams();
  const qrToken = searchParams.get('token') || '';

  const [tableInfo, setTableInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [orderNote, setOrderNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccessCode, setOrderSuccessCode] = useState(null);
  const [placedOrders, setPlacedOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState('');
  const [orderUpdatesError, setOrderUpdatesError] = useState('');
  const [cancelingItemId, setCancelingItemId] = useState(null);
  const [isSubmittedPage, setIsSubmittedPage] = useState(false);
  const [staffCallType, setStaffCallType] = useState('');
  const [staffCallError, setStaffCallError] = useState('');
  const [staffCallSuccess, setStaffCallSuccess] = useState('');
  const orderHubConnection = useRef(null);
  const notificationHubConnection = useRef(null);

  const handleCallStaff = useCallback(async (requestType) => {
    setStaffCallType(requestType);
    setStaffCallError('');
    setStaffCallSuccess('');

    try {
      const { data } = await axios.post(`${API_BASE_URL}/call-staff`, null, {
        params: { qrToken, requestType },
      });
      setStaffCallSuccess(data.message);
    } catch (requestError) {
      setStaffCallError(
        requestError.response?.data?.message ||
        requestError.message ||
        'Không thể gửi yêu cầu đến nhân viên.',
      );
    } finally {
      setStaffCallType('');
    }
  }, [qrToken]);

  const loadCustomerOrders = useCallback(async () => {
    const response = await axios.get(`${API_BASE_URL}/orders`, {
      params: { qrToken },
    });
    setPlacedOrders(response.data || []);
    return response.data || [];
  }, [qrToken]);

  const loadNotifications = useCallback(async () => {
    const response = await axios.get(`${API_BASE_URL}/notifications`, {
      params: { qrToken },
    });
    setNotifications(response.data || []);
    setNotificationError('');
  }, [qrToken]);

  useEffect(() => {
    const initPage = async () => {
      if (!qrToken) {
        setError('Vui lòng quét mã QR tại bàn để xem thực đơn và gọi món.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [tableRes, menuRes, ordersRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/verify-table/${qrToken}`),
          axios.get(`${API_BASE_URL}/menu`),
          axios.get(`${API_BASE_URL}/orders`, { params: { qrToken } }),
        ]);

        setTableInfo(tableRes.data);
        setCategories(menuRes.data || []);
        setPlacedOrders(ordersRes.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể kết nối đến hệ thống nhà hàng.');
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [qrToken]);

  useEffect(() => {
    if (!isSubmittedPage) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.querySelector('.submitted-page-frame')?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [isSubmittedPage]);

  useEffect(() => {
    if (!isCartOpen) return;
    document.querySelector('.cart-panel')?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [isCartOpen]);

  useEffect(() => {
    const overlayOpen = isCartOpen || isSubmittedPage;
    document.body.style.overflow = overlayOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen, isSubmittedPage]);

  const filteredCategories = useMemo(() => {
    return categories
      .filter((category) => selectedCategoryId === 'ALL' || category.id === selectedCategoryId)
      .map((category) => ({
        ...category,
        products: (category.products || []).filter((product) => {
          const name = (product.name || '').toLowerCase();
          const description = (product.description || '').toLowerCase();
          const query = searchQuery.trim().toLowerCase();

          return !query || name.includes(query) || description.includes(query);
        }),
      }))
      .filter((category) => category.products.length > 0);
  }, [categories, searchQuery, selectedCategoryId]);

  const addToCart = (product) => {
    const availableQuantity = product.availableQuantity;
    setCart((previous) => {
      const existingItem = previous.find((item) => item.product.id === product.id);
      if (existingItem) {
        if (availableQuantity !== null && availableQuantity !== undefined &&
          existingItem.quantity >= availableQuantity) {
          return previous;
        }
        return previous.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      if (availableQuantity !== null && availableQuantity !== undefined &&
        availableQuantity <= 0) {
        return previous;
      }
      return [...previous, { product, quantity: 1, note: '' }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((previous) =>
      previous
        .map((item) => {
          if (item.product.id !== productId) return item;
          const maxQuantity = item.product.availableQuantity;
          const nextQuantity = maxQuantity !== null && maxQuantity !== undefined
            ? Math.min(item.quantity + delta, maxQuantity)
            : item.quantity + delta;
          return { ...item, quantity: nextQuantity };
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const updateItemNote = (productId, note) => {
    setCart((previous) =>
      previous.map((item) => (item.product.id === productId ? { ...item, note } : item)),
    );
  };

  const invoiceItems = placedOrders.flatMap((order) =>
    order.items
      .filter((item) => item.status !== 'Cancelled')
      .map((item) => ({
        ...item,
        orderCode: order.orderCode,
      })),
  );
  const invoiceSubtotal = invoiceItems.reduce(
    (sum, item) => sum + (item.subtotal || item.unitPrice * item.quantity || 0),
    0,
  );
  const draftTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const draftTotalPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItems = draftTotalItems + invoiceItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = draftTotalPrice + invoiceSubtotal;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    try {
      setIsSubmitting(true);

      const response = await axios.post(`${API_BASE_URL}/orders`, {
        qrToken,
        note: orderNote,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          note: item.note,
        })),
      });
      if (orderHubConnection.current?.state === 'Connected') {
        void orderHubConnection.current
          .invoke('JoinOrder', response.data.orderId)
          .catch((connectionError) => {
            setOrderUpdatesError(`Không thể đăng ký cập nhật đơn: ${connectionError.message}`);
          });
      }
      setOrderSuccessCode(response.data.orderCode);
      setCart([]);
      setOrderNote('');
      setIsCartOpen(false);
      await loadCustomerOrders().catch(() => {});
      await axios.get(`${API_BASE_URL}/menu`)
        .then((menuResponse) => setCategories(menuResponse.data || []))
        .catch(() => {});
      setIsSubmittedPage(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi gửi đơn gọi món.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelOrderItem = async (itemId) => {
    if (!window.confirm('Bạn muốn hủy món này? Chỉ món chưa bắt đầu chế biến mới hủy được.')) return;

    try {
      setCancelingItemId(itemId);
      await axios.post(`${API_BASE_URL}/orders/items/${itemId}/cancel`, null, {
        params: { qrToken },
      });
      await loadCustomerOrders().catch(() => {});
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể hủy món. Vui lòng tải lại trang.');
      await loadCustomerOrders().catch(() => {});
    } finally {
      setCancelingItemId(null);
    }
  };

  const markCustomerNotificationAsRead = async (notification) => {
    if (notification.isRead) return;

    try {
      const { data } = await axios.patch(
        `${API_BASE_URL}/notifications/${notification.id}/read`,
        null,
        { params: { qrToken } },
      );
      setNotifications((current) =>
        current.map((item) => (item.id === data.id ? data : item)),
      );
    } catch (requestError) {
      setNotificationError(
        requestError.response?.data?.message || requestError.message,
      );
    }
  };

  const customerNotifications = notifications.length > 0 || notificationError ? (
    <section className="customer-notifications" aria-live="polite">
      <div className="customer-notifications-heading">
        <h3>Thông báo</h3>
        {notifications.some((notification) => !notification.isRead) && (
          <button
            type="button"
            onClick={() =>
              Promise.all(
                notifications
                  .filter((notification) => !notification.isRead)
                  .map(markCustomerNotificationAsRead),
              )
            }
          >
            Đọc tất cả
          </button>
        )}
      </div>
      {notificationError && <p role="alert">{notificationError}</p>}
      {notifications.slice(0, 10).map((notification) => (
        <button
          type="button"
          className={`customer-notification ${notification.isRead ? '' : 'unread'}`}
          key={notification.id}
          onClick={() => void markCustomerNotificationAsRead(notification)}
        >
          <strong>{notification.title}</strong>
          <span>{notification.message}</span>
          <time dateTime={notification.createdAt}>
            {new Date(notification.createdAt).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
        </button>
      ))}
    </section>
  ) : null;

  if (loading) {
    return (
      <div className="mobile-shell">
        <div className="phone-frame loading-state">
          <div className="spinner" />
          <p>Đang tải thực đơn nhà hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-shell">
        <div className="phone-frame error-state">
          <div className="error-icon">!</div>
          <h2>Không thể truy cập bàn</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (isSubmittedPage && placedOrders.length > 0) {
    const latestOrder = placedOrders[0];
    const activeItems = latestOrder.items.filter((item) => item.status !== 'Cancelled');
    const servedItems = activeItems.filter((item) => item.status === 'Served');
    const preparingItems = activeItems.filter((item) =>
      ['Accepted', 'Confirmed', 'Preparing', 'Ready'].includes(item.status),
    );
    const pageTitle = servedItems.length === activeItems.length && activeItems.length > 0
      ? 'Đơn đã phục vụ'
      : preparingItems.length > 0
        ? 'Bếp đang chuẩn bị'
        : 'Bếp đang chuẩn bị';
    const pageSubtitle = activeItems.map((item) =>
      `${item.quantity} × ${item.productName}`,
    ).join(' · ');

    return (
      <div className="mobile-shell submitted-page-shell">
        <div className="phone-frame submitted-page-frame">
          <header className="topbar submitted-page-topbar">
            <div className="brand-lockup">
              <h1>Smart POS</h1>
            </div>
            <div className="table-badge">{formatTableName(tableInfo?.tableNumber)}</div>
          </header>

          <main className="submitted-page-content">
            <button
              type="button"
              className="submitted-back-button"
              onClick={() => setIsSubmittedPage(false)}
              aria-label="Quay lại thực đơn"
            >
              ‹
            </button>

            <section className="submitted-kitchen-card">
              <span className="submitted-kitchen-label">{latestOrder.orderCode}</span>
              <h2>{pageTitle}</h2>
              <div className="submitted-kitchen-meta">
                <strong>Khoảng 10 phút</strong>
                <p>{pageSubtitle || 'Đơn của bạn đang được nhà bếp xử lý.'}</p>
              </div>

              <div className="submitted-progress">
                <div className="submitted-progress-step active">
                  <span />
                  <small>Đã gửi</small>
                </div>
                <div className={preparingItems.length > 0 ? 'submitted-progress-step active' : 'submitted-progress-step'}>
                  <span />
                  <small>Bếp nhận</small>
                </div>
                <div className={servedItems.length > 0 ? 'submitted-progress-step active' : 'submitted-progress-step'}>
                  <span />
                  <small>Phục vụ</small>
                </div>
              </div>
            </section>

            <section className="submitted-items-card">
              <h3>Từng món của bạn</h3>
              {latestOrder.items.filter((item) => item.status !== 'Cancelled').map((item) => (
                <div className="submitted-item-row" key={item.id}>
                  <strong>{item.quantity} × {item.productName}</strong>
                  <span>
                    {orderItemStatusLabels[item.status] || item.status}
                    {item.note ? ` · ${item.note}` : ''}
                  </span>
                  <b>{formatCurrency(item.subtotal || item.unitPrice * item.quantity)}</b>
                </div>
              ))}
              {latestOrder.note && (
                <div className="submitted-order-meta">Ghi chú: {latestOrder.note}</div>
              )}
              <div className="submitted-order-meta">
                Thời gian: {latestOrder.createdAt
                  ? new Date(latestOrder.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                  : 'Vừa đặt'}
              </div>
            </section>
            {customerNotifications}

            <div className="submitted-note">
              <span>ⓘ</span>
              <p>Trong thời gian chờ món có thể phát sinh chậm trễ. Vui lòng liên hệ nhân viên hỗ trợ nếu cần.</p>
            </div>

            <section className="submitted-note-box">
              <label htmlFor="submitted-order-note">Ghi chú đã gửi</label>
              <textarea id="submitted-order-note" readOnly value={latestOrder.note || ''} placeholder="Không có ghi chú chung cho đơn" />
            </section>

            <button
              type="button"
              className="submitted-order-more-button"
              onClick={() => {
                setIsSubmittedPage(false);
                setIsCartOpen(true);
              }}
            >
              + Quay lại giỏ hàng
            </button>

            <div className="submitted-actions">
              <button
                type="button"
                disabled={staffCallType !== ''}
                onClick={() => void handleCallStaff('assistance')}
              >
                {staffCallType === 'assistance' ? 'Đang gửi...' : 'Gọi nhân viên'}
              </button>
            </div>
            <p className="counter-payment-note">Khách thanh toán tại quầy sau khi dùng bữa.</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-shell">
      <div className="phone-frame">
        <header className="topbar">
          <div className="brand-lockup">
            <div>
              <h1>Smart POS</h1>
            </div>
          </div>
          <div className="table-info">
            <div className="table-badge">{formatTableName(tableInfo?.tableNumber)}</div>
          </div>
        </header>

        <div className="search-panel">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm món yêu thích..."
            aria-label="Tìm món"
          />
        </div>

        <div className="category-bar">
          <button
            type="button"
            className={selectedCategoryId === 'ALL' ? 'category-chip active' : 'category-chip'}
            onClick={() => setSelectedCategoryId('ALL')}
          >
            Tất cả
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={selectedCategoryId === category.id ? 'category-chip active' : 'category-chip'}
              onClick={() => setSelectedCategoryId(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {orderSuccessCode && (
          <div className="order-success-banner">
            Đơn hàng {orderSuccessCode} đã được gửi thành công.
          </div>
        )}

        <main className="menu-list">
          {filteredCategories.length === 0 ? (
            <div className="empty-state">Không có món nào phù hợp với tìm kiếm.</div>
          ) : (
            filteredCategories.map((category) => (
              <section key={category.id} className="menu-section">
                <div className="section-title-row">
                  <h2>{category.name}</h2>
                  <span>{category.products.length} món</span>
                </div>

                {category.products.map((product) => (
                  <article key={product.id} className="product-card">
                    <div className="product-image">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} />
                      ) : (
                        <span>🍽️</span>
                      )}
                    </div>

                    <div className="product-body">
                      <div className="title-row">
                        <h3>{product.name}</h3>
                        <span>{formatCurrency(product.price)}</span>
                      </div>

                      {product.description && <p>{product.description}</p>}

                      <div className="meta-row">
                        {product.preparationTime ? <span>⏱ {product.preparationTime} phút</span> : <span>⏱ 15 phút</span>}
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          disabled={product.availableQuantity !== null &&
                            product.availableQuantity !== undefined &&
                            product.availableQuantity <= 0}
                        >
                          {product.availableQuantity !== null &&
                          product.availableQuantity !== undefined &&
                          product.availableQuantity <= 0
                            ? 'Hết nguyên liệu'
                            : '+ Thêm'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            ))
          )}
        </main>

        <footer className="cart-bar">
          <button type="button" className="cart-button" onClick={() => setIsCartOpen(true)}>
            <span>🛒</span>
            <span>{totalItems} món</span>
          </button>

          <strong>{formatCurrency(totalPrice)}</strong>
        </footer>

        {isCartOpen && (
          <div className="cart-modal">
            <div className="cart-panel">
              <header className="topbar cart-page-topbar">
                <div className="brand-lockup">
                  <h1>Smart POS</h1>
                </div>
                <div className="table-badge">{formatTableName(tableInfo?.tableNumber)}</div>
              </header>

              <div className="cart-page-content">
                <div className="cart-header">
                  <button
                    type="button"
                    className="cart-back-button"
                    onClick={() => setIsCartOpen(false)}
                    aria-label="Quay lại thực đơn"
                  >
                    ‹
                  </button>
                  <div>
                    <h3>Giỏ hàng của bạn</h3>
                    <p className="cart-table-line">
                      {formatTableName(tableInfo?.tableNumber)} · {totalItems} món
                    </p>
                  </div>
                </div>

              {placedOrders.length > 0 && (
                <section className="cart-placed-orders">
                  {orderUpdatesError && <p role="alert">{orderUpdatesError}</p>}
                  {customerNotifications}
                  {placedOrders.map((order) => (
                    <article className="cart-placed-order" key={order.id}>
                      <div className="cart-placed-order-heading">
                        <strong>{order.orderCode}</strong>
                        <span>{formatCurrency(order.totalAmount)}</span>
                      </div>
                      {order.items.filter((item) => item.status !== 'Cancelled').map((item) => (
                        <div className="cart-placed-item" key={item.id}>
                          <div>
                            <strong>{item.quantity} × {item.productName}</strong>
                            <span>{orderItemStatusLabels[item.status] || item.status}</span>
                          </div>
                          {item.canCancel && (
                            <button
                              type="button"
                              className="cancel-order-item"
                              onClick={() => cancelOrderItem(item.id)}
                              disabled={cancelingItemId === item.id}
                            >
                              {cancelingItemId === item.id ? 'Đang hủy...' : 'Hủy món'}
                            </button>
                          )}
                        </div>
                      ))}
                    </article>
                  ))}
                </section>
              )}

              {cart.length === 0 ? (
                <div className="empty-cart-panel">
                  {placedOrders.length === 0 && (
                    <div className="empty-cart">Chưa có món nào trong giỏ.</div>
                  )}
                  {placedOrders.length > 0 && (
                    <button
                      type="button"
                      className="cart-add-more-button"
                      onClick={() => setIsCartOpen(false)}
                    >
                      + Thêm món vào đơn
                    </button>
                  )}
                  {placedOrders.length > 0 && (
                    <p className="counter-payment-note">
                      Khách thanh toán tại quầy sau khi dùng bữa.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="cart-items">
                    {cart.map((item) => (
                      <div key={item.product.id} className="cart-item">
                        <div className="cart-item-main">
                          <div className="cart-product-image">
                            {item.product.imageUrl ? (
                              <img src={item.product.imageUrl} alt={item.product.name} />
                            ) : (
                              <span>🍽️</span>
                            )}
                          </div>
                          <div className="cart-product-info">
                            <strong>{item.product.name}</strong>
                            <p>{formatCurrency(item.product.price)} / phần</p>
                            <div className="stepper">
                              <button type="button" onClick={() => updateQuantity(item.product.id, -1)}>−</button>
                              <span>{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, 1)}
                                disabled={item.product.availableQuantity !== null &&
                                  item.product.availableQuantity !== undefined &&
                                  item.quantity >= item.product.availableQuantity}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <strong className="cart-line-total">
                            {formatCurrency(item.product.price * item.quantity)}
                          </strong>
                        </div>
                        <div className="item-actions">
                          <textarea
                            value={item.note}
                            onChange={(event) => updateItemNote(item.product.id, event.target.value)}
                            placeholder="Ghi chú món này..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-note-box">
                    <label htmlFor="order-note">Ghi chú chung cho đơn</label>
                    <textarea
                      id="order-note"
                      value={orderNote}
                      onChange={(event) => setOrderNote(event.target.value)}
                      placeholder="Ví dụ: Không cay, ít đường..."
                    />
                  </div>

                  <div className="checkout-row">
                    <span>Tổng: {formatCurrency(totalPrice)}</span>
                    <div className="checkout-actions-mobile">
                      <button type="button" onClick={handlePlaceOrder} disabled={isSubmitting}>
                        {isSubmitting ? 'Đang gửi...' : (placedOrders.length > 0 ? 'Thêm món vào đơn' : 'Đặt món')}
                      </button>
                    </div>
                  </div>
                </>
              )}
              <button
                type="button"
                className="cart-call-staff-button"
                onClick={() => window.alert('Đã gửi yêu cầu đến nhân viên hỗ trợ.')}
              >
                Gọi nhân viên
              </button>
            </div>
          </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default CustomerMobileMenu;
