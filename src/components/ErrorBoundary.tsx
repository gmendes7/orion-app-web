/**
 * 🛡️ ErrorBoundary — Proteção global contra crash total
 * Captura erros React não tratados e exibe fallback.
 */

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🛡️ ErrorBoundary caught:", error.message, errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex items-center justify-center h-[100dvh] bg-background text-foreground p-6">
          <div className="text-center max-w-md space-y-4">
            <div className="text-4xl">⚠️</div>
            <h1 className="text-xl font-semibold tracking-wide">ORION — Erro Inesperado</h1>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || "Um erro inesperado ocorreu no sistema."}
            </p>
            <button
              onClick={this.handleRetry}
              className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-mono hover:opacity-90 transition-opacity"
            >
              REINICIAR
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
