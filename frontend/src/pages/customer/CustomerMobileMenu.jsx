import { useEffect, useMemo, useState } from 'react';
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
  const [cancelingItemId, setCancelingItemId] = useState(null);

  const loadCustomerOrders = async () => {
    const response = await axios.get(`${API_BASE_URL}/orders`, {
      params: { qrToken },
    });
    setPlacedOrders(response.data || []);
  };

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
    setCart((previous) => {
      const existingItem = previous.find((item) => item.product.id === product.id);
      if (existingItem) {
        return previous.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [...previous, { product, quantity: 1, note: '' }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((previous) =>
      previous
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const updateItemNote = (productId, note) => {
    setCart((previous) =>
      previous.map((item) => (item.product.id === productId ? { ...item, note } : item)),
    );
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

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

      setOrderSuccessCode(response.data.orderCode);
      setCart([]);
      setOrderNote('');
      setIsCartOpen(false);
      await loadCustomerOrders().catch(() => {});
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

  return (
    <div className="mobile-shell">
      <div className="phone-frame">
        <header className="topbar">
          <div>
            <h1>SMART RESTAURANT</h1>
            <p>Gọi món tại bàn qua QR</p>
          </div>
          <div className="table-info">
            <div className="table-badge">📍 {tableInfo?.tableNumber}</div>
            <span className={`table-status ${String(tableInfo?.status || '').toLowerCase()}`}>
              {tableStatusLabels[tableInfo?.status] || 'Chưa xác định'}
            </span>
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

        <section className="customer-orders">
          <div className="section-title-row">
            <h2>Đơn của bạn</h2>
            <span>{placedOrders.length} đơn đang xử lý</span>
          </div>
          {placedOrders.length === 0 ? (
            <p className="customer-orders-empty">Chưa có món nào đang chờ xử lý.</p>
          ) : (
            placedOrders.map((order) => (
              <article className="customer-order-card" key={order.id}>
                <div className="customer-order-heading">
                  <strong>{order.orderCode}</strong>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
                {order.items.map((item) => (
                  <div className="customer-order-item" key={item.id}>
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
            ))
          )}
        </section>

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
                        <button type="button" onClick={() => addToCart(product)}>
                          + Thêm
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
              <div className="cart-header">
                <h3>Giỏ hàng của bạn</h3>
                <button type="button" onClick={() => setIsCartOpen(false)}>
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="empty-cart">Chưa có món nào trong giỏ.</div>
              ) : (
                <>
                  <div className="cart-items">
                    {cart.map((item) => (
                      <div key={item.product.id} className="cart-item">
                        <div>
                          <strong>{item.product.name}</strong>
                          <p>{formatCurrency(item.product.price)}</p>
                        </div>

                        <div className="item-actions">
                          <div className="stepper">
                            <button type="button" onClick={() => updateQuantity(item.product.id, -1)}>-</button>
                            <span>{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item.product.id, 1)}>+</button>
                          </div>

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
                    <button type="button" onClick={handlePlaceOrder} disabled={isSubmitting}>
                      {isSubmitting ? 'Đang gửi...' : 'Đặt món'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerMobileMenu;
