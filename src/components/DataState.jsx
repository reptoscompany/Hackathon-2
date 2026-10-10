import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { Button } from './Button';

export function LoadingState({ message = 'Loading data…' }) {
  return (
    <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
      <div className="text-center">
        <Loader2 className="w-10 h-10 mx-auto text-[var(--color-accent)] animate-spin" aria-hidden="true" />
        <p className="mt-4 text-[var(--color-text-secondary)]">{message}</p>
      </div>
    </div>
  );
}

export function ErrorState({ message = 'Could not load data.', onRetry }) {
  return (
    <div className="flex items-center justify-center py-16" role="alert">
      <div className="text-center max-w-md">
        <AlertTriangle className="w-10 h-10 mx-auto text-[var(--color-crime-assault)]" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">Something went wrong</h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">{message}</p>
        {onRetry && (
          <Button variant="outline" className="mt-4" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ title = 'No results', message = 'Try widening the filters.', icon: Icon = Inbox }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center max-w-md">
        <Icon className="w-10 h-10 mx-auto text-[var(--color-text-muted)]" aria-hidden="true" />
        <h2 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{message}</p>
      </div>
    </div>
  );
}
