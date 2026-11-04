import axiosClient from "./axiosClient";

export async function getOrders() {
  const { data } = await axiosClient.get("/api/orders");
  return data;
}
