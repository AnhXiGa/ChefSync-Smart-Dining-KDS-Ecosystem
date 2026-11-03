import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import restaurantImage from "../../assets/login-restaurant.png";
import "../../App.css";

const roleRoutes = {
  staff: "/staff/tables",
  manager: "/manager",
  kitchen: "/kitchen",
};

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [role, setRole] = useState("staff");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }
    try {
      const response = await axiosClient.post("/api/auth/login", {
        email: email.trim(),
        password,
      });
      const user = response.data.user;
      const roles = user.roles ?? [];
      const destination = roles.includes("Manager")
        ? "/manager"
        : roleRoutes[role];
      localStorage.setItem("smart-pos-user", JSON.stringify(user));
      if (remember) localStorage.setItem("smart-pos-email", email.trim());
      navigate(destination);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Không thể đăng nhập.");
    }
  };

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="login-brand">
          <span className="brand-mark">♜</span>
          <span>Smart POS</span>
        </div>
        <div className="login-hero-copy">
          <span className="login-kicker">KHÔNG GIAN VẬN HÀNH NHÀ HÀNG</span>
          <h1>
            Một nhịp phối hợp.
            <br />
            Trọn vẹn mỗi bữa ăn.
          </h1>
          <p>Gọi món tại bàn · Bán hàng · Điều phối bếp · Quản lý kho</p>
        </div>
        <div
          className="restaurant-visual"
          style={{ backgroundImage: `url(${restaurantImage})` }}
          aria-label="Không gian nhà hàng"
        />
        <div className="login-hero-footer">
          <strong>Nhà hàng An Nhiên</strong>
          <span>Chi nhánh Nguyễn Huệ</span>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-form-wrap">
          <div className="login-eyebrow">
            ♢ &nbsp; Dành cho nhân viên nhà hàng
          </div>
          <h2>Chào mừng trở lại</h2>
          <p className="login-subtitle">
            Đăng nhập để bắt đầu ca làm việc của bạn.
          </p>
          <form onSubmit={submit}>
            <label>
              Email nhân viên
              <input
                type="email"
                placeholder="minhanh@annhien.vn"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
              />
            </label>
            <label>
              Mật khẩu
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </label>
            <div className="login-options">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />{" "}
                Ghi nhớ đăng nhập
              </label>
              <button type="button" className="forgot">
                Quên mật khẩu?
              </button>
            </div>
            <label className="role-select">
              Vai trò đăng nhập
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="staff">Nhân viên phục vụ</option>
                <option value="manager">Quản lý nhà hàng</option>
                <option value="kitchen">Điều phối bếp</option>
              </select>
            </label>
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}
            <button className="primary login-submit" type="submit">
              → &nbsp; Đăng nhập
            </button>
          </form>
          <div className="login-note">
            Tài khoản được cấp bởi quản trị viên. Vui lòng liên hệ quản lý nếu
            bạn chưa có quyền truy cập.
          </div>
          <div className="login-footer">
            <span>Smart POS · Hệ thống quản lý nhà hàng</span>
            <span>Khách gọi món qua QR không cần đăng nhập.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
