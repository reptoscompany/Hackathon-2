/** Shared geospatial + scoring helpers. All computations run on the sample data. */

export const EARTH_RADIUS_KM = 6371;

export function haversineKm(aLat, aLng, bLat, bLng) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function withinRadiusKm(incident, lat, lng, radiusKm) {
  return haversineKm(incident.latitude, incident.longitude, lat, lng) <= radiusKm;
}

export const CRIME_COLORS = {
  Assault: '#D71920',
  Theft: '#2563eb',
  'Traffic Violation': '#f59e0b',
  Cybercrime: '#7c3aed',
  'Missing Person': '#ea580c',
  Resolved: '#16a34a'
};

export function crimeColor(type) {
  return CRIME_COLORS[type] || '#64748b';
}

export const RISK_LEVELS = ['Low', 'Moderate', 'High', 'Critical'];
export const RISK_COLORS = {
  Low: '#16a34a',
  Moderate: '#f59e0b',
  High: '#ea580c',
  Critical: '#D71920'
};

export const DEFAULT_WEIGHTS = {
  incidentCount: 0.22,
  severity: 0.24,
  recurrence: 0.16,
  proximity: 0.1,
  timeConcentration: 0.12,
  density: 0.08,
  history: 0.08
};

export const WEIGHT_LABELS = {
  incidentCount: 'Incident count',
  severity: 'Severity',
  recurrence: 'Recurrence (repeat locations)',
  proximity: 'Proximity to sensitive landmarks',
  timeConcentration: 'Time concentration (evening peak)',
  density: 'Density (incidents per sq km)',
  history: 'History (trend vs prior period)'
};

/**
 * Illustrative weighted hotspot score in [0,1].
 * Assumption (stated in UI): transparent weighted sum; one serious assault can
 * outweigh several minor complaints because severity carries ~24% default weight.
 */
export function scoreHotspot(features, weights = DEFAULT_WEIGHTS) {
  const keys = Object.keys(DEFAULT_WEIGHTS);
  const total = keys.reduce((s, k) => s + (weights[k] || 0), 0) || 1;
  let score = 0;
  keys.forEach((k) => {
    const w = (weights[k] || 0) / total;
    score += w * Math.min(1, Math.max(0, features[k] ?? 0));
  });
  return Math.min(1, Math.max(0, score));
}

export function riskLevel(score) {
  if (score >= 0.7) return 'Critical';
  if (score >= 0.5) return 'High';
  if (score >= 0.3) return 'Moderate';
  return 'Low';
}

/** Aggregate incidents by ward into hotspot features. */
export function buildWardHotspots(incidents, landmarks = [], weights = DEFAULT_WEIGHTS) {
  const byWard = {};
  incidents.forEach((i) => {
    if (!byWard[i.ward]) byWard[i.ward] = [];
    byWard[i.ward].push(i);
  });
  const counts = Object.values(byWard).map((l) => l.length);
  const maxCount = Math.max(1, ...counts);

  return Object.entries(byWard).map(([ward, list]) => {
    const avgSeverity = list.reduce((s, i) => s + i.severity, 0) / list.length;
    const addrCounts = {};
    list.forEach((i) => { addrCounts[i.address] = (addrCounts[i.address] || 0) + 1; });
    const repeatAddresses = Object.values(addrCounts).filter((c) => c >= 3).length;

    const evening = list.filter((i) => {
      const [h, m] = i.incident_time.split(':').map(Number);
      const mins = h * 60 + m;
      return mins >= 18 * 60 && mins <= 22 * 60;
    }).length;

    const sensitive = landmarks.filter((l) => l.type === 'market' || l.type === 'bus_stop' || l.type === 'school');
    const nearSensitive = list.filter((i) =>
      sensitive.some((l) => haversineKm(i.latitude, i.longitude, l.lat, l.lng) <= 0.6)
    ).length;

    const lats = list.map((i) => i.latitude);
    const lngs = list.map((i) => i.longitude);
    const spanLat = Math.max(...lats) - Math.min(...lats);
    const spanLng = Math.max(...lngs) - Math.min(...lngs);
    const area = Math.max(0.0004, spanLat * 111 * spanLng * 111 * Math.cos((lats[0] * Math.PI) / 180));
    const density = Math.min(1, list.length / area / 400);

    // History: share of incidents in the most recent 30 days of the dataset window
    const dates = list.map((i) => i.incident_date).sort();
    const latest = dates[dates.length - 1];
    const cutoff = new Date(new Date(latest).getTime() - 30 * 86400000).toISOString().split('T')[0];
    const recent = list.filter((i) => i.incident_date >= cutoff).length;

    const features = {
      incidentCount: list.length / maxCount,
      severity: avgSeverity,
      recurrence: Math.min(1, repeatAddresses / 3),
      proximity: list.length ? nearSensitive / list.length : 0,
      timeConcentration: list.length ? evening / list.length : 0,
      density,
      history: list.length ? recent / list.length : 0
    };
    const score = scoreHotspot(features, weights);
    const centerLat = lats.reduce((s, v) => s + v, 0) / lats.length;
    const centerLng = lngs.reduce((s, v) => s + v, 0) / lngs.length;

    return {
      ward,
      count: list.length,
      avgSeverity: Number(avgSeverity.toFixed(2)),
      eveningShare: list.length ? Number((evening / list.length).toFixed(2)) : 0,
      recentCount: recent,
      features,
      score: Number(score.toFixed(3)),
      level: riskLevel(score),
      center: [centerLat, centerLng]
    };
  }).sort((a, b) => b.score - a.score);
}

/** Suggested patrol windows derived from the data: top weekday-hour cells per ward. */
export function suggestPatrolWindows(incidents, topN = 6) {
  const cells = {};
  incidents.forEach((i) => {
    const date = new Date(`${i.incident_date}T00:00:00`);
    const dow = date.getDay(); // 0 Sun
    const hour = parseInt(i.incident_time.split(':')[0], 10);
    const block = `${Math.floor(hour / 2) * 2}:00-${Math.floor(hour / 2) * 2 + 2}:00`;
    const key = `${i.ward}||${dow}||${block}`;
    if (!cells[key]) cells[key] = { ward: i.ward, dow, block, count: 0, severity: 0 };
    cells[key].count += 1;
    cells[key].severity += i.severity;
  });
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Object.values(cells)
    .map((c) => ({ ...c, day: DOW[c.dow], avgSeverity: Number((c.severity / c.count).toFixed(2)) }))
    .sort((a, b) => b.count - a.count || b.avgSeverity - a.avgSeverity)
    .slice(0, topN);
}

/** Simulated response time (minutes) from nearest available unit. Labeled simulated in UI. */
export function simulatedResponseMin(unitLat, unitLng, incLat, incLng) {
  const km = haversineKm(unitLat, unitLng, incLat, incLng);
  const urbanSpeedKmh = 28; // assumption stated in UI
  return Number(((km / urbanSpeedKmh) * 60 + 2).toFixed(1)); // +2 min dispatch
}

export function toCsv(rows, columns) {
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => esc(c.header)).join(',');
  const lines = rows.map((r) => columns.map((c) => esc(r[c.key])).join(','));
  return [header, ...lines].join('\n');
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
