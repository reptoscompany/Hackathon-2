import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
// NOTE: leaflet.heat is a legacy global-L plugin, so it is loaded dynamically
// inside HeatLayer (after assigning window.L) instead of a static import.
import {
  ChevronDown, ChevronUp, Crosshair, Filter, Layers, Search, SlidersHorizontal, X
} from 'lucide-react';
import { Button } from '@/components';
import { Card, CardContent } from '@/components';
import { Badge } from '@/components';
import { Input, Select, MultiSelect } from '@/components';
import { Drawer } from '@/components';
import { LoadingState, ErrorState, EmptyState } from '@/components/DataState';
import { useData } from '@/services/DataContext';
import { useRole } from '@/services/RoleContext';
import { useDemo } from '@/services/DemoContext';
import { buildWardHotspots, crimeColor, haversineKm, RISK_COLORS } from '@/utils/geo';
import { PONDY_BOUNDS, useSimulatedLiveUnits } from '@/utils/pondyLive';
import { GoogleMapView } from '@/components/GoogleMapView';

const CENTER = [11.9416, 79.8083];
const RAILWAY = { lat: 11.9289, lng: 79.8356, label: 'Railway Station, Puducherry' };

function ZoomTracker({ onZoom }) {
  useMapEvents({ zoomend: (e) => onZoom(e.target.getZoom()) });
  return null;
}

function HeatLayer({ points, onError }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return undefined;
    let layer = null;
    let cancelled = false;
    (async () => {
      try {
        window.L = window.L || L;
        await import('leaflet.heat');
        if (cancelled) return;
        layer = window.L.heatLayer(points, { radius: 28, blur: 22, maxZoom: 15, minOpacity: 0.35 });
        layer.addTo(map);
      } catch (err) {
        console.error('Heatmap layer failed to load:', err);
        onError?.();
      }
    })();
    return () => { cancelled = true; if (layer) map.removeLayer(layer); };
  }, [map, points, onError]);
  return null;
}

function FlyTo({ center, zoom }) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    if (!center) return;
    map.flyTo(center, zoom ?? map.getZoom(), { duration: first.current ? 0 : 1.2 });
    first.current = false;
  }, [center, zoom, map]);
  return null;
}

function dotIcon(color, selected = false) {
  return L.divIcon({
    className: '',
    html: `<span class="crime-dot ${selected ? 'crime-dot-selected' : ''}" style="display:block;width:12px;height:12px;background:${color}"></span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
}

function squareIcon(label, color) {
  return L.divIcon({
    className: '',
    html: `<span title="${label}" style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:${color};color:#fff;border:2px solid #fff;box-shadow:0 1px 3px rgb(0 0 0 / .35);font-size:11px;font-weight:700">P</span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
}

export function CrimeMap() {
  const { services, loading, error } = useData();
  const { maskIncident, canSeeSensitive } = useRole();
  const { active: demoActive, currentStepData } = useDemo();

  const [filtersOpen, setFiltersOpen] = useState(true);
  const [layersOpen, setLayersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [techOpen, setTechOpen] = useState(false);
  const [zoom, setZoom] = useState(12);
  const [tileErrors, setTileErrors] = useState(0);
  const [heatFailed, setHeatFailed] = useState(false);
  const [selected, setSelected] = useState(null);

  const [filters, setFilters] = useState({ crimeTypes: [], statuses: [], district: '', station: '', ward: '', from: '', to: '' });
  const [layers, setLayers] = useState({ markers: true, heatmap: false, hotspots: true, stations: true, units: false, landmarks: true });
  const [search, setSearch] = useState({ mode: 'railway', lat: String(RAILWAY.lat), lng: String(RAILWAY.lng), radiusKm: '2', crimeType: '', from: '', to: '' });
  const [searchResult, setSearchResult] = useState(null);
  const [basemap, setBasemap] = useState('leaflet');
  const liveUnits = useSimulatedLiveUnits(services?.units, true);

  // Guided demo: steps 1, 2, 6 drive this view
  useEffect(() => {
    if (!demoActive || !currentStepData || !currentStepData.filters) return;
    if (!['crime-map'].includes(currentStepData.view)) return;
    const f = currentStepData.filters;
    setFilters((prev) => ({ ...prev, crimeTypes: f.crimeTypes || [], from: '', to: '' }));
    setLayers((prev) => ({ ...prev, markers: true, heatmap: currentStepData.highlight?.type === 'heatmap', hotspots: true }));
    if (currentStepData.highlight?.type === 'radius') {
      const [lat, lng] = currentStepData.highlight.center;
      setSearch({ mode: 'custom', lat: String(lat), lng: String(lng), radiusKm: String(currentStepData.highlight.radiusKm || 0.5), crimeType: '', from: '', to: '' });
      setSearchOpen(true);
    }
  }, [demoActive, currentStepData]);

  const filtered = useMemo(() => {
    if (!services) return [];
    let rows = services.incidents;
    if (filters.crimeTypes.length) rows = rows.filter((i) => filters.crimeTypes.includes(i.crime_type));
    if (filters.statuses.length) rows = rows.filter((i) => filters.statuses.includes(i.status));
    if (filters.district) rows = rows.filter((i) => i.district === filters.district);
    if (filters.station) rows = rows.filter((i) => i.police_station === filters.station);
    if (filters.ward) rows = rows.filter((i) => i.ward === filters.ward);
    if (filters.from) rows = rows.filter((i) => i.incident_date >= filters.from);
    if (filters.to) rows = rows.filter((i) => i.incident_date <= filters.to);
    return rows;
  }, [services, filters]);

  // Grid clustering at low zoom for performance + readability
  const clusters = useMemo(() => {
    if (zoom >= 14 || filtered.length === 0) return null;
    const cell = zoom < 12 ? 0.02 : 0.01;
    const map = new Map();
    filtered.forEach((i) => {
      const key = `${Math.round(i.latitude / cell)}:${Math.round(i.longitude / cell)}`;
      if (!map.has(key)) map.set(key, { lat: 0, lng: 0, count: 0, severe: 0 });
      const c = map.get(key);
      c.lat += i.latitude; c.lng += i.longitude; c.count += 1;
      if (i.severity > 0.7) c.severe += 1;
    });
    return [...map.values()].map((c) => ({ ...c, lat: c.lat / c.count, lng: c.lng / c.count }));
  }, [filtered, zoom]);

  const visibleMarkers = useMemo(() => {
    if (clusters) return [];
    return filtered.slice(0, 600);
  }, [clusters, filtered]);

  const heatPoints = useMemo(() => filtered.map((i) => [i.latitude, i.longitude, 0.3 + i.severity * 0.7]), [filtered]);

  const hotspots = useMemo(
    () => (services ? buildWardHotspots(filtered, services.landmarks).slice(0, 8) : []),
    [filtered, services]
  );

  const runSearch = (preset) => {
    const params = { ...search, ...(preset || {}) };
    const lat = parseFloat(params.lat);
    const lng = parseFloat(params.lng);
    const radiusKm = parseFloat(params.radiusKm);
    if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(radiusKm) || radiusKm <= 0) return;

    let end = params.to;
    let start = params.from;
    if (params.mode === 'railway' && !start && !end) {
      const now = new Date();
      end = now.toISOString().split('T')[0];
      start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).toISOString().split('T')[0];
    }

    const rows = (services?.incidents || []).filter((i) => {
      if (haversineKm(i.latitude, i.longitude, lat, lng) > radiusKm) return false;
      if (params.crimeType && i.crime_type !== params.crimeType) return false;
      if (start && i.incident_date < start) return false;
      if (end && i.incident_date > end) return false;
      return true;
    });

    const byType = {};
    rows.forEach((i) => { byType[i.crime_type] = (byType[i.crime_type] || 0) + 1; });

    setSearch(params);
    setSearchResult({
      lat, lng, radiusKm, start, end,
      count: rows.length,
      byType,
      rows: rows.slice(0, 50),
      query: services.getPostGISQuery({
        lat, lng, radiusKm,
        crimeType: params.crimeType || undefined,
        dateRange: start && end ? [start, end] : undefined
      })
    });
  };

  if (loading) return <div className="p-6"><LoadingState message="Loading crime map…" /></div>;
  if (error || !services) return <div className="p-6"><ErrorState message="Map data could not be loaded. Check your connection and retry." onRetry={() => window.location.reload()} /></div>;

  const typeOptions = services.getUniqueCrimeTypes().map((t) => ({ value: t, label: t }));
  const statusOptions = services.getUniqueStatuses().map((s) => ({ value: s, label: s }));
  const shown = selected ? maskIncident(selected) : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-navy-900)]">Crime Map</h1>
          <p className="text-[var(--color-text-secondary)]">
            {filtered.length} of {services.incidents.length} incidents · markers cluster when zoomed out ·
            Assumption: blue = Theft (PDF text garbled)
          </p>
          <div className="flex gap-1.5 flex-wrap">
            <Badge size="sm" variant="gray">Puducherry only</Badge>
            <Badge size="sm" variant="success" dot>Simulated live units</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap no-print">
          <Button variant={basemap === 'leaflet' ? 'secondary' : 'outline'} size="sm" onClick={() => setBasemap('leaflet')}>
            Leaflet
          </Button>
          <Button variant={basemap === 'google' ? 'secondary' : 'outline'} size="sm" onClick={() => setBasemap('google')}>
            Google
          </Button>
          <Button variant={filtersOpen ? 'secondary' : 'outline'} size="sm" onClick={() => setFiltersOpen((o) => !o)} leftIcon={<Filter className="w-4 h-4" aria-hidden="true" />}>
            Filters
          </Button>
          <Button variant={searchOpen ? 'secondary' : 'outline'} size="sm" onClick={() => setSearchOpen((o) => !o)} leftIcon={<Search className="w-4 h-4" aria-hidden="true" />}>
            Geospatial search
          </Button>
          <Button variant={layersOpen ? 'secondary' : 'outline'} size="sm" onClick={() => setLayersOpen((o) => !o)} leftIcon={<Layers className="w-4 h-4" aria-hidden="true" />}>
            Layers
          </Button>
        </div>
      </div>

      {tileErrors > 8 && (
        <div className="mb-4 p-3 rounded-md border border-[var(--color-crime-traffic)] bg-[var(--color-crime-traffic)]/10 text-sm text-[var(--color-text-primary)]" role="alert">
          Map tiles are unreachable (you may be offline). The incident list, filters, and search below still work — the map area shows a fallback grid instead of a blank screen.
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
        {/* Slim collapsible filter panel */}
        {filtersOpen && (
          <aside className="lg:w-80 flex-shrink-0 space-y-4 lg:sticky lg:top-20 self-start w-full" aria-label="Map filters">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" aria-hidden="true" /> Filters
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setFilters({ crimeTypes: [], statuses: [], district: '', station: '', ward: '', from: '', to: '' })}>
                    Reset
                  </Button>
                </div>
                <MultiSelect label="Crime type" options={typeOptions} value={filters.crimeTypes} onChange={(v) => setFilters((f) => ({ ...f, crimeTypes: v }))} placeholder="All types" />
                <MultiSelect label="Case status" options={statusOptions} value={filters.statuses} onChange={(v) => setFilters((f) => ({ ...f, statuses: v }))} placeholder="All statuses" />
                <Select label="District" value={filters.district} onChange={(e) => setFilters((f) => ({ ...f, district: e.target.value }))} options={[{ value: '', label: 'All districts' }, ...services.getUniqueDistricts().map((d) => ({ value: d, label: d }))]} />
                <Select label="Police station" value={filters.station} onChange={(e) => setFilters((f) => ({ ...f, station: e.target.value }))} options={[{ value: '', label: 'All stations' }, ...services.getUniqueStations().map((s) => ({ value: s, label: s }))]} />
                <Select label="Ward" value={filters.ward} onChange={(e) => setFilters((f) => ({ ...f, ward: e.target.value }))} options={[{ value: '', label: 'All wards' }, ...services.getUniqueWards().map((w) => ({ value: w, label: w }))]} />
                <div className="grid grid-cols-1 gap-3">
                  <Input type="date" label="From" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
                  <Input type="date" label="To" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
                </div>
                <div className="pt-1 border-t border-[var(--color-border)]">
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Legend (data only)</p>
                  <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                    {[['Assault / violent', '#D71920'], ['Theft (assumed)', '#2563eb'], ['Traffic', '#f59e0b'], ['Cybercrime', '#7c3aed'], ['Missing person', '#ea580c'], ['Resolved', '#16a34a']].map(([label, color]) => (
                      <li key={label} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border border-white" style={{ background: color }} aria-hidden="true" />
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {layersOpen && (
              <Card>
                <CardContent className="p-4 space-y-2">
                  <h2 className="font-semibold text-[var(--color-text-primary)]">Layers</h2>
                  {Object.entries({ markers: 'Incident markers', heatmap: 'Heatmap', hotspots: 'Hotspot zones', stations: 'Police stations', units: 'Patrol units', landmarks: 'Landmarks' }).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-[var(--color-text-primary)] cursor-pointer">
                      <input type="checkbox" checked={layers[key]} onChange={() => setLayers((l) => ({ ...l, [key]: !l[key] }))} className="w-4 h-4 rounded" />
                      {label}
                    </label>
                  ))}
                </CardContent>
              </Card>
            )}
          </aside>
        )}

        {/* Map */}
        <div className="flex-1 min-w-0">
          <div className="rounded-lg overflow-hidden border border-[var(--color-border)] h-[60vh] min-h-[320px] max-h-[560px]">
            {basemap === 'google' ? (
              <GoogleMapView
                markers={visibleMarkers}
                clusters={clusters}
                hotspots={hotspots}
                units={liveUnits || services.units}
                stations={services.stations}
                layers={layers}
                searchResult={searchResult}
                onSelect={setSelected}
              />
            ) : (
            <MapContainer center={CENTER} zoom={12} minZoom={11} maxZoom={18} maxBounds={PONDY_BOUNDS} maxBoundsViscosity={1.0} style={{ height: '100%', width: '100%' }} aria-label="Interactive crime map of Puducherry area (Puducherry only)">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                eventHandlers={{ tileerror: () => setTileErrors((c) => c + 1) }}
              />
              <ZoomTracker onZoom={setZoom} />
              <FlyTo center={demoActive && currentStepData?.mapCenter ? currentStepData.mapCenter : searchResult ? [searchResult.lat, searchResult.lng] : null} zoom={demoActive && currentStepData?.mapZoom ? currentStepData.mapZoom : undefined} />

              {layers.heatmap && !heatFailed && <HeatLayer points={heatPoints} onError={() => setHeatFailed(true)} />}
              {layers.heatmap && heatFailed && (
                <Circle center={CENTER} radius={2500} pathOptions={{ color: '#64748b', weight: 1, dashArray: '4 4', fillOpacity: 0.03 }}>
                  <Popup>Heatmap unavailable in this browser — markers and hotspot zones still work.</Popup>
                </Circle>
              )}

              {layers.hotspots && hotspots.map((h) => (
                <Circle
                  key={h.ward}
                  center={h.center}
                  radius={700}
                  pathOptions={{ color: RISK_COLORS[h.level], weight: 2, fillColor: RISK_COLORS[h.level], fillOpacity: 0.14 }}
                >
                  <Popup>
                    <strong>{h.ward}</strong><br />
                    {h.level} risk · score {h.score} · {h.count} incidents
                  </Popup>
                </Circle>
              ))}

              {layers.markers && clusters && clusters.map((c, i) => (
                <Marker key={i} position={[c.lat, c.lng]} icon={L.divIcon({
                  className: 'marker-cluster',
                  html: `<div style="width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;">${c.count}</div>`,
                  iconSize: [38, 38], iconAnchor: [19, 19]
                })} />
              ))}

              {layers.markers && !clusters && visibleMarkers.map((i) => (
                <Marker
                  key={i.incident_id}
                  position={[i.latitude, i.longitude]}
                  icon={dotIcon(crimeColor(i.crime_type), selected?.incident_id === i.incident_id)}
                  eventHandlers={{ click: () => setSelected(i) }}
                  title={`${i.crime_type} · ${i.case_number}`}
                />
              ))}

              {layers.stations && services.stations.map((s) => (
                <Marker key={s.id} position={[s.lat, s.lng]} icon={squareIcon(s.name, '#111C32')}>
                  <Popup><strong>{s.name}</strong><br />{s.district} · {s.contact} (sample number)</Popup>
                </Marker>
              ))}

              {layers.units && (liveUnits || []).filter((u) => u.availability_status !== 'Offline').map((u) => (
                <CircleMarker key={u.unit_id} center={[u.current_latitude, u.current_longitude]} radius={7}
                  pathOptions={{ color: '#fff', weight: 2, fillColor: u.availability_status === 'Available' ? '#16a34a' : '#D71920', fillOpacity: 1 }}>
                  <Popup><strong>{u.unit_id}</strong> · {u.unit_type}<br />{u.availability_status} · {u.assigned_station}</Popup>
                </CircleMarker>
              ))}

              {layers.landmarks && services.landmarks.map((l) => (
                <CircleMarker key={l.id} center={[l.lat, l.lng]} radius={5}
                  pathOptions={{ color: '#111C32', weight: 1.5, fillColor: '#fff', fillOpacity: 1 }}>
                  <Popup><strong>{l.name}</strong><br />{l.type.replace('_', ' ')}</Popup>
                </CircleMarker>
              ))}

              {searchResult && (
                <Circle center={[searchResult.lat, searchResult.lng]} radius={searchResult.radiusKm * 1000}
                  pathOptions={{ color: '#2118C9', weight: 2, dashArray: '6 4', fillOpacity: 0.05 }} />
              )}
            </MapContainer>
            )}
          </div>

          {/* Geospatial search */}
          {searchOpen && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-[var(--color-text-primary)]">Geospatial search</h2>
                  <Button variant="ghost" size="sm" onClick={() => setSearchOpen(false)} aria-label="Close search"><X className="w-4 h-4" aria-hidden="true" /></Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Input label="Latitude" value={search.lat} onChange={(e) => setSearch((s) => ({ ...s, lat: e.target.value, mode: 'custom' }))} />
                  <Input label="Longitude" value={search.lng} onChange={(e) => setSearch((s) => ({ ...s, lng: e.target.value, mode: 'custom' }))} />
                  <Input label="Radius (km)" type="number" min="0.1" step="0.1" value={search.radiusKm} onChange={(e) => setSearch((s) => ({ ...s, radiusKm: e.target.value }))} />
                  <Select label="Crime type" value={search.crimeType} onChange={(e) => setSearch((s) => ({ ...s, crimeType: e.target.value }))} options={[{ value: '', label: 'All types' }, ...typeOptions]} />
                  <Input type="date" label="From" value={search.from} onChange={(e) => setSearch((s) => ({ ...s, from: e.target.value, mode: 'custom' }))} />
                  <Input type="date" label="To" value={search.to} onChange={(e) => setSearch((s) => ({ ...s, to: e.target.value, mode: 'custom' }))} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => runSearch()} leftIcon={<Search className="w-4 h-4" aria-hidden="true" />}>Run search</Button>
                  <Button variant="outline" size="sm" onClick={() => runSearch({ mode: 'railway', lat: String(RAILWAY.lat), lng: String(RAILWAY.lng), radiusKm: '2', crimeType: '', from: '', to: '' })} leftIcon={<Crosshair className="w-4 h-4" aria-hidden="true" />} className="w-full sm:w-auto text-left">
                    Example: 2 km of railway station, last 6 months
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setTechOpen((o) => !o)}>
                    Technical view {techOpen ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
                  </Button>
                </div>
                {searchResult && (
                  <div className="mt-3 text-sm">
                    <p className="text-[var(--color-text-primary)] font-medium">
                      {searchResult.count} cases within {searchResult.radiusKm} km
                      {searchResult.start && searchResult.end ? ` (${searchResult.start} → ${searchResult.end})` : ''}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Object.entries(searchResult.byType).map(([t, c]) => (
                        <Badge key={t} size="sm" variant="gray">{t}: {c}</Badge>
                      ))}
                    </div>
                    {techOpen && (
                      <pre className="mt-3 text-xs overflow-x-auto" aria-label="Equivalent PostGIS query">{searchResult.query}</pre>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Result list (never empty without explanation) */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <h2 className="font-semibold text-[var(--color-text-primary)] mb-2">
                Incidents {clusters ? `(grouped into ${clusters.length} clusters at this zoom — zoom in past level 14 for points)` : `(${visibleMarkers.length} shown)`}
              </h2>
              {filtered.length === 0 ? (
                <EmptyState title="No incidents match" message="Widen the date range or clear crime-type and area filters." />
              ) : (
                <ul className="divide-y divide-[var(--color-border)] max-h-96 overflow-auto">
                  {(clusters ? [] : visibleMarkers.slice(0, 60)).map((i) => (
                    <li key={i.incident_id}>
                      <button type="button" onClick={() => setSelected(i)}
                        className="w-full flex items-center gap-3 py-3 min-h-[44px] text-left hover:bg-[var(--color-navy-50)] rounded px-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: crimeColor(i.crime_type) }} aria-hidden="true" />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-[var(--color-text-primary)] truncate">{i.crime_type} · {i.case_number}</span>
                          <span className="block text-xs text-[var(--color-text-muted)] truncate">{i.address} · {i.incident_date} {i.incident_time} · {i.status}</span>
                        </span>
                        <Badge size="sm" variant={i.severity > 0.7 ? 'danger' : i.severity > 0.4 ? 'warning' : 'success'}>
                          {(i.severity * 100).toFixed(0)}%
                        </Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Single details drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={shown ? `${shown.crime_type} · ${shown.case_number}` : 'Incident'} description={shown ? `${shown.address}` : ''}>
        {shown && (
          <dl className="space-y-3 text-sm">
            {[['Location', shown.address], ['Date / time', `${shown.incident_date} ${shown.incident_time}`],
              ['Police station', shown.police_station], ['District / ward', `${shown.district} · ${shown.ward}`],
              ['Status', shown.status], ['Severity', `${(shown.severity * 100).toFixed(0)}%`],
              ['Coordinates', `${shown.latitude}, ${shown.longitude}`]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-[var(--color-border)] pb-2 min-w-0">
                <dt className="text-[var(--color-text-secondary)] flex-shrink-0">{k}</dt>
                <dd className="font-medium text-[var(--color-text-primary)] text-right min-w-0 break-words">{v}</dd>
              </div>
            ))}
            <div className="pt-1">
              <p className="font-medium text-[var(--color-text-primary)] mb-1">Victim / suspect {!canSeeSensitive && <Badge size="sm" variant="gray">Masked for Analyst (simulated)</Badge>}</p>
              <p className="text-[var(--color-text-secondary)]">Age: {shown.victim_age_range} · Gender: {shown.victim_gender}</p>
              <p className="text-[var(--color-text-secondary)]">Suspect: {shown.suspect_description}</p>
              <p className="text-[var(--color-text-secondary)]">Officer: {shown.investigating_officer}</p>
              {!canSeeSensitive && <p className="mt-2 text-xs text-[var(--color-text-muted)]">Switch role to Station-House Officer in the top bar to reveal these fields (simulated permission gate).</p>}
            </div>
          </dl>
        )}
      </Drawer>
    </div>
  );
}
