import React from "react";

// 渲染崩溃兜底：避免白屏，给出可刷新的提示 —— from PR #6 (hrjtju)
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 48, textAlign: "center" }}>
          <h2 style={{ marginBottom: 12 }}>页面出错了</h2>
          <p style={{ color: "#667085", marginBottom: 16 }}>{this.state.error.message}</p>
          <button
            className="primary-action"
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
