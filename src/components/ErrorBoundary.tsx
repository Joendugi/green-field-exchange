import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // Here you could send the error to a logging service like Sentry or LogSnag
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full text-center space-y-8 bg-card p-10 rounded-[40px] border border-border shadow-2xl reveal active">
            <div className="flex justify-center">
              <div className="p-4 bg-red-100 rounded-3xl">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold tracking-tight">Something went wrong</h1>
              <p className="text-muted-foreground">
                We've encountered an unexpected error. Don't worry, your data is safe.
              </p>
              {import.meta.env.DEV && (
                <div className="mt-4 p-4 bg-muted rounded-xl text-left overflow-auto max-h-40">
                  <p className="text-xs font-mono text-red-500">{this.state.error?.toString()}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'} 
                className="w-full h-12 rounded-2xl flex items-center justify-center gap-2"
              >
                <Home className="h-4 w-4" />
                Return Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
