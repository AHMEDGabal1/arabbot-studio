import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: '2rem',
            textAlign: 'center',
            color: '#f5ede6',
            fontFamily: '"DM Sans", sans-serif',
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h2>
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: '1px solid #2a3050',
                background: '#1a1f2e',
                color: '#f5ede6',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Reload Page
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
