import { Navigate, Route, Routes } from 'react-router-dom'
import { canAccessPath, getLandingPath, getStoredUser } from '../auth/roleAccess'
import { CustomerOrderPage } from '../pages/customer/CustomerOrderPage'
import CustomerMobileMenu from '../pages/CustomerMobileMenu'
import { KitchenDashboardPage } from '../pages/kitchen/KitchenDashboardPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { AdminModulePage } from '../pages/manager/AdminModulePage'
import { ManagerDashboardPage } from '../pages/manager/ManagerDashboardPage'
import { StaffOrderPage } from '../pages/staff/StaffOrderPage'
import { StaffPayments } from '../pages/staff/StaffPayments'
import { StaffCheckout } from '../pages/staff/StaffCheckout'
import { StaffTablesPage } from '../pages/staff/StaffTablesPage'
import { ManagerTablesPage } from '../pages/manager/ManagerTablesPage'

function RoleRoute({ children, path }) {
  const user = getStoredUser();
  if (!user || !getLandingPath(user)) return <Navigate to="/login" replace />;
  if (!canAccessPath(path, user.roles)) {
    return <Navigate to={getLandingPath(user)} replace />;
  }
  return children;
}

function LoginRoute() {
  const user = getStoredUser();
  const landingPath = getLandingPath(user);
  return landingPath ? <Navigate to={landingPath} replace /> : <LoginPage />;
}

export function AppRoutes() {
  return <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<LoginRoute />} />

    <Route path="/manager" element={<RoleRoute path="/manager"><ManagerDashboardPage /></RoleRoute>} />
    <Route path="/manager/tables" element={<RoleRoute path="/manager/tables"><ManagerTablesPage /></RoleRoute>} />
    <Route path="/manager/menu" element={<RoleRoute path="/manager/menu"><AdminModulePage module="menu" /></RoleRoute>} />
    <Route path="/manager/stock-in" element={<RoleRoute path="/manager/stock-in"><AdminModulePage module="stock-in" /></RoleRoute>} />
    <Route path="/manager/purchase-orders" element={<RoleRoute path="/manager/purchase-orders"><AdminModulePage module="purchase-orders" /></RoleRoute>} />
    <Route path="/manager/stock-out" element={<RoleRoute path="/manager/stock-out"><AdminModulePage module="stock-out" /></RoleRoute>} />
    <Route path="/manager/suppliers" element={<RoleRoute path="/manager/suppliers"><AdminModulePage module="suppliers" /></RoleRoute>} />
    <Route path="/manager/expenses" element={<RoleRoute path="/manager/expenses"><AdminModulePage module="expenses" /></RoleRoute>} />
    <Route path="/manager/users" element={<RoleRoute path="/manager/users"><AdminModulePage module="users" /></RoleRoute>} />
    <Route path="/manager/inventory" element={<RoleRoute path="/manager/inventory"><AdminModulePage module="inventory" /></RoleRoute>} />
    <Route path="/manager/bom" element={<RoleRoute path="/manager/bom"><AdminModulePage module="bom" /></RoleRoute>} />

    <Route path="/staff/tables" element={<RoleRoute path="/staff/tables"><StaffTablesPage /></RoleRoute>} />
    <Route path="/staff/checkout" element={<RoleRoute path="/staff/checkout"><StaffCheckout /></RoleRoute>} />
    <Route path="/staff/order/:tableId" element={<RoleRoute path="/staff/order/:tableId"><StaffOrderPage /></RoleRoute>} />
    <Route path="/staff/payments" element={<RoleRoute path="/staff/payments"><StaffPayments /></RoleRoute>} />

    <Route path="/kitchen" element={<RoleRoute path="/kitchen"><KitchenDashboardPage /></RoleRoute>} />
    <Route path="/customer" element={<CustomerMobileMenu />} />
    <Route path="/customer/:tableId" element={<CustomerOrderPage />} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
}
