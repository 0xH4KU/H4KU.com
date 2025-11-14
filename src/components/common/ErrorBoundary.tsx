import { Component, ErrorInfo, ReactNode } from 'react';
import { reportError } from '@/services/monitoring';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  referenceId: string | null;
  timestamp: string | null;
  copyStatus: 'idle' | 'copied' | 'error';
}

export class ErrorBoundary extends Component<Props, State> {
  private copyTimeout: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      referenceId: null,
      timestamp: null,
      copyStatus: 'idle',
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      referenceId: null,
      timestamp: null,
      copyStatus: 'idle',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    const referenceId = this.createReferenceId();
    const timestamp = new Date().toISOString();

    this.setState({
      referenceId,
      timestamp,
      copyStatus: 'idle',
    });

    reportError(error, errorInfo, {
      componentStack: errorInfo.componentStack || undefined,
      tags: { referenceId },
      extra: { timestamp },
    });

    this.props.onError?.(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.copyTimeout) {
      window.clearTimeout(this.copyTimeout);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      referenceId: null,
      timestamp: null,
      copyStatus: 'idle',
    });
  };

  private createReferenceId() {
    const random = Math.random().toString(36).slice(2, 6);
    return `${Date.now().toString(36)}-${random}`;
  }

  private canCopyDetails() {
    return (
      typeof navigator !== 'undefined' &&
      !!navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    );
  }

  private handleCopyDetails = async () => {
    if (!this.canCopyDetails()) {
      return;
    }

    const { error, referenceId, timestamp } = this.state;
    const payload = [
      'Lum.bio crash report',
      `Reference: ${referenceId ?? 'pending'}`,
      `Timestamp: ${timestamp ?? new Date().toISOString()}`,
      `Message: ${error?.message ?? 'Unknown error'}`,
      `Stack: ${error?.stack ?? 'n/a'}`,
    ].join('\n');

    try {
      await navigator.clipboard?.writeText(payload);
      this.setState({ copyStatus: 'copied' });
      if (this.copyTimeout) {
        window.clearTimeout(this.copyTimeout);
      }
      this.copyTimeout = window.setTimeout(() => {
        this.setState({ copyStatus: 'idle' });
      }, 3000);
    } catch {
      this.setState({ copyStatus: 'error' });
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles['error-container']}>
          <div className={styles['error-content']}>
            <h2 className={styles['error-title']}>Something went wrong</h2>
            <p className={styles['error-message']}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <p className={styles['error-reference']}>
              Reference:{' '}
              <code>
                {this.state.referenceId ? this.state.referenceId : 'pending…'}
              </code>
            </p>
            <div className={styles['error-actions']}>
              <button
                className={styles['error-button']}
                onClick={this.handleReset}
              >
                Try again
              </button>
              <button
                className={styles['error-button-secondary']}
                onClick={() => window.location.reload()}
              >
                Reload page
              </button>
              <button
                className={styles['error-button-tertiary']}
                onClick={this.handleCopyDetails}
                disabled={!this.canCopyDetails()}
                aria-disabled={!this.canCopyDetails()}
              >
                Copy crash report
              </button>
            </div>
            {this.state.copyStatus === 'copied' && (
              <p className={styles['error-copy-status']} role="status">
                Crash report copied to clipboard
              </p>
            )}
            {this.state.copyStatus === 'error' && (
              <p className={styles['error-copy-status']} role="alert">
                Unable to copy crash report. Please email hi@lum.bio manually.
              </p>
            )}
            <div className={styles['error-instructions']}>
              <p className={styles['error-subtitle']}>What you can try:</p>
              <ol className={styles['error-list']}>
                <li>Use “Try again” to recover the previous view.</li>
                <li>Reload the page for a clean session.</li>
                <li>
                  Verify this build by running{' '}
                  <code>npm run integrity:check</code>.
                </li>
              </ol>
              <p className={styles['error-footnote']}>
                Still stuck? Email <a href="mailto:hi@lum.bio">hi@lum.bio</a>{' '}
                and include the reference code above so we can investigate.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
