import axiosClient from "./axiosClient";

export async function getTables() {
  const { data } = await axiosClient.get("/api/tables");
  return data;
}
