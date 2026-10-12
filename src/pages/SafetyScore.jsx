import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ShieldCheck, AlertTriangle, Lightbulb, Video, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components';
import { Badge } from '@/components';
import { Chart } from '@/components';
import { LoadingState, ErrorState } from '@/components/DataState';
import { ExportMenu } from '@/components/ExportMenu';
import { useData } from '@/services/DataContext';
import { PONDY_BOUNDS } from '@/utils/pondyLive';

const CENTER = [11.9416, 79.8083];

/** Map pin in safety-zone colour (green / yellow / red). No radius circles. */
function pinIcon(color, selected = false) {
  const size = selected ? 40 : 32;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;position:relative;filter:drop-shadow(0 2px 3px rgb(0 0 0 / .35));${selected ? 'transform:scale(1.15);' : ''}">`
      + `<svg viewBox="0 0 24 36" width="${size}" height="${size}" aria-hidden="true">`
      + `<path d="M12 1 C5.4 1 1 5.4 1 12 C1 20 12 35 12 35 C12 35 23 20 23 12 C23 5.4 18.6 1 12 1 Z" fill="${color}" stroke="#fff" stroke-width="2"/>`
      + `<circle cx="12" cy="12" r="4.5" fill="#fff"/>`
      + `</svg></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 2],
    popupAnchor: [0, -size + 4]
  });
}

const SAFETY_COLORS = {
  Safe: '#16a34a',
  Moderate: '#f59e0b',
  Vulnerable: '#D71920'
};

const DEFAULT_SAFETY_WEIGHTS = { w1: 0.3, w2: 0.25, w3: 0.25, w4: 0.35 };

// Deterministic pseudo-environmental factors per ward (synthetic, seed-stable).
// No backend needed; derived from ward name hash so demo is reproducible.
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function envFactorsForWard(ward, incidentDensity) {
  const h = hashStr(ward);
  const pick = (salt) => ((h + salt * 7919) % 100) / 100;
  // Mix hash with incident density so high-crime wards skew darker, but
  // lighting/CCTV/footfall still vary independently (CPTED idea).
  const footfall = Math.min(1, Math.max(0.05, 0.2 + pick(1) * 0.7 - incidentDensity * 0.25));
  const cctv = Math.min(1, Math.max(0.05, 0.15 + pick(2) * 0.75 - incidentDensity * 0.15));
  const lighting = Math.min(1, Math.max(0.05, 0.2 + pick(3) * 0.7 - incidentDensity * 0.2));
  return {
    footfall: Number(footfall.toFixed(2)),
    cctv: Number(cctv.toFixed(2)),
    lighting: Number(lighting.toFixed(2)),
    incidentDensity: Number(incidentDensity.toFixed(2))
  };
}

function safetyScore(f, w) {
  const raw = w.w1 * f.footfall + w.w2 * f.cctv + w.w3 * f.lighting - w.w4 * f.incidentDensity;
  return Math.min(1, Math.max(0, raw));
}

function safetyZone(score) {
  if (score >= 0.6) return 'Safe';
  if (score >= 0.38) return 'Moderate';
  return 'Vulnerable';
}

function fixSuggestion(f) {
  const entries = [
    ['footfall', f.footfall, 'Add evening beat + encourage active frontage (shops, transit stops)'],
    ['cctv', f.cctv, 'Add 1–2 CCTV + signboard; clear blind spot'],
    ['lighting', f.lighting, 'Add/improve street lighting + trim openness']
  ].sort((a, b) => a[1] - b[1]);
  return entries[0];
}

export function SafetyScore() {
  const { services, loading, error } = useData();
  const [weights, setWeights] = useState(DEFAULT_SAFETY_WEIGHTS);
  const [selectedWard, setSelectedWard] = useState('');

  const zones = useMemo(() => {
    if (!services) return [];
    const byWard = {};
    services.incidents.forEach((i) => {
      if (!byWard[i.ward]) byWard[i.ward] = [];
      byWard[i.ward].push(i);
    });
    const maxCount = Math.max(1, ...Object.values(byWard).map((l) => l.length));
    return Object.entries(byWard)
      .map(([ward, list]) => {
        const incidentDensity = list.length / maxCount;
        const factors = envFactorsForWard(ward, incidentDensity);
        const score = safetyScore(factors, weights);
        const zone = safetyZone(score);
        const lats = list.map((i) => i.latitude);
        const lngs = list.map((i) => i.longitude);
        return {
          ward,
          count: list.length,
          factors,
          score: Number(score.toFixed(3)),
          score100: Math.round(score * 100),
          zone,
          center: [lats.reduce((s, v) => s + v, 0) / lats.length, lngs.reduce((s, v) => s + v, 0) / lngs.length]
        };
      })
      .sort((a, b) => a.score - b.score);
  }, [services, weights]);

  if (loading) return <div className="p-6"><LoadingState message="Loading safety scores…" /></div>;
  if (error || !services) return <div className="p-6"><ErrorState message="Safety data could not be loaded." onRetry={() => window.location.reload()} /></div>;

  const greens = zones.filter((z) => z.zone === 'Safe');
  const ambers = zones.filter((z) => z.zone === 'Moderate');
  const reds = zones.filter((z) => z.zone === 'Vulnerable');
  const selected = zones.find((z) => z.ward === (selectedWard || reds[0]?.ward || zones[0]?.ward)) || zones[0];
  const selectedFix = selected ? fixSuggestion(selected.factors) : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-navy-900)]">Safety Score &amp; Vulnerability Assessment</h1>
        <p className="text-[var(--color-text-secondary)]">Environmental Safety &amp; Vulnerability Heatmap — Women Safety &amp; CPTED Engine · proactive scoring, not just reactive crime dots</p>
        <div className="flex gap-1.5 flex-wrap mt-2">
          <Badge size="sm" variant="gray">Puducherry only</Badge>
          <Badge size="sm" variant="success" dot>Simulated live scores</Badge>
        </div>
      </div>

      <div className="p-3 rounded-md border border-[var(--color-border)] bg-[var(--color-navy-50)] text-sm text-[var(--color-text-primary)]" role="note">
        <strong>Proactive environmental score (simulated).</strong>
        <span className="text-[var(--color-text-secondary)]"> Aggregated at ward / street-segment level only — zero identifying pins, survivor anonymity preserved. Scores describe places, never people.</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Green Spots · Safe', count: greens.length, desc: 'High crowd, strong lighting, visible CCTV', color: SAFETY_COLORS.Safe, icon: ShieldCheck },
          { label: 'Yellow Spots · Moderate', count: ambers.length, desc: 'Average footfall, moderate light, partial CCTV', color: SAFETY_COLORS.Moderate, icon: Lightbulb },
          { label: 'Red Spots · High-Vulnerability', count: reds.length, desc: 'Isolated, poor light, blind spots + past density', color: SAFETY_COLORS.Vulnerable, icon: AlertTriangle }
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${c.color}1a` }}>
                <c.icon className="w-5 h-5" style={{ color: c.color }} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-[var(--color-text-primary)] text-sm">{c.label}: {c.count}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{c.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card padded={false}>
            <div className="rounded-lg overflow-hidden h-[60vh] min-h-[320px] max-h-[480px]">
              <MapContainer center={CENTER} zoom={12} minZoom={11} maxZoom={18} maxBounds={PONDY_BOUNDS} maxBoundsViscosity={1.0} style={{ height: '100%', width: '100%' }} aria-label="Environmental safety heatmap (Puducherry only)">
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {zones.map((z) => (
                  <Marker
                    key={z.ward}
                    position={z.center}
                    icon={pinIcon(SAFETY_COLORS[z.zone], selected?.ward === z.ward)}
                    eventHandlers={{ click: () => setSelectedWard(z.ward) }}
                    title={`${z.ward} · ${z.zone} ${z.score100}/100`}
                  >
                    <Popup>
                      <strong>{z.ward}</strong><br />
                      {z.zone} · Safety {z.score100}/100<br />
                      Footfall {(z.factors.footfall * 100).toFixed(0)}% · CCTV {(z.factors.cctv * 100).toFixed(0)}% · Light {(z.factors.lighting * 100).toFixed(0)}%<br />
                      {z.count} past incidents
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ward safety ranking (lowest first — red needs patrol tonight)</CardTitle>
              <CardDescription>Formula: w1·Footfall + w2·CCTV + w3·Lighting − w4·Incident Density. Click a row to inspect. Green ≥60 · Yellow 38–59 · Red &lt;38.</CardDescription>
            </CardHeader>
            <CardContent>
              <Chart
                height={280}
                option={{
                  tooltip: { trigger: 'axis', valueFormatter: (v) => (typeof v === 'number' ? `${v}/100` : v) },
                  xAxis: { type: 'category', data: zones.slice(0, 10).map((z) => z.ward.replace('Ward ', 'W')) },
                  yAxis: { type: 'value', max: 100 },
                  series: [{
                    type: 'bar',
                    data: zones.slice(0, 10).map((z) => ({ value: z.score100, itemStyle: { color: SAFETY_COLORS[z.zone], borderRadius: [4, 4, 0, 0] } })),
                    label: { show: true, position: 'top', fontSize: 10, formatter: (p) => zones[p.dataIndex].zone },
                    barMaxWidth: 40
                  }]
                }}
              />
              <ul className="mt-4 divide-y divide-[var(--color-border)] max-h-96 overflow-auto">
                {zones.map((z) => (
                  <li key={z.ward}>
                    <button type="button" onClick={() => setSelectedWard(z.ward)}
                      className={`w-full flex items-center gap-3 py-3 px-2 rounded text-left min-h-[44px] hover:bg-[var(--color-navy-50)] ${selected?.ward === z.ward ? 'bg-[var(--color-navy-50)]' : ''}`}>
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: SAFETY_COLORS[z.zone] }} aria-hidden="true" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-[var(--color-text-primary)] truncate">{z.ward} · {z.score100}/100</span>
                        <span className="block text-xs text-[var(--color-text-muted)] truncate">
                          Foot {(z.factors.footfall * 100).toFixed(0)}% · CCTV {(z.factors.cctv * 100).toFixed(0)}% · Light {(z.factors.lighting * 100).toFixed(0)}% · Past {z.count}
                        </span>
                        <span className="block h-1.5 mt-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                          <span className="block h-full rounded-full" style={{ width: `${z.score100}%`, background: SAFETY_COLORS[z.zone] }} />
                        </span>
                      </span>
                      <Badge size="sm" variant={z.zone === 'Vulnerable' ? 'danger' : z.zone === 'Moderate' ? 'warning' : 'success'}>{z.zone}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 no-print">
                <ExportMenu filename="safety-scores.csv" rows={zones} columns={[
                  { key: 'ward', header: 'ward' }, { key: 'zone', header: 'zone' }, { key: 'score100', header: 'safety_score_100' },
                  { key: 'count', header: 'past_incidents' }
                ]} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scoring weights (adjustable)</CardTitle>
              <CardDescription>Safety = w1·Footfall + w2·CCTV + w3·Lighting − w4·History. Map + ranking update live.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ['w1', 'Footfall / Roaming Density', <Users key="i1" className="w-4 h-4" aria-hidden="true" />],
                ['w2', 'CCTV Coverage', <Video key="i2" className="w-4 h-4" aria-hidden="true" />],
                ['w3', 'Lighting & Openness', <Lightbulb key="i3" className="w-4 h-4" aria-hidden="true" />],
                ['w4', 'Historical Incident Density (subtracted)', <AlertTriangle key="i4" className="w-4 h-4" aria-hidden="true" />]
              ].map(([key, label]) => (
                <div key={key} className="min-w-0">
                  <div className="flex justify-between gap-2 text-sm mb-1">
                    <label htmlFor={`sw-${key}`} className="font-medium text-[var(--color-text-primary)] min-w-0">{label}</label>
                    <span className="tabular-nums text-[var(--color-text-secondary)] flex-shrink-0">{Math.round(weights[key] * 100)}%</span>
                  </div>
                  <input id={`sw-${key}`} type="range" min="0" max="60" value={Math.round(weights[key] * 100)}
                    onChange={(e) => setWeights((w) => ({ ...w, [key]: Number(e.target.value) / 100 }))}
                    className="w-full h-11 touch-manipulation" aria-label={`${label} weight`} />
                </div>
              ))}
              <Button variant="outline" size="sm" fullWidth onClick={() => setWeights(DEFAULT_SAFETY_WEIGHTS)}>Reset weights</Button>
            </CardContent>
          </Card>

          {selected && (
            <Card>
              <CardHeader>
                <CardTitle>{selected.ward} · {selected.zone} · {selected.score100}/100</CardTitle>
                <CardDescription>Why this score + how to turn red to green (simulated factors).</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-[var(--color-text-secondary)]">Footfall {(selected.factors.footfall * 100).toFixed(0)}% · CCTV {(selected.factors.cctv * 100).toFixed(0)}% · Lighting {(selected.factors.lighting * 100).toFixed(0)}% · Past-density {(selected.factors.incidentDensity * 100).toFixed(0)}%</p>
                <p className="font-medium text-[var(--color-text-primary)]">Weakest link: {selectedFix[0]} — {selectedFix[2]}.</p>
                <p className="text-xs text-[var(--color-text-muted)]">Aggregated estimate for demo. Field survey needed before works.</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>For Police · For Citizens</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div>
                <p className="font-medium text-[var(--color-text-primary)] flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" aria-hidden="true" /> Patrols → red zones at night</p>
                <p className="text-[var(--color-text-secondary)]">Tonight 22:00–02:00: {reds.slice(0, 3).map((r) => r.ward).join(', ') || 'no red zones'} — mobile + beat pair, CCTV blind-spot check.</p>
                <Link to="/patrol-planner" className="inline-flex items-center gap-1 text-[var(--color-accent)] font-medium mt-1 min-h-[44px]">
                  Open Patrol Planner <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="pt-2 border-t border-[var(--color-border)]">
                <p className="font-medium text-[var(--color-text-primary)]">Commuters → green corridors</p>
                <p className="text-[var(--color-text-secondary)]">Prefer: {greens.slice(0, 3).map((g) => `${g.ward} (${g.score100})`).join(', ') || '—'}. Avoid isolated alleys in red zones after dark.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ask AI about this zone</CardTitle>
              <CardDescription>AI Assistant explains any red zone + suggests fixes.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="text-[var(--color-text-secondary)]">Try in AI Assistant: “Why is {selected?.ward} {selected?.zone} ({selected?.score100}/100) and how do we fix it?”</p>
              <Link to="/ai-assistant" className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium rounded-md bg-transparent border border-[var(--color-border-strong)] hover:bg-[var(--color-navy-50)] min-h-[44px]">
                Open AI Assistant <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <p className="text-xs text-[var(--color-text-muted)]">AI reads the same w1–w4 breakdown. Simulated, not evidence.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
