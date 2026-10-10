import { forwardRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const KPICard = forwardRef(function KPICard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon, 
  trend = 'neutral',
  className = '',
  ...props 
}, ref) {
  const trendIcons = {
    up: <TrendingUp className="w-4 h-4" aria-hidden="true" />,
    down: <TrendingDown className="w-4 h-4" aria-hidden="true" />,
    neutral: <Minus className="w-4 h-4" aria-hidden="true" />
  };

  const trendColors = {
    up: 'text-[var(--color-crime-resolved)]',
    down: 'text-[var(--color-crime-assault)]',
    neutral: 'text-[var(--color-text-muted)]'
  };

  return (
    <div
      ref={ref}
      className={`
        bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 sm:p-6
        transition-shadow hover:shadow-md min-w-0
        ${className}
      `}
      {...props}
    >
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] tabular-nums animate-count-up break-words">
            {value}
          </p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className={`text-sm font-medium ${trendColors[trend]}`}>
                {trendIcons[trend]}
                {change >= 0 ? '+' : ''}{change}{changeLabel ? `%` : ''}
              </span>
              {changeLabel && (
                <span className="text-sm text-[var(--color-text-muted)]">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[var(--color-accent-light)] flex items-center justify-center text-[var(--color-accent)] flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
});
KPICard.displayName = 'KPICard';

const KPICardSecondary = forwardRef(function KPICardSecondary({ 
  title, 
  value, 
  subtitle,
  className = '',
  ...props 
}, ref) {
  return (
    <div
      ref={ref}
      className={`
        bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4
        ${className}
      `}
      {...props}
    >
      <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">{title}</p>
      <p className="mt-1 text-xl font-bold text-[var(--color-text-primary)] tabular-nums">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{subtitle}</p>}
    </div>
  );
});
KPICardSecondary.displayName = 'KPICardSecondary';

export { KPICard, KPICardSecondary };