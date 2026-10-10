/**
 * CRIMEMAP Synthetic Data Generator (ESM)
 * Generates reproducible synthetic crime data for Puducherry area.
 * Run with: npm run generate:data
 * Assumption: geography is approximate (Puducherry bounds); all persons/cases are fictional.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Seeded random for reproducibility
class SeededRandom {
  constructor(seed = 12345) {
    this.seed = seed;
  }

  next() {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min, max) {
    return this.next() * (max - min) + min;
  }

  choice(arr) {
    return arr[this.nextInt(0, arr.length - 1)];
  }
}

const random = new SeededRandom(12345);

const MARKET = { lat: 11.9348, lng: 79.8302 }; // Grand Bazaar Market
const RAILWAY = { lat: 11.9289, lng: 79.8356 }; // Puducherry Railway Station

const BOUNDS = {
  north: 12.05,
  south: 11.85,
  east: 79.95,
  west: 79.7,
  center: { lat: 11.9416, lng: 79.8083 }
};

const CRIME_TYPES = [
  { type: 'Assault', color: 'assault', severityWeight: 0.9, baseWeight: 15 },
  { type: 'Theft', color: 'theft', severityWeight: 0.4, baseWeight: 35 },
  { type: 'Traffic Violation', color: 'traffic', severityWeight: 0.2, baseWeight: 20 },
  { type: 'Cybercrime', color: 'cyber', severityWeight: 0.6, baseWeight: 8 },
  { type: 'Missing Person', color: 'missing', severityWeight: 0.8, baseWeight: 5 },
  { type: 'Resolved', color: 'resolved', severityWeight: 0.1, baseWeight: 17 }
];

const STATUSES = [
  'New',
  'Under Investigation',
  'Evidence Collected',
  'Suspect Identified',
  'Charges Filed',
  'Closed',
  'Reopened'
];

const STATUS_WEIGHTS = [20, 25, 15, 12, 10, 15, 3];

const POLICE_STATIONS = [
  { id: 'PS001', name: 'Grand Bazaar Police Station', district: 'Puducherry', lat: 11.9345, lng: 79.8298, contact: '+91-413-222-0101' },
  { id: 'PS002', name: 'Muthialpet Police Station', district: 'Puducherry', lat: 11.9523, lng: 79.8156, contact: '+91-413-222-0102' },
  { id: 'PS003', name: 'Lawspet Police Station', district: 'Puducherry', lat: 11.9789, lng: 79.8123, contact: '+91-413-222-0103' },
  { id: 'PS004', name: 'Kalamandapam Police Station', district: 'Puducherry', lat: 11.9234, lng: 79.8456, contact: '+91-413-222-0104' },
  { id: 'PS005', name: 'Villianur Police Station', district: 'Villianur', lat: 11.9156, lng: 79.7523, contact: '+91-413-222-0105' },
  { id: 'PS006', name: 'Ariyankuppam Police Station', district: 'Ariyankuppam', lat: 11.8987, lng: 79.8678, contact: '+91-413-222-0106' },
  { id: 'PS007', name: 'Bahour Police Station', district: 'Bahour', lat: 11.8123, lng: 79.7456, contact: '+91-413-222-0107' },
  { id: 'PS008', name: 'Nettapakkam Police Station', district: 'Nettapakkam', lat: 11.8678, lng: 79.6987, contact: '+91-413-222-0108' }
];

const LANDMARKS = [
  { id: 'LM001', name: 'Grand Bazaar Market', type: 'market', lat: 11.9348, lng: 79.8302 },
  { id: 'LM002', name: 'JIPMER Hospital', type: 'hospital', lat: 11.9578, lng: 79.8156 },
  { id: 'LM003', name: 'Puducherry Central Bus Stand', type: 'bus_stop', lat: 11.9398, lng: 79.8312 },
  { id: 'LM004', name: 'Govt. High School, Muthialpet', type: 'school', lat: 11.9545, lng: 79.8167 },
  { id: 'LM005', name: 'Railway Station, Puducherry', type: 'railway', lat: 11.9289, lng: 79.8356 },
  { id: 'LM006', name: 'Botanical Garden Bus Stop', type: 'bus_stop', lat: 11.9423, lng: 79.8234 },
  { id: 'LM007', name: 'Lawspet Market', type: 'market', lat: 11.9801, lng: 79.8134 },
  { id: 'LM008', name: 'Indira Gandhi Medical College', type: 'hospital', lat: 11.9456, lng: 79.8189 },
  { id: 'LM009', name: 'Villianur Bus Stand', type: 'bus_stop', lat: 11.9167, lng: 79.7534 },
  { id: 'LM010', name: 'Ariyankuppam Market', type: 'market', lat: 11.8998, lng: 79.8689 }
];

const WARDS = [
  'Ward 1 - Grand Bazaar', 'Ward 2 - Muthialpet', 'Ward 3 - Lawspet',
  'Ward 4 - Kalamandapam', 'Ward 5 - Villianur', 'Ward 6 - Ariyankuppam',
  'Ward 7 - Bahour', 'Ward 8 - Nettapakkam'
];

const DISTRICTS = ['Puducherry', 'Villianur', 'Ariyankuppam', 'Bahour', 'Nettapakkam'];
const UNIT_TYPES = ['Beat Patrol', 'Mobile Patrol', 'Traffic Patrol', 'Special Unit'];

function nearMarket(lat, lng, radiusDeg = 0.012) {
  return Math.hypot(lat - MARKET.lat, lng - MARKET.lng) < radiusDeg;
}

function randomDateInLastMonths(months = 12) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - months, 1);
  const timestamp = start.getTime() + random.next() * (now.getTime() - start.getTime());
  return new Date(timestamp);
}

// Evening-biased time: market-area assaults cluster 18:30-21:30; weekend thefts 18:00-22:00
function randomTime(crimeType, lat, lng, date) {
  const market = nearMarket(lat, lng);
  const day = date.getDay();
  const isWeekend = day === 5 || day === 6 || day === 0;

  if (crimeType === 'Assault' && market && random.next() < 0.85) {
    const hour = random.nextInt(18, 21);
    const minute = hour === 18 ? random.nextInt(30, 59) : hour === 21 ? random.nextInt(0, 30) : random.nextInt(0, 59);
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  if (crimeType === 'Theft' && market && isWeekend && random.next() < 0.7) {
    const hour = random.nextInt(18, 22);
    const minute = random.nextInt(0, 59);
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  const hour = random.nextInt(0, 23);
  const minute = random.nextInt(0, 59);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function getNearestStation(lat, lng) {
  let nearest = POLICE_STATIONS[0];
  let minDist = Infinity;
  for (const station of POLICE_STATIONS) {
    const dist = Math.hypot(station.lat - lat, station.lng - lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = station;
    }
  }
  return nearest;
}

function generateAddress() {
  const streets = [
    'MG Road', 'Jawaharlal Nehru Street', 'Mahatma Gandhi Road',
    'Kamaraj Salai', 'Anna Salai', 'Bharathi Street',
    'Romain Rolland Street', 'Victor Simonel Street',
    'Lal Bahadur Shastri Street', 'Subbiah Salai'
  ];
  const num = random.nextInt(1, 200);
  return `${num} ${random.choice(streets)}, Puducherry`;
}

function pickCrimeType() {
  const totalWeight = CRIME_TYPES.reduce((sum, ct) => sum + ct.baseWeight, 0);
  let r = random.next() * totalWeight;
  for (const ct of CRIME_TYPES) {
    r -= ct.baseWeight;
    if (r <= 0) return ct;
  }
  return CRIME_TYPES[0];
}

function pickStatus() {
  const total = STATUS_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = random.next() * total;
  for (let i = 0; i < STATUSES.length; i++) {
    r -= STATUS_WEIGHTS[i];
    if (r <= 0) return STATUSES[i];
  }
  return STATUSES[0];
}

function generateIncident(index) {
  const crimeType = pickCrimeType();

  // Location: assaults cluster at Grand Bazaar; thefts near markets/bus stops; rest uniform
  let lat;
  let lng;
  if (crimeType.type === 'Assault' && random.next() < 0.65) {
    lat = MARKET.lat + random.nextFloat(-0.007, 0.007);
    lng = MARKET.lng + random.nextFloat(-0.007, 0.007);
  } else if (crimeType.type === 'Theft' && random.next() < 0.45) {
    const pool = LANDMARKS.filter((l) => l.type === 'market' || l.type === 'bus_stop');
    const landmark = random.choice(pool);
    lat = landmark.lat + random.nextFloat(-0.009, 0.009);
    lng = landmark.lng + random.nextFloat(-0.009, 0.009);
  } else {
    lat = random.nextFloat(BOUNDS.south, BOUNDS.north);
    lng = random.nextFloat(BOUNDS.west, BOUNDS.east);
  }

  const date = randomDateInLastMonths(12);
  const time = randomTime(crimeType.type, lat, lng, date);
  const station = getNearestStation(lat, lng);
  const severity = Math.min(1, Math.max(0.1, crimeType.severityWeight + random.nextFloat(-0.2, 0.2)));
  const status = pickStatus();
  const market = nearMarket(lat, lng);

  return {
    incident_id: `INC-${String(index + 1).padStart(4, '0')}-SIM`,
    case_number: `CRIME-${date.getFullYear()}-${String(index + 1).padStart(6, '0')}`,
    crime_type: crimeType.type,
    crime_color: crimeType.color,
    severity: Number(severity.toFixed(2)),
    incident_date: date.toISOString().split('T')[0],
    incident_time: time,
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lng.toFixed(6)),
    address: generateAddress(),
    police_station: station.name,
    police_station_id: station.id,
    district: station.district,
    ward: market ? 'Ward 1 - Grand Bazaar' : random.choice(WARDS),
    status,
    created_at: new Date(date.getTime() + random.nextInt(0, 86400000)).toISOString(),
    victim_age_range: random.choice(['Unknown', '18-25', '26-35', '36-50', '50+']),
    victim_gender: random.choice(['Unknown', 'Male', 'Female', 'Other']),
    suspect_description: 'Information restricted - requires authorization',
    investigating_officer: `Officer ${random.nextInt(1000, 9999)}`
  };
}

function generatePatrolUnits() {
  const units = [];
  for (let i = 1; i <= 20; i++) {
    const station = random.choice(POLICE_STATIONS);
    const offset = random.nextFloat(-0.02, 0.02);
    const roll = random.next();
    const availability = roll < 0.6 ? 'Available' : roll < 0.85 ? 'Busy' : 'Offline';
    units.push({
      unit_id: `PU${String(i).padStart(3, '0')}`,
      unit_type: random.choice(UNIT_TYPES),
      current_latitude: Number((station.lat + offset).toFixed(6)),
      current_longitude: Number((station.lng + offset).toFixed(6)),
      availability_status: availability,
      assigned_station: station.name,
      assigned_station_id: station.id,
      officer_count: random.nextInt(1, 4),
      vehicle_id: `VH${String(random.nextInt(1, 50)).padStart(3, '0')}`
    });
  }
  return units;
}

function generateWards() {
  return WARDS.map((name, i) => ({
    ward_id: `WD${String(i + 1).padStart(3, '0')}`,
    ward_name: name,
    district: DISTRICTS[Math.min(i, DISTRICTS.length - 1)],
    center_lat: BOUNDS.center.lat + random.nextFloat(-0.05, 0.05),
    center_lng: BOUNDS.center.lng + random.nextFloat(-0.05, 0.05)
  }));
}

function generateAllData() {
  console.log('Generating synthetic crime data...');
  const incidents = [];
  for (let i = 0; i < 500; i++) incidents.push(generateIncident(i));
  incidents.sort((a, b) => new Date(b.incident_date) - new Date(a.incident_date));

  const patrolUnits = generatePatrolUnits();
  const wards = generateWards();

  const data = {
    metadata: {
      generated_at: new Date().toISOString(),
      seed: 12345,
      incident_count: incidents.length,
      station_count: POLICE_STATIONS.length,
      unit_count: patrolUnits.length,
      landmark_count: LANDMARKS.length,
      note: 'Prototype - simulated data. No real persons, cases, or sensitive information.'
    },
    crime_incidents: incidents,
    police_stations: POLICE_STATIONS,
    patrol_units: patrolUnits,
    landmarks: LANDMARKS,
    wards,
    districts: DISTRICTS.map((name, i) => ({
      district_id: `DT${String(i + 1).padStart(3, '0')}`,
      district_name: name
    }))
  };

  const outputPath = path.join(__dirname, '..', 'public', 'data', 'crimemap-data.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

  console.log(`Generated ${incidents.length} incidents`);
  console.log(`Generated ${POLICE_STATIONS.length} police stations`);
  console.log(`Generated ${patrolUnits.length} patrol units`);
  console.log(`Generated ${LANDMARKS.length} landmarks`);
  console.log(`Data written to ${outputPath}`);

  const typeCounts = {};
  incidents.forEach((i) => { typeCounts[i.crime_type] = (typeCounts[i.crime_type] || 0) + 1; });
  console.log('\nCrime type distribution:', typeCounts);

  const marketAssaults = incidents.filter(
    (i) => i.crime_type === 'Assault' && nearMarket(i.latitude, i.longitude)
  ).length;
  const eveningMarket = incidents.filter((i) => {
    if (!nearMarket(i.latitude, i.longitude)) return false;
    const h = parseInt(i.incident_time.split(':')[0], 10);
    const m = parseInt(i.incident_time.split(':')[1], 10);
    const mins = h * 60 + m;
    return mins >= 18 * 60 + 30 && mins <= 21 * 60 + 30;
  }).length;
  console.log(`Assaults near Grand Bazaar market: ${marketAssaults}`);
  console.log(`Market-area incidents 18:30-21:30: ${eveningMarket}`);

  return data;
}

generateAllData();
