import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import ErrorPage from './ErrorPage';
import { AlertOctagon } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          icon={<AlertOctagon size={48} />}
          image="/errors/crash.png"
          title="Something went wrong"
          message="The application ran into an unexpected error. Reloading the page usually fixes this."
          primaryAction={{ label: 'Reload App', onClick: () => window.location.reload() }}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
