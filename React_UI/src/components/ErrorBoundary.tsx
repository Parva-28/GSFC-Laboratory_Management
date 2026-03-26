import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // In a real app we might also log this to Sentry or another service here
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border-t-4 border-red-500">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              The application encountered an unexpected error. Our team has been notified.
            </p>
            {this.state.error && (
                <div className="bg-gray-100 p-3 rounded text-left text-xs text-red-800 font-mono mb-6 overflow-auto max-h-32">
                    {this.state.error.toString()}
                </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-red-700 transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
