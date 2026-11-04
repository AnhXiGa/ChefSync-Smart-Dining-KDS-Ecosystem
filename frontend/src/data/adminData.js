export const adminModules = {
  menu: {
    title: "Quản lý món ăn",
    description: "Danh sách món, giá bán, danh mục và trạng thái phục vụ.",
    action: "＋ Thêm món ăn",
    columns: ["Món ăn", "Danh mục", "Giá bán", "Thời gian", "Trạng thái"],
    rows: [],
  },
  categories: {
    title: "Quản lý danh mục",
    description: "Danh sách danh mục và số lượng món đang phục vụ.",
    action: "＋ Thêm danh mục",
    columns: ["Danh mục", "Số món", "Thứ tự", "Trạng thái"],
    rows: [],
  },
  inventory: {
    title: "Nguyên vật liệu",
    description: "Theo dõi tồn kho, định mức tối thiểu và hạn sử dụng.",
    rows: [],
  },
  bom: {
    title: "Định lượng BOM",
    description: "Thiết lập nguyên liệu cấu thành và giá vốn cho từng món.",
    rows: [],
  },
  "purchase-orders": {
    title: "Phiếu nhập hàng",
    description: "Tạo phiếu nhập hàng, theo dõi trạng thái và xác nhận hàng đã nhận.",
    rows: [],
  },
  "stock-movements": {
    title: "Biến động kho",
    description: "Theo dõi nhập, tiêu hao và điều chỉnh tồn kho trong một nhật ký.",
    rows: [],
  },
  suppliers: {
    title: "Nhà cung cấp",
    description: "Danh bạ đối tác và lịch sử giao dịch nhập hàng.",
    rows: [],
  },
  expenses: {
    title: "Quản lý chi tiêu",
    description: "Theo dõi chi phí vận hành, mua hàng và ngân sách nhà hàng.",
    rows: [],
  },
  users: {
    title: "Người dùng & quyền",
    description: "Quản lý tài khoản và phân quyền người dùng.",
    rows: [],
  },
};
