export const menuItems = [
  { name: 'Cơm chiên Dương Châu', category: 'Món chính', price: 65000, time: '12–15 phút', tone: 'rice' },
  { name: 'Gà nướng sả', category: 'Món chính', price: 95000, time: '15–20 phút', tone: 'chicken' },
  { name: 'Salad rau củ', category: 'Món phụ', price: 45000, time: '5–7 phút', tone: 'salad' },
  { name: 'Trà đào', category: 'Đồ uống', price: 25000, time: '3–5 phút', tone: 'tea' },
  { name: 'Mì xào bò', category: 'Món chính', price: 85000, time: '10–12 phút', tone: 'noodle' },
  { name: 'Nước ép cam', category: 'Đồ uống', price: 35000, time: '3–5 phút', tone: 'juice' },
]

export const initialTables = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  status: [1, 3, 5, 6, 8, 10, 11, 12].includes(index + 1) ? 'occupied' : index === 6 ? 'maintenance' : index === 3 ? 'reserved' : 'empty',
  guests: [2, 4, 3, 6, 2, 5, 2][index] || 4,
  total: [185000, 0, 275000, 0, 210000, 860000, 0, 620000][index] || 0,
  minutes: [18, 32, 10, 0, 25, 45, 0, 40][index] || 0,
}))

export const kitchenOrders = [
  { id: '#AN-1410-005', table: 'Bàn 05', time: '12:20', status: 'new', items: ['2 × Cơm chiên Dương Châu', '1 × Gà nướng sả', '2 × Trà đào'] },
  { id: '#AN-1410-003', table: 'Bàn 03', time: '12:25', status: 'cooking', items: ['1 × Mì xào bò', '2 × Nước ép cam'] },
  { id: '#AN-1410-008', table: 'Bàn 08', time: '12:30', status: 'ready', items: ['2 × Cơm chiên Dương Châu', '1 × Salad rau củ'] },
]

export const kitchenColumns = [
  ['new', 'Mới vào', 'orange'],
  ['cooking', 'Đang chế biến', 'blue'],
  ['ready', 'Sẵn sàng', 'green'],
]

export const formatMoney = (value) => `${new Intl.NumberFormat('vi-VN').format(value)} ₫`
