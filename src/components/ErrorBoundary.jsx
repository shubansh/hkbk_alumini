import React from 'react';
import { AlertCircle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-red-100 dark:border-red-900/30 m-4">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-2 text-center max-w-md">
            We encountered an unexpected error while loading this section.
          </p>
          {this.state.error && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 max-w-lg w-full text-left overflow-auto">
              <p className="text-red-700 dark:text-red-400 font-mono text-xs">{this.state.error.toString()}</p>
              <p className="text-red-600 dark:text-red-500 font-mono text-[10px] mt-2 whitespace-pre-wrap">{this.state.error.stack}</p>
            </div>
          )}
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}
