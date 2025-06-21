import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isNetworkError: false,
      isOnline: navigator.onLine,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidMount() {
    // Listen for network status changes
    window.addEventListener('online', this.handleNetworkChange);
    window.addEventListener('offline', this.handleNetworkChange);
  }

  componentWillUnmount() {
    // Clean up event listeners
    window.removeEventListener('online', this.handleNetworkChange);
    window.removeEventListener('offline', this.handleNetworkChange);
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);

    // Check if this is a network-related error
    const isNetworkError = this.isNetworkRelatedError(error);

    // Store error details in state for display
    this.setState({
      error,
      errorInfo,
      isNetworkError,
    });

    // In production, you might want to log this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
      console.warn('Error logged to console in production build');
    }

    // Try to log to Firebase for tracking
    try {
      // You could integrate with Firebase Analytics here
      // analytics.logEvent('error_boundary_triggered', {
      //   error_message: error.message,
      //   error_stack: error.stack,
      //   error_info: JSON.stringify(errorInfo)
      // });
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  }

  handleReload = () => {
    // Clear error state and reload the page
    window.location.reload();
  };

  handleNetworkChange = () => {
    const isOnline = navigator.onLine;
    this.setState({ isOnline });
    
    // If we're back online and it was a network error, try to auto-recover
    if (isOnline && this.state.isNetworkError && this.state.hasError) {
      setTimeout(() => {
        this.handleRetry();
      }, 1000); // Wait 1 second after coming back online
    }
  };

  isNetworkRelatedError = (error) => {
    const networkErrorMessages = [
      'Network Error',
      'Failed to fetch',
      'NetworkError',
      'offline',
      'timeout',
      'NETWORK_REQUEST_FAILED',
      'auth/network-request-failed',
    ];
    
    return networkErrorMessages.some(msg => 
      error.message?.toLowerCase().includes(msg.toLowerCase()) ||
      error.code?.toLowerCase().includes(msg.toLowerCase())
    );
  };

  handleReset = () => {
    // Clear error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isNetworkError: false,
      retryCount: 0,
    });
  };

  handleRetry = () => {
    // Increment retry count and reset if network is available
    if (!navigator.onLine) {
      alert('No internet connection. Please check your network and try again.');
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isNetworkError: false,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleReportError = () => {
    // Create a simple error report
    const errorReport = {
      id: this.state.errorId,
      message: this.state.error?.message || 'Unknown error',
      stack: this.state.error?.stack || 'No stack trace',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Copy to clipboard for easy sharing
    if (navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
        .then(() => {
          alert('Error report copied to clipboard! Please share this with support.');
        })
        .catch(() => {
          console.log('Error report:', errorReport);
          alert('Error report logged to console. Please check browser console.');
        });
    } else {
      console.log('Error report:', errorReport);
      alert('Error report logged to console. Please check browser console.');
    }
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI when error occurs
      return (
        <div style={{
          padding: '2rem',
          maxWidth: '600px',
          margin: '2rem auto',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
          >
            <div style={{
              fontSize: '2rem',
              marginRight: '0.5rem',
            }}
            >🚨
            </div>
            <h2 style={{
              color: '#dc2626',
              fontSize: '1.5rem',
              fontWeight: '600',
              margin: 0,
            }}
            >
              Oops! Something went wrong
            </h2>
          </div>

          <p style={{
            color: '#7f1d1d',
            marginBottom: '1.5rem',
            lineHeight: '1.5',
          }}
          >
            {this.state.isNetworkError 
              ? 'Network connection problem detected. Your round data is safe and will sync when connection is restored.'
              : 'The Sandbagger app encountered an unexpected error. Don\'t worry - your round data is likely still saved!'
            }
          </p>

          {/* Network status indicator */}
          {this.state.isNetworkError && (
            <div style={{
              backgroundColor: this.state.isOnline ? '#d1fae5' : '#fef2f2',
              border: `1px solid ${this.state.isOnline ? '#a7f3d0' : '#fca5a5'}`,
              borderRadius: '6px',
              padding: '0.75rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            >
              <span style={{ fontSize: '1.2rem' }}>
                {this.state.isOnline ? '🟢' : '🔴'}
              </span>
              <span style={{
                color: this.state.isOnline ? '#065f46' : '#7f1d1d',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
              >
                {this.state.isOnline 
                  ? 'Connection restored! You can try again now.' 
                  : 'No internet connection detected.'
                }
              </span>
            </div>
          )}

          {/* Error details for development */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              backgroundColor: '#fef2f2',
              padding: '1rem',
              borderRadius: '4px',
              marginBottom: '1rem',
              border: '1px solid #f87171',
            }}
            >
              <summary style={{
                cursor: 'pointer',
                fontWeight: '500',
                color: '#dc2626',
              }}
              >
                Technical Details (Development Mode)
              </summary>
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                color: '#7f1d1d',
              }}
              >
                <strong>Error:</strong> {this.state.error.message}
                <br /><br />
                <strong>Stack:</strong>
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.75rem',
                  backgroundColor: 'white',
                  padding: '0.5rem',
                  borderRadius: '2px',
                  overflow: 'auto',
                }}
                >
                  {this.state.error.stack}
                </pre>
              </div>
            </details>
          )}

          {/* Action buttons */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
          >
            {this.state.isNetworkError ? (
              <button
                data-testid="retry-network-btn"
                onClick={this.handleRetry}
                disabled={!this.state.isOnline}
                style={{
                  backgroundColor: this.state.isOnline ? '#16a34a' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: this.state.isOnline ? 'pointer' : 'not-allowed',
                  fontSize: '0.875rem',
                }}
              >
                {this.state.isOnline ? '🔄 Retry Connection' : '⏳ Waiting for Network'}
              </button>
            ) : (
              <button
                data-testid="try-again-btn"
                onClick={this.handleReset}
                style={{
                  backgroundColor: '#6366f1',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                🔧 Try Again
              </button>
            )}

            <button
              data-testid="reload-app-btn"
              onClick={this.handleReload}
              style={{
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              🔄 Reload App
            </button>

            <button
              data-testid="copy-error-report-btn"
              onClick={this.handleReportError}
              style={{
                backgroundColor: '#374151',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              📋 Copy Error Report
            </button>
          </div>

          {/* Error ID for support */}
          <div style={{
            marginTop: '1.5rem',
            fontSize: '0.75rem',
            color: '#6b7280',
            borderTop: '1px solid #d1d5db',
            paddingTop: '0.75rem',
          }}
          >
            Error ID: {this.state.errorId} | Build: {typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'development'} | Retries: {this.state.retryCount}
          </div>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
