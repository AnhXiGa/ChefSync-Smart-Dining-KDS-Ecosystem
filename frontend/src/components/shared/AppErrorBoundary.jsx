import { Component } from "react";

export class AppErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unhandled application error.", error, errorInfo);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="app-error-page">
        <section className="app-error-card" role="alert">
          <h1>Không thể hiển thị trang</h1>
          <p>Đã xảy ra lỗi sau thao tác thanh toán. Vui lòng tải lại trang.</p>
          <button className="primary" type="button" onClick={() => window.location.reload()}>
            Tải lại trang
          </button>
        </section>
      </main>
    );
  }
}
