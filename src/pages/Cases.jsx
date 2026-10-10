import { useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components';
import { Card, CardContent } from '@/components';
import { Badge } from '@/components';
import { Input, Select } from '@/components';
import { Table } from '@/components';
import { Drawer } from '@/components';
import { LoadingState, ErrorState, EmptyState } from '@/components/DataState';
import { ExportMenu } from '@/components/ExportMenu';
import { useData } from '@/services/DataContext';
import { useRole } from '@/services/RoleContext';
import { crimeColor } from '@/utils/geo';

const STATUS_FLOW = ['New', 'Under Investigation', 'Evidence Collected', 'Suspect Identified', 'Charges Filed', 'Closed', 'Reopened'];

export function Cases() {
  const { services, loading, error } = useData();
  const { role, canSeeSensitive, maskIncident } = useRole();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [overrides, setOverrides] = useState({});
  const [detail, setDetail] = useState(null);

  const rows = useMemo(() => {
    if (!services) return [];
    let list = services.incidents.map((i) => ({ ...i, status: overrides[i.incident_id] || i.status }));
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((i) =>
        [i.case_number, i.address, i.police_station, i.ward, i.crime_type].some((f) => f.toLowerCase().includes(q))
      );
    }
    if (status) list = list.filter((i) => i.status === status);
    if (type) list = list.filter((i) => i.crime_type === type);
    return list;
  }, [services, query, status, type, overrides]);

  if (loading) return <div className="p-6"><LoadingState message="Loading cases…" /></div>;
  if (error || !services) return <div className="p-6"><ErrorState message="Case data could not be loaded." onRetry={() => window.location.reload()} /></div>;

  const shown = detail ? maskIncident({ ...detail, status: overrides[detail.incident_id] || detail.status }) : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-navy-900)]">Cases</h1>
          <p className="text-[var(--color-text-secondary)]">
            {rows.length} of {services.incidents.length} cases · role: {role.label} (simulated)
            {!canSeeSensitive && ' · victim/suspect fields anonymized'}
          </p>
        </div>
        <ExportMenu filename="crimemap-cases.csv" rows={rows} />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-3 no-print">
            <Input label="Search" placeholder="Case no, address, station, ward…" value={query} onChange={(e) => setQuery(e.target.value)} leftIcon={<Eye className="w-4 h-4" aria-hidden="true" />} />
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}
              options={[{ value: '', label: 'All statuses' }, ...STATUS_FLOW.map((s) => ({ value: s, label: s }))]} />
            <Select label="Crime type" value={type} onChange={(e) => setType(e.target.value)}
              options={[{ value: '', label: 'All types' }, ...services.getUniqueCrimeTypes().map((t) => ({ value: t, label: t }))]} />
          </div>
          <div className="mt-4">
            {rows.length === 0 ? (
              <EmptyState title="No cases match" message="Clear the search or widen the filters." />
            ) : (
              <Table
                columns={[
                  { key: 'case_number', header: 'Case no' },
                  {
                    key: 'crime_type', header: 'Type',
                    render: (r) => (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: crimeColor(r.crime_type) }} aria-hidden="true" />
                        {r.crime_type}
                      </span>
                    )
                  },
                  { key: 'incident_date', header: 'Date' },
                  { key: 'incident_time', header: 'Time' },
                  { key: 'police_station', header: 'Station' },
                  {
                    key: 'status', header: 'Status',
                    render: (r) => <Badge size="sm" variant="gray">{r.status}</Badge>
                  },
                  {
                    key: 'actions', header: 'Detail', sortable: false,
                    render: (r) => (
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDetail(r); }} aria-label={`Open ${r.case_number}`} className="min-h-[44px] min-w-[44px]">
                        Open
                      </Button>
                    )
                  }
                ]}
                data={rows}
                onRowClick={setDetail}
                exportFilename="crimemap-cases.csv"
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Drawer open={!!shown} onClose={() => setDetail(null)} title={shown ? `Case ${shown.case_number}` : 'Case'} description={shown ? `${shown.crime_type} · ${shown.address}` : ''}>
        {shown && (
          <div className="space-y-4 text-sm">
            <dl className="space-y-2">
              {[['Type', shown.crime_type], ['Date / time', `${shown.incident_date} ${shown.incident_time}`],
                ['Station', shown.police_station], ['District / ward', `${shown.district} · ${shown.ward}`],
                ['Severity', `${(shown.severity * 100).toFixed(0)}%`]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-[var(--color-border)] pb-2 min-w-0">
                  <dt className="text-[var(--color-text-secondary)] flex-shrink-0">{k}</dt>
                  <dd className="font-medium text-[var(--color-text-primary)] text-right min-w-0 break-words">{v}</dd>
                </div>
              ))}
            </dl>
            <div>
              <label htmlFor="case-status" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Status (simulated — in-memory only)
              </label>
              <select id="case-status" value={shown.status}
                onChange={(e) => {
                  setOverrides((o) => ({ ...o, [shown.incident_id]: e.target.value }));
                  setDetail((d) => ({ ...d }));
                }}
                className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm">
                {STATUS_FLOW.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">Restricted fields {!canSeeSensitive && <Badge size="sm" variant="gray">Masked for {role.label}</Badge>}</p>
              <p className="text-[var(--color-text-secondary)]">Victim: {shown.victim_age_range} · {shown.victim_gender}</p>
              <p className="text-[var(--color-text-secondary)]">Suspect: {shown.suspect_description}</p>
              <p className="text-[var(--color-text-secondary)]">Officer: {shown.investigating_officer}</p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
