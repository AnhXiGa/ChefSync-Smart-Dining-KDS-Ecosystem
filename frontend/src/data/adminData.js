import { formatMoney } from './posData'

export const adminModules = {
  menu: {
    title: 'Quản lý món ăn',
    description: 'Danh sách món, giá bán, danh mục và trạng thái phục vụ.',
    action: '＋ Thêm món ăn',
    columns: ['Món ăn', 'Danh mục', 'Giá bán', 'Thời gian', 'Trạng thái'],
    rows: [
      ['Cơm chiên Dương Châu', 'Món chính', formatMoney(65000), '12–15 phút', 'Đang bán'],
      ['Gà nướng sả', 'Món chính', formatMoney(95000), '15–20 phút', 'Đang bán'],
      ['Salad rau củ', 'Món phụ', formatMoney(45000), '5–7 phút', 'Đang bán'],
      ['Trà đào', 'Đồ uống', formatMoney(25000), '3–5 phút', 'Tạm hết'],
    ],
  },
  inventory: {
    title: 'Nguyên vật liệu',
    description: 'Theo dõi tồn kho, định mức tối thiểu và hạn sử dụng.',
    action: '＋ Thêm nguyên vật liệu',
    columns: ['Nguyên vật liệu', 'Đơn vị', 'Tồn hiện tại', 'Tồn tối thiểu', 'Trạng thái'],
    rows: [['Gạo thơm', 'Kg', '42 Kg', '20 Kg', 'Đủ hàng'], ['Ức gà', 'Kg', '8 Kg', '12 Kg', 'Sắp hết'], ['Đào ngâm', 'Lon', '18 Lon', '10 Lon', 'Đủ hàng'], ['Rau củ tổng hợp', 'Kg', '5 Kg', '8 Kg', 'Sắp hết']],
  },
  bom: {
    title: 'Định lượng BOM',
    description: 'Thiết lập nguyên liệu cấu thành và giá vốn cho từng món.',
    action: '＋ Tạo định lượng',
    columns: ['Món ăn', 'Số nguyên liệu', 'Giá vốn', 'Biên lợi nhuận', 'Trạng thái'],
    rows: [['Cơm chiên Dương Châu', '8 nguyên liệu', formatMoney(28500), '56%', 'Đã thiết lập'], ['Gà nướng sả', '6 nguyên liệu', formatMoney(42000), '55%', 'Đã thiết lập'], ['Salad rau củ', '7 nguyên liệu', formatMoney(18000), '60%', 'Cần cập nhật']],
  },
  'stock-in': {
    title: 'Nhập kho',
    description: 'Theo dõi các phiếu đã nhận và số lượng nguyên liệu đã cộng vào kho.',
  },
  'purchase-orders': {
    title: 'Phiếu nhập hàng',
    description: 'Tạo phiếu nhập hàng, theo dõi trạng thái và xác nhận hàng đã nhận.',
  },
  'stock-out': {
    title: 'Xuất kho & biến động',
    description: 'Kiểm soát nguyên liệu đã xuất cho bếp và các điều chỉnh kho.',
    action: '＋ Tạo phiếu xuất',
    columns: ['Mã phiếu', 'Loại biến động', 'Người thực hiện', 'Thời gian', 'Trạng thái'],
    rows: [['XK-1410-032', 'Xuất cho bếp', 'Thu Hà', '13:00 hôm nay', 'Đã xác nhận'], ['DC-1410-006', 'Điều chỉnh tồn', 'Minh Anh', '11:30 hôm nay', 'Đã xác nhận'], ['XK-1410-031', 'Xuất cho bếp', 'Thanh Tâm', '10:15 hôm nay', 'Đã xác nhận']],
  },
  suppliers: {
    title: 'Nhà cung cấp',
    description: 'Danh bạ đối tác và lịch sử giao dịch nhập hàng.',
    action: '＋ Thêm nhà cung cấp',
    columns: ['Nhà cung cấp', 'Liên hệ', 'Nhóm hàng', 'Công nợ', 'Trạng thái'],
    rows: [['Thực phẩm Minh Phát', '0901 234 567', 'Thực phẩm tươi', formatMoney(1250000), 'Đang hợp tác'], ['Nông sản An Nhiên', '0908 888 111', 'Rau củ', formatMoney(0), 'Đang hợp tác'], ['Đồ uống Việt', '028 3822 4567', 'Đồ uống', formatMoney(960000), 'Đang hợp tác']],
  },
  expenses: {
    title: 'Quản lý chi tiêu',
    description: 'Theo dõi chi phí vận hành, mua hàng và ngân sách nhà hàng.',
    action: '＋ Ghi nhận chi tiêu',
    columns: ['Khoản chi', 'Nhóm chi phí', 'Người tạo', 'Số tiền', 'Trạng thái'],
    rows: [['Nhập thực phẩm tuần 42', 'Nguyên liệu', 'Minh Anh', formatMoney(4250000), 'Đã duyệt'], ['Điện nước tháng 10', 'Vận hành', 'Thanh Tâm', formatMoney(3800000), 'Chờ duyệt'], ['Bảo trì máy lạnh', 'Bảo trì', 'Minh Anh', formatMoney(850000), 'Đã duyệt']],
  },
  users: {
    title: 'Người dùng & quyền',
    description: 'Quản lý tài khoản và chọn một trong năm vai trò có sẵn.',
  },
}
