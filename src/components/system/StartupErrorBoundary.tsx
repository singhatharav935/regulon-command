import { Component, type ErrorInfo, type ReactNode } from "react";

type StartupErrorBoundaryProps = {
  children: ReactNode;
};

type StartupErrorBoundaryState = {
  hasError: boolean;
  message: string;
  stack?: string;
};

class StartupErrorBoundary extends Component<
  StartupErrorBoundaryProps,
  StartupErrorBoundaryState
> {
  state: StartupErrorBoundaryState = {
    hasError: false,
    message: "",
    stack: "",
  };

  static getDerivedStateFromError(error: Error): StartupErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || "Unknown startup error",
      stack: error.stack,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[SANNIDH] Startup render failed.", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#040b1a",
            color: "#e5eefc",
            fontFamily: "Inter, system-ui, sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "860px",
              border: "1px solid #1f355d",
              borderRadius: "12px",
              padding: "20px",
              background: "#07122a",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h1 style={{ margin: 0, fontSize: "20px" }}>
                SANNIDH Workspace Recovery
              </h1>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: "#1976d2",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Reload Workspace
              </button>
            </div>
            <p style={{ margin: "0 0 12px 0", color: "#9eb2d9" }}>
              A temporary error occurred during workspace render. Click 'Reload Workspace' to refresh.
            </p>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                margin: "0",
                padding: "12px",
                background: "#030917",
                borderRadius: "8px",
                border: "1px solid #1a2a49",
                color: "#9ce9ff",
                fontSize: "12px",
                lineHeight: 1.5,
                maxHeight: "50vh",
                overflow: "auto",
              }}
            >
              {this.state.message}
              {this.state.stack ? `\n\n${this.state.stack}` : ""}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default StartupErrorBoundary;
