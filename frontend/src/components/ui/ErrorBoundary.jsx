import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    sessionStorage.clear()
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#040714] text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-lg w-full bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xl">
              ⚠️
            </div>
            <h1 className="text-2xl font-bold">Application Error</h1>
            <p className="text-sm text-slate-300">
              An unexpected error occurred while rendering the page.
            </p>
            {this.state.error && (
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-red-300 overflow-x-auto">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all"
              >
                Reset Session & Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
