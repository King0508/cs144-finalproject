import { Component, type ErrorInfo, type ReactNode } from "react";
import { Logo } from "../ui/Logo";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Top-level React error boundary. Catches render-time exceptions anywhere in
 * the tree and shows a recoverable fallback instead of a blank white screen.
 * Error boundaries must be class components (no hook equivalent for
 * getDerivedStateFromError / componentDidCatch).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[error-boundary]", error, info.componentStack);
  }

  private handleReload = (): void => {
    this.setState({ error: null });
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <main className="grid min-h-screen place-items-center bg-bg px-6" role="alert">
          <div className="flex max-w-md flex-col items-center gap-4 text-center">
            <Logo size="md" decorative />
            <h1 className="display-sm">Something went wrong.</h1>
            <p className="body text-ink-soft">
              An unexpected error occurred while rendering the app. Reloading usually fixes it.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="border border-line-strong px-4 py-2 text-sm uppercase tracking-[0.18em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
            >
              Reload app
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
