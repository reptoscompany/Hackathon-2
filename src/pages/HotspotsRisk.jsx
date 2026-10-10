import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components';
import { Badge } from '@/components';
import { Chart } from '@/components';
import { LoadingState, ErrorState } from '@/components/DataState';
import { useData } from '@/services/DataContext';
import { DEFAULT_WEIGHTS, WEIGHT_LABELS, buildWardHotspots, RISK_COLORS } from '@/utils/geo';

const TIME_WINDOWS = ['Morning (6-12)', 'Afternoon (12-18)', 'Evening (18-22)', 'Night (22-6)'];

function windowShare(list, window) {
  const inWin = list.filter((i) => {
    const h = parseInt(i.incident_time.split(':')[0], 10);
    if (window.startsWith('Morning')) return h >= 6 && h < 12;
    if (window.startsWith('Afternoon')) return h >= 12 && h < 18;
    if (window.startsWith('Evening')) return h >= 18 && h < 22;
    return h >= 22 || h < 6;
  });
  return list.length ? inWin.length / list.length : 0;
}

export function HotspotsRisk() {
  const { services, loading, error } = useData();
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);

  const hotspots = useMemo(
    () => (services ? buildWardHotspots(services.incidents, services.landmarks, weights) : []),
    [services, weights]
  );

  const predictive = useMemo(() => {
    if (!services) return [];
    const byWard = {};
    services.incidents.forEach((i) => {
      if (!byWard[i.ward]) byWard[i.ward] = [];
      byWard[i.ward].push(i);
    });
    return Object.entries(byWard)
      .slice(0, 6)
      .map(([ward, list]) => {
        const avgSev = list.reduce((s, i) => s + i.severity, 0) / list.length;
        const cells = TIME_WINDOWS.map((w) => {
          const share = windowShare(list, w);
          const score = share * 0.6 + avgSev * 0.4;
          return { window: w, level: score >= 0.55 ? 'High' : score >= 0.35 ? 'Medium' : 'Low', share: Number(share.toFixed(2)) };
        });
        return { ward, count: list.length, avgSev: Number(avgSev.toFixed(2)), cells };
      });
  }, [services]);

  if (loading) return <div className="p-6"><LoadingState message="Loading hotspot analysis…" /></div>;
  if (error || !services) return <div className="p-6"><ErrorState message="Hotspot data could not be loaded." onRetry={() => window.location.reload()} /></div>;

  const top = hotspots[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-navy-900)]">Hotspots &amp; Risk</h1>
        <p className="text-[var(--color-text-secondary)]">Explainable weighted scoring + simulated predictive risk by area and time window</p>
      </div>

      <div className="p-3 rounded-md border border-[var(--color-border)] bg-[var(--color-navy-50)] text-sm text-[var(--color-text-primary)]" role="note">
        <strong>Simulated risk estimation for prototype purposes. Predicts places and time periods, never individuals.</strong>
        <span className="text-[var(--color-text-secondary)]"> No trained model, no accuracy claims. Scores are an illustrative weighted sum — one serious assault can outweigh several minor complaints because severity carries heavy weight.</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ward hotspots (illustrative scoring model)</CardTitle>
              <CardDescription>Green Low · Yellow Moderate · Orange High · Red Critical. Labels accompany every color.</CardDescription>
            </CardHeader>
            <CardContent>
              <Chart
                height={300}
                option={{
                  tooltip: { trigger: 'axis', valueFormatter: (v) => (typeof v === 'number' ? v.toFixed(3) : v) },
                  xAxis: { type: 'category', data: hotspots.slice(0, 8).map((h) => h.ward.replace('Ward ', 'W')) },
                  yAxis: { type: 'value', max: 1 },
                  series: [{
                    type: 'bar',
                    data: hotspots.slice(0, 8).map((h) => ({ value: h.score, itemStyle: { color: RISK_COLORS[h.level], borderRadius: [4, 4, 0, 0] } })),
                    label: { show: true, position: 'top', formatter: (p) => hotspots[p.dataIndex].level, fontSize: 10 },
                    barMaxWidth: 40
                  }]
                }}
              />
              <ul className="mt-4 divide-y divide-[var(--color-border)]">
                {hotspots.slice(0, 8).map((h) => (
                  <li key={h.ward} className="py-2.5 flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: RISK_COLORS[h.level] }} aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{h.ward}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {h.count} incidents · avg severity {(h.avgSeverity * 100).toFixed(0)}% · {(h.eveningShare * 100).toFixed(0)}% evening · {h.recentCount} in last 30 days
                      </p>
                    </div>
                    <Badge size="sm" variant={h.level === 'Critical' ? 'danger' : h.level === 'High' ? 'orange' : h.level === 'Moderate' ? 'warning' : 'success'}>
                      {h.level} · {h.score.toFixed(2)}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Predictive risk by area × time window (simulated)</CardTitle>
              <CardDescription>Inputs: incident count, severity, recurrence, proximity to markets/bus stops/schools, evening concentration, density, recent history. Levels only — never individuals.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Area</th>
                      {TIME_WINDOWS.map((w) => <th key={w} scope="col">{w}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {predictive.map((row) => (
                      <tr key={row.ward}>
                        <td className="font-medium">{row.ward}<span className="block text-xs font-normal text-[var(--color-text-muted)]">{row.count} cases · sev {(row.avgSev * 100).toFixed(0)}%</span></td>
                        {row.cells.map((c) => (
                          <td key={c.window}>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{ background: `${RISK_COLORS[c.level === 'Medium' ? 'Moderate' : c.level]}1a`, color: RISK_COLORS[c.level === 'Medium' ? 'Moderate' : c.level] }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: RISK_COLORS[c.level === 'Medium' ? 'Moderate' : c.level] }} aria-hidden="true" />
                              {c.level} · {(c.share * 100).toFixed(0)}%
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Factor weights (adjustable)</CardTitle>
              <CardDescription>Scores renormalize automatically. The top hotspot updates live.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(DEFAULT_WEIGHTS).map((key) => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <label htmlFor={`w-${key}`} className="font-medium text-[var(--color-text-primary)]">{WEIGHT_LABELS[key]}</label>
                    <span className="tabular-nums text-[var(--color-text-secondary)]">{Math.round(weights[key] * 100)}%</span>
                  </div>
                  <input id={`w-${key}`} type="range" min="0" max="100" value={Math.round(weights[key] * 100)}
                    onChange={(e) => setWeights((w) => ({ ...w, [key]: Number(e.target.value) / 100 }))}
                    className="!p-0" aria-label={`${WEIGHT_LABELS[key]} weight`} />
                </div>
              ))}
              <Button variant="outline" size="sm" fullWidth onClick={() => setWeights(DEFAULT_WEIGHTS)}>Reset weights</Button>
              {top && (
                <p className="text-xs text-[var(--color-text-muted)] flex gap-1.5">
                  <Info className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  Current top: {top.ward} ({top.level}, {top.score.toFixed(2)}). Formula: score = Σ normalized-weight × factor, each factor in [0,1].
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to read this</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[var(--color-text-secondary)] space-y-2">
              <p>Low (green): routine presence. Moderate (yellow): watch weekly. High (orange): dedicated evening patrols. Critical (red): immediate deployment review.</p>
              <p>Predictions describe places and time periods from historical sample data. They are not evidence and must never label individuals.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
