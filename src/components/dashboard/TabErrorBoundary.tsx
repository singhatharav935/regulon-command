import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackName?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class TabErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    errorMessage: "",
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || "An unexpected error occurred in this module.",
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[SANNIDH] Module render error caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl text-center space-y-4 my-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-300">
              {this.props.fallbackName ? `${this.props.fallbackName.toUpperCase()} Module` : "Dashboard Module"} Temporary Notice
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
              {this.state.errorMessage}
            </p>
          </div>
          <Button
            onClick={this.handleReset}
            size="sm"
            className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Reload Module View
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default TabErrorBoundary;
