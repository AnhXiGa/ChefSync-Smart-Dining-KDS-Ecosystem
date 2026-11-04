import axiosClient from "./axiosClient";

export async function createPayment(request) {
  const { data } = await axiosClient.post("/api/payments", request);
  return data;
}

export async function getPayment(paymentId) {
  const { data } = await axiosClient.get(`/api/payments/${paymentId}`);
  return data;
}

export async function getPaymentByOrder(orderId) {
  try {
    const { data } = await axiosClient.get(`/api/payments/order/${orderId}`);
    return data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

export async function confirmCashPayment(paymentId) {
  const { data } = await axiosClient.post(`/api/payments/${paymentId}/confirm-cash`);
  return data;
}

export async function getPaymentHistory() {
  const { data } = await axiosClient.get("/api/payments");
  return data;
}
