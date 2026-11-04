import axiosClient from "./axiosClient";

export async function getOrders() {
  const { data } = await axiosClient.get("/api/orders");
  return data;
}

export async function getOrder(orderId) {
  const { data } = await axiosClient.get(`/api/orders/${orderId}`);
  return data;
}

export async function updateOrderDiscount(orderId, percentage) {
  const { data } = await axiosClient.patch(`/api/orders/${orderId}/discount`, {
    percentage,
  });
  return data;
}
