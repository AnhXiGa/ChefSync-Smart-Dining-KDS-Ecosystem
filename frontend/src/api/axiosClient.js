import axios from "axios";

const axiosClient = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:5266").replace(/\/+$/, ""),
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosClient;