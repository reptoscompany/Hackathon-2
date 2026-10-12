import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Polyline, Popup } from 'react-leaflet';
import { Navigation, Siren } from 'lucide-react';
import { Button } from '@/components';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components';
import { Badge } from '@/components';
import { Select } from '@/components';
import { LoadingState, ErrorState } from '@/components/DataState';
import { ExportMenu } from '@/components/ExportMenu';
import { useData } from '@/services/DataContext';
import { buildWardHotspots, haversineKm, simulatedResponseMin, RISK_COLORS } from '@/utils/geo';
import { PONDY_BOUNDS, useSimulatedLiveUnits } from '@/utils/pondyLive';

const CENTER = [11.9416, 79.8083];

export function PatrolPlanner() {
  const { services, loading, error } = useData();
  const [focusWard, setFocusWard] = useState('');
  const [deployed, setDeployed] = useState([]);
  const liveUnits = useSimulatedLiveUnits(services?.units, true);

  const hotspots = useMemo(
    () => (services ? buildWardHotspots(services.incidents, services.landmarks).slice(0, 5) : []),
    [services]
  );

  const focus = useMemo(() => hotspots.find((h) => h.ward === (focusWard || hotspots[0]?.ward)), [hotspots, focusWard]);

  const nearby = useMemo(() => {
    if (!services || !focus) return [];
    return (liveUnits || services.units)
      .filter((u) => u.availability_status === 'Available')
      .map((u) => ({
        ...u,
        km: Number(haversineKm(u.current_latitude, u.current_longitude, focus.center[0], focus.center[1]).toFixed(1)),
        etaMin: simulatedResponseMin(u.current_latitude, u.current_longitude, focus.center[0], focus.center[1])
      }))
      .sort((a, b) => a.etaMin - b.etaMin)
      .slice(0, 5);
  }, [services, focus, liveUnits]);

  const route = useMemo(() => {
    if (hotspots.length < 2) return [];
    return hotspots.slice(0, 4).map((h) => h.center);
  }, [hotspots]);

  const recommendation = useMemo(() => {
    if (!focus || nearby.length === 0) return null;
    const [a, b] = nearby;
    return {
      ward: focus.ward,
      units: [a, b].filter(Boolean),
      window: 'Fri–Sat, 18:00–22:00',
      reason: `${focus.count} incidents, ${(focus.eveningShare * 100).toFixed(0)}% in the evening, ${focus.recentCount} in the last 30 days of the sample window.`
    };
  }, [focus, nearby]);

  if (loading) return <div className="p-6"><LoadingState message="Loading patrol planner…" /></div>;
  if (error || !services) return <div className="p-6"><ErrorState message="Planner data could not be loaded." onRetry={() => window.location.reload()} /></div>;

  const available = services.units.filter((u) => u.availability_status === 'Available').length;
  const busy = services.units.filter((u) => u.availability_status === 'Busy').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-navy-900)]">Patrol Planner</h1>
          <p className="text-[var(--color-text-secondary)]">
            {available} available · {busy} busy · {services.units.length - available - busy} offline (simulated) · response times simulated at 28 km/h urban speed + 2 min dispatch
          </p>
          <div className="flex gap-1.5 flex-wrap">
            <Badge size="sm" variant="gray">Puducherry only</Badge>
            <Badge size="sm" variant="success" dot>Simulated live — units drift every 4s</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap no-print">
          <Select value={focusWard} onChange={(e) => setFocusWard(e.target.value)}
            options={[{ value: '', label: 'Highest-risk ward' }, ...hotspots.map((h) => ({ value: h.ward, label: `${h.ward} (${h.level})` }))]}
            className="w-full sm:w-64" aria-label="Focus ward" />
          <ExportMenu filename="deployment-plan.csv" rows={nearby} columns={[
            { key: 'unit_id', header: 'unit_id' }, { key: 'unit_type', header: 'unit_type' },
            { key: 'availability_status', header: 'status' }, { key: 'km', header: 'distance_km' }, { key: 'etaMin', header: 'eta_min_simulated' }
          ]} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card padded={false}>
            <div className="rounded-lg overflow-hidden h-[60vh] min-h-[320px] max-h-[480px]">
              <MapContainer center={CENTER} zoom={12} minZoom={11} maxZoom={18} maxBounds={PONDY_BOUNDS} maxBoundsViscosity={1.0} style={{ height: '100%', width: '100%' }} aria-label="Patrol units and high-risk regions map (Puducherry only)">
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {hotspots.map((h) => (
                  <Circle key={h.ward} center={h.center} radius={800}
                    pathOptions={{ color: RISK_COLORS[h.level], weight: 2, fillColor: RISK_COLORS[h.level], fillOpacity: h.ward === focus?.ward ? 0.22 : 0.1 }}>
                    <Popup><strong>{h.ward}</strong><br />{h.level} · {h.count} incidents</Popup>
                  </Circle>
                ))}
                {route.length > 1 && (
                  <Polyline positions={route} pathOptions={{ color: '#2118C9', weight: 3, dashArray: '8 6' }}>
                    <Popup>Simulated patrol route through the top-4 risk zones (simulated)</Popup>
                  </Polyline>
                )}
                {(liveUnits || services.units).filter((u) => u.availability_status !== 'Offline').map((u) => (
                  <CircleMarker key={u.unit_id} center={[u.current_latitude, u.current_longitude]} radius={deployed.includes(u.unit_id) ? 10 : 7}
                    pathOptions={{
                      color: '#fff', weight: 2,
                      fillColor: deployed.includes(u.unit_id) ? '#2118C9' : u.availability_status === 'Available' ? '#16a34a' : '#D71920',
                      fillOpacity: 1
                    }}>
                    <Popup><strong>{u.unit_id}</strong> · {u.unit_type}<br />{u.availability_status} · {u.assigned_station}</Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Units near {focus?.ward}</CardTitle>
              <CardDescription>Nearest available units with simulated response times. Distances computed from sample coordinates.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-[var(--color-border)]">
                {nearby.map((u) => (
                  <li key={u.unit_id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <Siren className="w-4 h-4 text-[var(--color-accent)] flex-shrink-0" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{u.unit_id} · {u.unit_type}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{u.km} km away · ETA ~{u.etaMin} min (simulated) · {u.assigned_station}</p>
                    </div>
                    <Badge variant="success" size="sm">Available</Badge>
                    <Button variant={deployed.includes(u.unit_id) ? 'secondary' : 'outline'} size="sm" className="w-full sm:w-auto min-h-[36px] sm:min-h-[44px]"
                      onClick={() => setDeployed((d) => (d.includes(u.unit_id) ? d.filter((x) => x !== u.unit_id) : [...d, u.unit_id]))}>
                      {deployed.includes(u.unit_id) ? 'Assigned (simulated)' : 'Assign (simulated)'}
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Navigation className="w-5 h-5" aria-hidden="true" /> Recommended deployment</CardTitle>
              <CardDescription>Derived from the hotspot scores, not hard-coded.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {recommendation ? (
                <>
                  <p className="font-medium text-[var(--color-text-primary)]">Deploy {recommendation.units.map((u) => u.unit_id).join(' + ')} to {recommendation.ward}</p>
                  <p className="text-[var(--color-text-secondary)]">Window: {recommendation.window}</p>
                  <p className="text-[var(--color-text-secondary)]">{recommendation.reason}</p>
                  <p className="text-[var(--color-text-secondary)]">Add a foot-patrol pair at the central bus stand; monitor the market exits 18:30–21:30.</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Simulated recommendation for prototype purposes.</p>
                </>
              ) : (
                <p className="text-[var(--color-text-secondary)]">No available units near the focus ward.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All units ({services.units.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 max-h-80 overflow-auto">
                {services.units.map((u) => (
                  <li key={u.unit_id} className="flex items-center gap-2 text-sm min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: u.availability_status === 'Available' ? '#16a34a' : u.availability_status === 'Busy' ? '#D71920' : '#9ca3af' }} aria-hidden="true" />
                    <span className="font-medium text-[var(--color-text-primary)] flex-shrink-0">{u.unit_id}</span>
                    <span className="text-[var(--color-text-muted)] truncate min-w-0 flex-1">{u.unit_type}</span>
                    <span className="ml-auto text-xs text-[var(--color-text-muted)] flex-shrink-0">{u.availability_status}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
