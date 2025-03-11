import { Component, type ReactNode } from 'react';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ErrorBoundary');

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error) {
    logger.error('Uncaught error:', error);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-red-800 font-semibold">Algo deu errado</h2>
          <button
            className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
            onClick={() => this.setState({ hasError: false })}
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}