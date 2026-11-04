import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { createPayment } from '../../api/paymentApi';

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
  const [payment, setPayment] = useState(null);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [isPaymentPage, setIsPaymentPage] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('QR');
  const [isSubmittedPage, setIsSubmittedPage] = useState(false);

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

  const servedItemCount = placedOrders.reduce(
    (sum, order) => sum + order.items.filter((item) => item.status === 'Served').length,
    0,
  );
  const canProceedToPayment =
    placedOrders.length > 0 &&
    servedItemCount > 0 &&
    placedOrders.every((order) =>
      order.items.every((item) => item.status === 'Served' || item.status === 'Cancelled'),
    );
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
  const invoiceTax = Math.round(invoiceSubtotal * 0.08);
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

      setOrderSuccessCode(response.data.orderCode);
      setCart([]);
      setOrderNote('');
      setIsCartOpen(false);
      await loadCustomerOrders().catch(() => {});
      setIsSubmittedPage(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi gửi đơn gọi món.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (placedOrders.length === 0) {
      setPaymentError('Vui lòng gửi đơn đặt món trước khi thanh toán.');
      setPayment({});
      return;
    }
    if (!canProceedToPayment) {
      setPaymentError('Khách hàng chỉ được thanh toán sau khi đã nhận đủ tất cả món.');
      setPayment({});
      return;
    }

    const latestOrder = placedOrders[0];
    setIsPaymentLoading(true);
    setPaymentError('');
    setPayment(null);

    try {
      const createdPayment = await createPayment({
        orderId: latestOrder.id,
        paymentMethod: 'BankTransfer',
      });
      setPayment(createdPayment);
      setIsPaymentPage(true);
      setIsCartOpen(false);
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Không thể tạo mã thanh toán.');
      setPayment({});
    } finally {
      setIsPaymentLoading(false);
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
          <div className="payment-page-statusbar" aria-hidden="true">
            <span>12:30</span>
            <div><span>▮▮</span><span>⌁</span><span>▣</span></div>
          </div>

          <header className="topbar payment-page-topbar">
            <div className="brand-lockup">
              <span className="brand-mark"><span>♨</span></span>
              <h1>Smart POS</h1>
            </div>
            <div className="table-badge">Bàn {tableInfo?.tableNumber}</div>
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
              {latestOrder.items.map((item) => (
                <div className="submitted-item-row" key={item.id}>
                  <strong>{item.quantity} × {item.productName}</strong>
                  <span>{item.status === 'Served' ? 'Đã phục vụ' : item.status === 'Cancelled' ? 'Đã hủy' : `${item.note || 'Đang xử lý'}`}</span>
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

            <div className="submitted-note">
              <span>ⓘ</span>
              <p>Trong thời gian món có thể khác mức Doi dùng nếu phát sinh chậm trễ, vui lòng liên hệ nhân viên hỗ trợ.</p>
            </div>

            <section className="submitted-note-box">
              <label htmlFor="submitted-order-note">Ghi chú đã gửi</label>
              <textarea id="submitted-order-note" readOnly value={latestOrder.note || ''} placeholder="Không có ghi chú chung cho đơn" />
            </section>

            <button
              type="button"
              className="submitted-order-more-button"
              onClick={() => setIsSubmittedPage(false)}
            >
              + Gọi thêm món
            </button>

            <div className="submitted-actions">
              <button
                type="button"
                onClick={() => window.alert('Đã gửi yêu cầu đến nhân viên hỗ trợ.')}
              >
                Gọi nhân viên
              </button>
              <button
                type="button"
                disabled={isPaymentLoading || !canProceedToPayment}
                onClick={handleProceedToPayment}
              >
                Yêu cầu thanh toán
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (isPaymentPage) {
    const displayedTotal = payment?.amount || invoiceSubtotal + invoiceTax;

    return (
      <div className="mobile-shell payment-page-shell">
        <div className="phone-frame payment-page-frame">
          <div className="payment-page-statusbar" aria-hidden="true">
            <span>13:05</span>
            <div><span>▮▮</span><span>⌁</span><span>▣</span></div>
          </div>

          <header className="topbar payment-page-topbar">
            <div className="brand-lockup">
              <span className="brand-mark"><span>♨</span></span>
              <h1>Smart POS</h1>
            </div>
            <div className="table-badge">Bàn {tableInfo?.tableNumber}</div>
          </header>

          <main className="payment-page-content">
            <div className="payment-page-title-row">
              <button
                type="button"
                className="payment-back-button"
                onClick={() => {
                  setIsPaymentPage(false);
                  setPayment(null);
                  setPaymentError('');
                }}
                aria-label="Quay lại giỏ hàng"
              >
                ‹
              </button>
              <div>
                <h2>Thanh toán tại bàn</h2>
                <p>Bàn {String(tableInfo?.tableNumber || '').padStart(2, '0')} · {placedOrders.map((order) => order.orderCode).join(', ')}</p>
              </div>
            </div>

            <section className="payment-invoice-card">
              <h3>Chi tiết hóa đơn</h3>
              {invoiceItems.map((item) => (
                <div className="payment-invoice-item" key={item.id}>
                  <div>
                    <strong>{item.quantity} × {item.productName}</strong>
                    <small>{formatCurrency(item.unitPrice)} / phần</small>
                  </div>
                  <b>{formatCurrency(item.subtotal || item.unitPrice * item.quantity)}</b>
                </div>
              ))}

              <div className="payment-invoice-totals">
                <div><span>Tạm tính</span><strong>{formatCurrency(invoiceSubtotal)}</strong></div>
                <div><span>Giảm giá</span><strong>0 ₫</strong></div>
                <div><span>Thuế GTGT 8%</span><strong>{formatCurrency(invoiceTax)}</strong></div>
                <div className="payment-invoice-grand-total">
                  <span>Tổng thanh toán</span>
                  <strong>{formatCurrency(displayedTotal)}</strong>
                </div>
              </div>
            </section>

            <section className="payment-method-card">
              <h3>Phương thức thanh toán</h3>
              <div className="payment-method-tabs">
                <button
                  type="button"
                  className={paymentMethod === 'Cash' ? 'active' : ''}
                  onClick={() => setPaymentMethod('Cash')}
                >
                  Tiền mặt
                </button>
                <button
                  type="button"
                  className={paymentMethod === 'Transfer' ? 'active' : ''}
                  onClick={() => setPaymentMethod('Transfer')}
                >
                  Chuyển khoản
                </button>
                <button
                  type="button"
                  className={paymentMethod === 'QR' ? 'active' : ''}
                  onClick={() => setPaymentMethod('QR')}
                >
                  QR
                </button>
              </div>

              {paymentMethod !== 'Cash' ? (
                <div className="payment-qr-section">
                  {payment?.qrCodeUrl && (
                    <img src={payment.qrCodeUrl} alt="QR thanh toán chuyển khoản" />
                  )}
                  <strong>{payment?.transferContent || 'Đang tạo nội dung thanh toán...'}</strong>
                  <p>Mã QR thanh toán</p>
                  {payment?.qrCodeUrl && (
                    <small>Nếu không quét được QR, chọn chuyển khoản thủ công trong ứng dụng ngân hàng.</small>
                  )}
                </div>
              ) : (
                <div className="payment-cash-section">
                  <p>Vui lòng gọi nhân viên để thanh toán bằng tiền mặt.</p>
                  <button
                    type="button"
                    onClick={() => window.alert('Đã gửi yêu cầu đến nhân viên hỗ trợ thanh toán.')}
                  >
                    Gọi nhân viên thanh toán
                  </button>
                </div>
              )}

              <div className="payment-warning">
                <span>⚠</span>
                <p>Đang chờ nhân viên xác nhận thanh toán.<br />Chỉ bấm xác nhận sau khi nhân viên hoặc hệ thống đã nhận thanh toán.</p>
              </div>
            </section>

            {paymentError && <p className="customer-payment-error">{paymentError}</p>}

            <button
              type="button"
              className="payment-call-staff-button"
              onClick={() => window.alert('Đã gửi yêu cầu đến nhân viên hỗ trợ thanh toán.')}
            >
              <span>♟</span>
              Gọi nhân viên hỗ trợ
            </button>
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
            <span className="brand-mark"><span>♨</span></span>
            <div>
              <h1>Smart POS</h1>
            </div>
          </div>
          <div className="table-info">
            <div className="table-badge">📍 {tableInfo?.tableNumber}</div>
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
              <div className="cart-page-statusbar" aria-hidden="true">
                <span>12:30</span>
                <div><span>▮▮</span><span>⌁</span><span>▣</span></div>
              </div>
              <header className="topbar cart-page-topbar">
                <div className="brand-lockup">
                  <span className="brand-mark"><span>♨</span></span>
                  <h1>Smart POS</h1>
                </div>
                <div className="table-badge">Bàn {String(tableInfo?.tableNumber || '').padStart(2, '0')}</div>
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
                      Bàn {String(tableInfo?.tableNumber || '').padStart(2, '0')} · {totalItems} món
                    </p>
                  </div>
                </div>

              {placedOrders.length > 0 && (
                <section className="cart-placed-orders">
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
                    <button
                      type="button"
                      className="payment-proceed-button"
                      onClick={handleProceedToPayment}
                      disabled={isPaymentLoading || !canProceedToPayment}
                    >
                      {isPaymentLoading ? 'Đang tạo mã...' : 'Tiến hành thanh toán'}
                    </button>
                  )}
                  {!canProceedToPayment && placedOrders.length > 0 && (
                    <p className="payment-readiness-note">
                      Thanh toán sau khi đã nhận đủ tất cả món.
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
                              <button type="button" onClick={() => updateQuantity(item.product.id, 1)}>+</button>
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
                      <button
                        type="button"
                        className="payment-proceed-button"
                        onClick={handleProceedToPayment}
                        disabled={isPaymentLoading || !canProceedToPayment}
                      >
                        {isPaymentLoading ? 'Đang tạo mã...' : 'Tiến hành thanh toán'}
                      </button>
                    </div>
                    {!canProceedToPayment && placedOrders.length > 0 && (
                      <p className="payment-readiness-note">
                        Thanh toán sau khi đã nhận đủ tất cả món.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          </div>
        )}

        {paymentError && !isPaymentPage && (
          <div className="payment-modal-overlay" role="presentation">
            <section className="customer-payment-modal" role="dialog" aria-modal="true">
              <div className="customer-payment-heading">
                <div>
                  <span>Thanh toán chuyển khoản</span>
                  <h3>{placedOrders[0]?.orderCode || 'Đơn hàng của bạn'}</h3>
                </div>
                <button type="button" onClick={() => { setPayment(null); setPaymentError(''); }}>
                  ✕
                </button>
              </div>
              <p className="customer-payment-error">{paymentError}</p>

              <button
                type="button"
                className="payment-modal-close"
                onClick={() => { setPayment(null); setPaymentError(''); }}
              >
                Đóng
              </button>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerMobileMenu;
