import { Link } from 'react-router-dom';
import { AlertTriangle, Bell, CheckCheck, Flame, Siren, TrendingUp, X } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { useAlerts } from '@/services/AlertContext';

const TYPE_META = {
  sharp_increase: { icon: TrendingUp, label: 'Sharp increase', route: '/dashboard' },
  high_severity: { icon: Siren, label: 'High severity', route: '/crime-map' },
  hotspot_threshold: { icon: Flame, label: 'Hotspot threshold', route: '/hotspots-risk' },
  patrol_need: { icon: AlertTriangle, label: 'Patrol need', route: '/patrol-planner' }
};

export function AlertsPanel({ onClose }) {
  const { alerts, markRead, markAllRead, dismiss } = useAlerts();

  return (
    <div className="absolute right-0 top-full mt-2 w-[22rem] max-w-[90vw] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl z-[var(--z-dropdown)]">
      <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
        <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <Bell className="w-4 h-4" aria-hidden="true" /> Alerts
          <Badge variant="gray" size="sm">{alerts.length}</Badge>
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={markAllRead} aria-label="Mark all alerts as read">
            <CheckCheck className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close alerts panel">
            <X className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="max-h-96 overflow-auto p-2">
        {alerts.length === 0 ? (
          <p className="px-4 py-8 text-center text-[var(--color-text-muted)] text-sm">
            No active alerts. Alerts trigger on sharp increases, new high-severity incidents, hotspot thresholds, and urgent patrol needs.
          </p>
        ) : (
          <ul className="space-y-1">
            {alerts.map((alert) => {
              const meta = TYPE_META[alert.type] || TYPE_META.sharp_increase;
              const Icon = meta.icon;
              return (
                <li
                  key={alert.id}
                  className={`p-3 rounded-md border transition-colors ${alert.read ? 'border-transparent' : 'border-[var(--color-border)] bg-[var(--color-navy-50)]'}`}
                >
                  <div className="flex items-start gap-2">
                    <Icon
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${alert.severity === 'critical' ? 'text-[var(--color-crime-assault)]' : 'text-[var(--color-crime-traffic)]'}`}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{alert.title}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{alert.message}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Link
                          to={meta.route}
                          onClick={() => { markRead(alert.id); onClose?.(); }}
                          className="text-xs font-medium text-[var(--color-accent)] hover:underline"
                        >
                          View in {meta.label}
                        </Link>
                        <button
                          type="button"
                          onClick={() => markRead(alert.id)}
                          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                        >
                          Mark read
                        </button>
                        <button
                          type="button"
                          onClick={() => dismiss(alert.id)}
                          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                    {!alert.read && <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] flex-shrink-0 mt-1.5" aria-label="Unread" />}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
