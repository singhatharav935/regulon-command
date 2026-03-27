import React from "react";

type RuntimeErrorBoundaryProps = {
  children: React.ReactNode;
  scopeLabel?: string;
};

type RuntimeErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

class RuntimeErrorBoundary extends React.Component<RuntimeErrorBoundaryProps, RuntimeErrorBoundaryState> {
  constructor(props: RuntimeErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): RuntimeErrorBoundaryState {
    return { hasError: true, message: error?.message || "Unexpected runtime error." };
  }

  componentDidCatch(error: Error) {
    console.error(`[RuntimeErrorBoundary:${this.props.scopeLabel || "dashboard"}]`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
          <p className="font-semibold mb-2">
            {this.props.scopeLabel || "Dashboard"} failed to render
          </p>
          <p className="text-muted-foreground mb-4">{this.state.message}</p>
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-border px-3 py-2 text-xs hover:bg-accent/50"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RuntimeErrorBoundary;
