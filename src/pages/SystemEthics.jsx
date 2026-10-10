import { Database, FileText, Fingerprint, Map, Bell, BarChart3, Brain, ShieldCheck, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components';
import { Badge } from '@/components';

const MODULES = [
  { icon: Fingerprint, name: 'Authentication', desc: 'JWT/OAuth2 + role-based access (proposed)' },
  { icon: Download, name: 'Data collection', desc: 'FIR, CAD, RMS feeds + GIS layers (proposed)' },
  { icon: Database, name: 'Cleaning', desc: 'Dedup, geocoding, schema checks (proposed)' },
  { icon: Map, name: 'GIS mapping', desc: 'PostGIS store, clustering, heatmaps' },
  { icon: BarChart3, name: 'Analytics', desc: 'Trends, hotspots, patrol windows' },
  { icon: Brain, name: 'Prediction', desc: 'Simulated risk scores — places & periods only' },
  { icon: Bell, name: 'Alerts', desc: 'Threshold + increase triggers' },
  { icon: FileText, name: 'Reporting', desc: 'CSV export + print-friendly PDF view' }
];

const PRINCIPLES = [
  ['Encryption', 'At rest and in transit; audit logs on every sensitive view.'],
  ['Role-based access', 'Analysts see anonymized data; sensitive fields are permission-gated (simulated in this prototype).'],
  ['Victim protection', 'Identities masked in UI and exports; data minimization in every view.'],
  ['Anonymized public data', 'Aggregates only — no individual records in public outputs.'],
  ['Bias testing', 'Validate on real historical data before any deployment; watch for over-policing feedback loops.'],
  ['Predictions are not proof', 'Risk scores guide patrol presence; they never justify action against a person.'],
  ['No profiling', 'Never by caste, religion, income, or background.'],
  ['Record correction', 'Wrong records must be correctable with an audit trail.']
];

export function SystemEthics() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-navy-900)]">System &amp; Ethics</h1>
        <p className="text-[var(--color-text-secondary)]">How the prototype is built — and the safeguards around it</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Architecture (prototype modules)</CardTitle>
          <CardDescription>Data flows left → right. Only mapping, analytics, and simulated prediction run in this prototype.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="System modules">
            {MODULES.map((m, i) => (
              <li key={m.name} className="relative border border-[var(--color-border)] rounded-lg p-3 bg-[var(--color-surface)]">
                <span className="absolute -top-2.5 left-3 bg-[var(--color-navy-900)] text-white text-[11px] font-semibold w-5 h-5 rounded-full flex items-center justify-center" aria-hidden="true">{i + 1}</span>
                <m.icon className="w-5 h-5 text-[var(--color-accent)]" aria-hidden="true" />
                <p className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">{m.name}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{m.desc}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 min-w-0">Suggested production stack <Badge variant="gray" size="sm">proposed, not implemented</Badge></CardTitle>
          <CardDescription>What a real deployment would need — none of this runs in the prototype.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            {[['Database', 'PostgreSQL + PostGIS'], ['API', 'FastAPI or Node service layer'], ['Auth', 'JWT/OAuth2 with RBAC + audit logs'], ['Deploy', 'Docker containers, nightly backups']].map(([k, v]) => (
              <div key={k} className="flex flex-wrap justify-between gap-2 sm:gap-4 border-b border-[var(--color-border)] py-2 min-w-0">
                <span className="text-[var(--color-text-secondary)] flex-shrink-0">{k}</span>
                <span className="font-medium text-[var(--color-text-primary)] text-right min-w-0 break-words">{v}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 min-w-0"><ShieldCheck className="w-5 h-5 shrink-0" aria-hidden="true" /> Ethical &amp; security principles</CardTitle>
          <CardDescription>Designed with Indian data-protection and policing regulations in mind — not a claim of compliance.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-4 md:grid-cols-2">
            {PRINCIPLES.map(([title, desc]) => (
              <li key={title} className="flex gap-3">
                <ShieldCheck className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
