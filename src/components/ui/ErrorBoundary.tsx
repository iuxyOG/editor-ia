'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-10 h-10 text-error mb-3" />
          <h3 className="font-heading font-semibold text-text-primary mb-1">
            Algo deu errado
          </h3>
          <p className="text-sm text-text-secondary mb-4 max-w-xs">
            {this.props.fallbackMessage || 'Este componente encontrou um erro inesperado.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            <RefreshCw className="w-4 h-4" /> Tentar novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
