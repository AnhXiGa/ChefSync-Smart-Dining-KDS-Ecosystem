export const navigationGroups = [
  {
    title: 'VẬN HÀNH',
    items: [
      ['tables', '▦', 'Quản lý bàn', '/staff/tables'],
      ['order', '▤', 'Tạo đơn', '/staff/order/5'],
      ['payments', '▣', 'Thanh toán', '/staff/payments'],
      ['kds', '♨', 'Bếp KDS', '/kitchen'],
    ],
  },
  {
    title: 'THỰC ĐƠN',
    items: [
      ['menu', '♜', 'Món ăn', '/manager/menu'],
      ['categories', '▱', 'Danh mục', '/manager/menu'],
    ],
  },
  {
    title: 'KHO',
    items: [
      ['inventory', '◈', 'Nguyên vật liệu', '/manager/inventory'],
      ['bom', '⚖', 'Định lượng BOM', '/manager/bom'],
      ['stock-in', '↔', 'Nhập kho', '/manager/stock-in'],
      ['receipts', '▤', 'Phiếu nhập hàng', '/manager/purchase-orders'],
      ['stock-out', '↔', 'Xuất kho', '/manager/stock-out'],
      ['suppliers', '▱', 'Nhà cung cấp', '/manager/suppliers'],
    ],
  },
  {
    title: 'QUẢN TRỊ',
    items: [
      ['overview', '⌁', 'Tổng quan', '/manager'],
      ['expenses', '₫', 'Quản lý chi tiêu', '/manager/expenses'],
      ['users', '♙', 'Người dùng & quyền', '/manager/users'],
      ['reports', '▥', 'Báo cáo'],
    ],
  },
]
