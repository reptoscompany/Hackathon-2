import { useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';
import { crimeColor, RISK_COLORS } from '@/utils/geo';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const containerStyle = { width: '100%', height: '100%' };
const CENTER = { lat: 11.9416, lng: 79.8083 };
const PONDY_RESTRICTION = {
  latLngBounds: { north: 12.05, south: 11.8, west: 79.7, east: 79.84 },
  strictBounds: true
};

/**
 * Google basemap for CrimeMap (additive — Leaflet stays the default).
 * Requires VITE_GOOGLE_MAPS_API_KEY in .env.local. Pondicherry-locked.
 */
export function GoogleMapView({
  markers = [],
  clusters = null,
  hotspots = [],
  units = [],
  stations = [],
  layers,
  searchResult = null,
  onSelect
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'crimemap-google',
    googleMapsApiKey: API_KEY
  });

  const unitMarkers = useMemo(
    () => (units || []).filter((u) => u.availability_status !== 'Offline'),
    [units]
  );

  if (!API_KEY) {
    return (
      <div className="h-full min-h-[320px] flex flex-col items-center justify-center gap-2 p-6 text-center bg-[var(--color-navy-50)]">
        <p className="font-semibold text-[var(--color-text-primary)]">Google Maps needs an API key</p>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-md">
          Create <code>.env.local</code> with <code>VITE_GOOGLE_MAPS_API_KEY=your_key</code> (Maps JavaScript API enabled, billing on),
          then restart <code>npm run dev</code>. Leaflet map below keeps working meanwhile.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-full min-h-[320px] flex items-center justify-center p-6 text-sm text-[var(--color-crime-assault)] bg-[var(--color-navy-50)]" role="alert">
        Google Maps failed to load ({loadError.message}). Check key restrictions + billing, or switch back to Leaflet.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full min-h-[320px] flex items-center justify-center p-6 text-sm text-[var(--color-text-secondary)]">
        Loading Google Maps…
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={CENTER}
      zoom={12}
      options={{
        restriction: PONDY_RESTRICTION,
        minZoom: 11,
        maxZoom: 18,
        streetViewControl: false,
        mapTypeControl: true,
        fullscreenControl: true
      }}
    >
      {layers?.hotspots && hotspots.map((h) => (
        <Circle
          key={h.ward}
          center={{ lat: h.center[0], lng: h.center[1] }}
          radius={700}
          options={{
            strokeColor: RISK_COLORS[h.level],
            strokeWeight: 2,
            fillColor: RISK_COLORS[h.level],
            fillOpacity: 0.14
          }}
        />
      ))}

      {layers?.markers && clusters && clusters.map((c, i) => (
        <Marker
          key={`c-${i}`}
          position={{ lat: c.lat, lng: c.lng }}
          label={{ text: String(c.count), color: '#fff', fontSize: '11px', fontWeight: '700' }}
        />
      ))}

      {layers?.markers && !clusters && markers.slice(0, 600).map((m) => (
        <Marker
          key={m.incident_id}
          position={{ lat: m.latitude, lng: m.longitude }}
          title={`${m.crime_type} · ${m.case_number}`}
          onClick={() => onSelect?.(m)}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: crimeColor(m.crime_type),
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 1.5
          }}
        />
      ))}

      {layers?.stations && stations.map((s) => (
        <Marker
          key={s.id}
          position={{ lat: s.lat, lng: s.lng }}
          title={s.name}
          label={{ text: 'P', color: '#fff', fontSize: '11px', fontWeight: '700' }}
        />
      ))}

      {layers?.units && unitMarkers.map((u) => (
        <Marker
          key={u.unit_id}
          position={{ lat: u.current_latitude, lng: u.current_longitude }}
          title={`${u.unit_id} · ${u.availability_status}`}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: u.availability_status === 'Available' ? '#16a34a' : '#D71920',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2
          }}
        />
      ))}

      {searchResult && (
        <Circle
          center={{ lat: searchResult.lat, lng: searchResult.lng }}
          radius={searchResult.radiusKm * 1000}
          options={{ strokeColor: '#2118C9', strokeWeight: 2, fillOpacity: 0.05 }}
        />
      )}
    </GoogleMap>
  );
}
