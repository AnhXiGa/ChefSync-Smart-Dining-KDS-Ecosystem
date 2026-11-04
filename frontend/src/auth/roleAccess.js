export const roleLandingPaths = {
  Admin: "/manager",
  Manager: "/manager",
  Waiter: "/staff/tables",
  Chef: "/kitchen",
  Inventory: "/manager/inventory",
};

const rolePriority = ["Admin", "Manager", "Waiter", "Chef", "Inventory"];
const adminRoles = ["Admin", "Manager"];

export function getStoredUser() {
  try {
    const user = JSON.parse(localStorage.getItem("smart-pos-user") ?? "null");
    return user && Array.isArray(user.roles) ? user : null;
  } catch {
    return null;
  }
}

export function getLandingPath(user) {
  const primaryRole = rolePriority.find((role) => user?.roles?.includes(role));
  return primaryRole ? roleLandingPaths[primaryRole] : null;
}

export function canAccessPath(path, roles = []) {
  if (roles.some((role) => adminRoles.includes(role))) return true;

  if (path === "/staff/tables" || path.startsWith("/staff/order/") || path === "/staff/payments") {
    return roles.includes("Waiter");
  }
  if (path === "/kitchen") return roles.includes("Chef");
  if (
    path === "/manager/inventory"
    || path === "/manager/bom"
    || path === "/manager/stock-in"
    || path === "/manager/purchase-orders"
    || path === "/manager/stock-out"
    || path === "/manager/suppliers"
  ) {
    return roles.includes("Inventory");
  }
  if (path === "/manager" || path.startsWith("/manager/")) return false;
  return false;
}
