import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Widget Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 border border-red-200 bg-red-50/50 rounded-xl flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-red-900">
              {this.props.fallbackMessage || "This section couldn't be loaded"}
            </h3>
            <p className="text-sm text-red-700 mt-1 max-w-sm">
              We encountered a temporary issue displaying this feature. The rest of the app is working normally.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="border-red-200 text-red-700 hover:bg-red-100"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          {import.meta.env.DEV && (
            <pre className="mt-4 p-3 bg-red-100/50 text-red-900 rounded-lg text-[10px] text-left overflow-auto max-w-full">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
