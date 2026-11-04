import { useEffect, useState } from "react";
import { getPayment } from "../api/paymentApi";

export function usePaymentStatus(paymentId, enabled = true) {
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!paymentId || !enabled) {
      setPayment(null);
      return undefined;
    }

    let active = true;
    let intervalId;
    const load = async () => {
      try {
        const current = await getPayment(paymentId);
        if (!active) return;
        setPayment(current);
        setError("");
        if (["Paid", "Failed", "Cancelled"].includes(current.status)) {
          window.clearInterval(intervalId);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.message || "Không kiểm tra được trạng thái thanh toán.");
        }
      }
    };

    void load();
    intervalId = window.setInterval(load, 5000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [enabled, paymentId]);

  return { payment, error };
}
