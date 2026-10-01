import { Component } from 'react'
import { Link } from 'react-router-dom'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) console.error(error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="grid min-h-screen place-items-center bg-canvas px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Something went wrong.</h1>
          <p className="mt-2 text-sm text-muted">The page hit an unexpected error. You can go back to the start.</p>
          <Link to="/" className="mt-5 inline-flex rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white" onClick={() => this.setState({ failed: false })}>
            Return home
          </Link>
        </div>
      </div>
    )
  }
}
