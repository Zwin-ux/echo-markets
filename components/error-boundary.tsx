"use client"

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error }: { error?: Error }) {
  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono flex items-center justify-center">
      <div className="text-center p-8 border border-red-500/30 rounded bg-red-500/10">
        <h1 className="text-2xl font-bold text-red-400 mb-4">Application Error</h1>
        <p className="text-cyan-300 mb-4">Something went wrong. Please refresh the page.</p>
        {error && (
          <details className="text-left text-xs text-gray-400 mt-4">
            <summary className="cursor-pointer">Error Details</summary>
            <pre className="mt-2 p-2 bg-black/50 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-cyan-600 text-black rounded hover:bg-cyan-700"
        >
          Refresh Page
        </button>
      </div>
    </div>
  )
}

export default ErrorBoundary