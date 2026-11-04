export const navigationGroups = [
  {
    title: 'QUẢN LÝ NHÀ HÀNG',
    items: [['manager-tables', '▦', 'Quản lý bàn & QR', '/manager/tables']],
  },
  {
    title: 'VẬN HÀNH',
    items: [
      ['tables', '▦', 'Quản lý bàn', '/staff/tables'],
      ['checkout', '▣', 'Checkout', '/staff/checkout'],
      ['payments', '▤', 'Lịch sử thanh toán', '/staff/payments'],
      ['kds', '♨', 'Bếp KDS', '/kitchen'],
    ],
  },
  {
    title: 'THỰC ĐƠN',
    items: [
      ['menu', '♜', 'Món ăn', '/manager/menu'],
      ['categories', '▱', 'Danh mục', '/manager/categories'],
    ],
  },
  {
    title: 'KHO',
    items: [
      ['inventory', '◈', 'Nguyên vật liệu', '/manager/inventory'],
      ['bom', '⚖', 'Định lượng BOM', '/manager/bom'],
      ['stock-movements', '↕', 'Biến động kho', '/manager/stock-movements'],
      ['receipts', '▤', 'Phiếu nhập hàng', '/manager/purchase-orders'],
      ['suppliers', '▱', 'Nhà cung cấp', '/manager/suppliers'],
    ],
  },
  {
    title: 'QUẢN TRỊ',
    items: [
      ['overview', '⌁', 'Tổng quan', '/manager'],
      ['expenses', '▥', 'Báo cáo tài chính', '/manager/expenses'],
      ['users', '♙', 'Người dùng & quyền', '/manager/users'],
      ['reports', '▥', 'Báo cáo'],
    ],
  },
]
