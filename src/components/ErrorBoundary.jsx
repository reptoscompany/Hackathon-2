import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

/** Last-resort guard so a render crash never shows a blank page during the live demo. */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('CRIMEMAP render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-bg)]" role="alert">
          <div className="text-center max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-8 shadow-sm">
            <AlertTriangle className="w-10 h-10 mx-auto text-[var(--color-crime-assault)]" aria-hidden="true" />
            <h1 className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">Something went wrong</h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              The view hit an unexpected error instead of your data. Reloading usually fixes it.
            </p>
            <div className="mt-4 flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()}>Reload page</Button>
              <Button variant="outline" onClick={() => this.setState({ error: null })}>Try again</Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
