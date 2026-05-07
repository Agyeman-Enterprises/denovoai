"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div className="rounded border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          Something went wrong. Please refresh the page.
        </div>
      );
    }
    return this.props.children;
  }
}
