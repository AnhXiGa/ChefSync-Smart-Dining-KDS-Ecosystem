import { Navigate, Route, Routes } from 'react-router-dom'
import { CustomerOrderPage } from '../pages/customer/CustomerOrderPage'
import { KitchenDashboardPage } from '../pages/kitchen/KitchenDashboardPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { AdminModulePage } from '../pages/manager/AdminModulePage'
import { ManagerDashboardPage } from '../pages/manager/ManagerDashboardPage'
import { StaffOrderPage } from '../pages/staff/StaffOrderPage'
import { StaffPaymentsPage } from '../pages/staff/StaffPaymentsPage'
import { StaffTablesPage } from '../pages/staff/StaffTablesPage'

export function AppRoutes() {
  return <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<LoginPage />} />

    <Route path="/manager" element={<ManagerDashboardPage />} />
    <Route path="/manager/menu" element={<AdminModulePage module="menu" />} />
    <Route path="/manager/inventory" element={<AdminModulePage module="inventory" />} />
    <Route path="/manager/bom" element={<AdminModulePage module="bom" />} />
    <Route path="/manager/stock-in" element={<AdminModulePage module="stock-in" />} />
    <Route path="/manager/stock-out" element={<AdminModulePage module="stock-out" />} />
    <Route path="/manager/suppliers" element={<AdminModulePage module="suppliers" />} />
    <Route path="/manager/expenses" element={<AdminModulePage module="expenses" />} />
    <Route path="/manager/users" element={<AdminModulePage module="users" />} />

    <Route path="/staff/tables" element={<StaffTablesPage />} />
    <Route path="/staff/order/:tableId" element={<StaffOrderPage />} />
    <Route path="/staff/payments" element={<StaffPaymentsPage />} />

    <Route path="/kitchen" element={<KitchenDashboardPage />} />
    <Route path="/customer/:tableId" element={<CustomerOrderPage />} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
}