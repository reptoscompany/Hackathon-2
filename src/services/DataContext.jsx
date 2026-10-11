import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/data/crimemap-data.json');
        if (!response.ok) throw new Error('Failed to load data');
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err.message);
        console.error('Data load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Service layer - computed values from data
  const services = useMemo(() => {
    if (!data) return null;

    const { crime_incidents, police_stations, patrol_units: patrolUnits, landmarks, wards, districts } = data;

    // KPI computations - dates computed fresh each render
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
    const yearAgo = new Date(now.getTime() - 365 * 86400000).toISOString().split('T')[0];

    const totalIncidents = crime_incidents.length;
    const todayIncidents = crime_incidents.filter(i => i.incident_date === todayStr).length;
    const weekIncidents = crime_incidents.filter(i => i.incident_date >= weekAgo).length;
    const monthIncidents = crime_incidents.filter(i => i.incident_date >= monthAgo).length;
    const lastMonthIncidents = crime_incidents.filter(i => i.incident_date >= yearAgo && i.incident_date < monthAgo).length;

    // Most common crime type
    const typeCounts = {};
    crime_incidents.forEach(i => { typeCounts[i.crime_type] = (typeCounts[i.crime_type] || 0) + 1; });
    const mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Active hotspots (areas with >5 incidents in last 30 days)
    const recentIncidents = crime_incidents.filter(i => i.incident_date >= monthAgo);
    const stationCounts = {};
    recentIncidents.forEach(i => { stationCounts[i.police_station] = (stationCounts[i.police_station] || 0) + 1; });
    const activeHotspots = Object.entries(stationCounts).filter(([, count]) => count > 5).length;

    // Unresolved cases
    const unresolvedCases = crime_incidents.filter(i => i.status !== 'Closed').length;

    // Average response time (simulated)
    const avgResponseTime = '12 min 34 sec';

    // Crime increase/decrease %
    const changePct = lastMonthIncidents > 0 
      ? (((monthIncidents - lastMonthIncidents) / lastMonthIncidents) * 100).toFixed(1)
      : '0.0';

    // Highest severity area
    const severityByStation = {};
    crime_incidents.forEach(i => {
      if (!severityByStation[i.police_station]) severityByStation[i.police_station] = { total: 0, count: 0 };
      severityByStation[i.police_station].total += i.severity;
      severityByStation[i.police_station].count += 1;
    });
    let highestSeverityArea = 'N/A';
    let maxAvgSeverity = 0;
    Object.entries(severityByStation).forEach(([station, data]) => {
      const avg = data.total / data.count;
      if (avg > maxAvgSeverity) {
        maxAvgSeverity = avg;
        highestSeverityArea = station;
      }
    });

    // Available patrol units
    const availableUnits = patrolUnits.filter(u => u.availability_status === 'Available').length;

    // Top areas by incident count
    const topAreas = Object.entries(stationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([area, count]) => ({ area, count }));

    // Recent alerts (last 5 high-severity or new incidents)
    const recentAlerts = crime_incidents
      .filter(i => i.severity > 0.7 || i.status === 'New')
      .slice(0, 5)
      .map(i => ({
        id: i.incident_id,
        type: i.severity > 0.7 ? 'high_severity' : 'new_case',
        crimeType: i.crime_type,
        severity: i.severity,
        location: i.address,
        station: i.police_station,
        title: i.severity > 0.7 ? `High-severity ${i.crime_type}` : `New case: ${i.crime_type}`,
        message: `${i.address} · ${i.police_station} · severity ${(i.severity * 100).toFixed(0)}%`,
        time: `${i.incident_date} ${i.incident_time}`,
        status: i.status
      }));

    // Trend data for charts (last 12 months)
    const monthlyTrends = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7); // YYYY-MM
      monthlyTrends[key] = 0;
    }
    crime_incidents.forEach(i => {
      const key = i.incident_date.slice(0, 7);
      if (monthlyTrends[key] !== undefined) monthlyTrends[key]++;
    });

    // Hour of day distribution
    const hourCounts = Array(24).fill(0);
    crime_incidents.forEach(i => {
      const hour = parseInt(i.incident_time.split(':')[0], 10);
      hourCounts[hour]++;
    });

    // Day of week distribution
    const dayCounts = Array(7).fill(0);
    crime_incidents.forEach(i => {
      const day = new Date(i.incident_date).getDay();
      dayCounts[day]++;
    });

    // Crime type distribution
    const crimeTypeDist = Object.entries(typeCounts).map(([type, count]) => ({ type, count }));

    // Severity distribution
    const severityRanges = { '0.0-0.2': 0, '0.2-0.4': 0, '0.4-0.6': 0, '0.6-0.8': 0, '0.8-1.0': 0 };
    crime_incidents.forEach(i => {
      if (i.severity <= 0.2) severityRanges['0.0-0.2']++;
      else if (i.severity <= 0.4) severityRanges['0.2-0.4']++;
      else if (i.severity <= 0.6) severityRanges['0.4-0.6']++;
      else if (i.severity <= 0.8) severityRanges['0.6-0.8']++;
      else severityRanges['0.8-1.0']++;
    });

    // Ward-level incidents for hotspots
    const wardCounts = {};
    crime_incidents.forEach(i => { wardCounts[i.ward] = (wardCounts[i.ward] || 0) + 1; });

    // Patrol route suggestions (simplified)
    const highRiskWards = Object.entries(wardCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ward, count]) => ({ ward, count }));

    return {
      // Raw data
      incidents: crime_incidents,
      stations: police_stations,
      units: patrolUnits,
      landmarks,
      wards,
      districts,

      // KPIs
      kpis: {
        totalIncidents,
        todayIncidents,
        weekIncidents,
        monthIncidents,
        mostCommonType,
        activeHotspots,
        unresolvedCases,
        avgResponseTime,
        changePct: parseFloat(changePct),
        highestSeverityArea,
        availableUnits,
        totalUnits: patrolUnits.length
      },

      // Charts data
      charts: {
        monthlyTrends: Object.entries(monthlyTrends).map(([month, count]) => ({ month, count })),
        hourCounts: hourCounts.map((count, hour) => ({ hour, count })),
        dayCounts: dayCounts.map((count, day) => ({ day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day], count })),
        crimeTypeDist,
        severityDist: Object.entries(severityRanges).map(([range, count]) => ({ range, count })),
        topAreas,
        recentAlerts,
        highRiskWards
      },

      // Filters helpers
      getUniqueCrimeTypes: () => [...new Set(crime_incidents.map(i => i.crime_type))].sort(),
      getUniqueStations: () => [...new Set(crime_incidents.map(i => i.police_station))].sort(),
      getUniqueDistricts: () => [...new Set(crime_incidents.map(i => i.district))].sort(),
      getUniqueWards: () => [...new Set(crime_incidents.map(i => i.ward))].sort(),
      getUniqueStatuses: () => [...new Set(crime_incidents.map(i => i.status))].sort(),

      // Filtered incidents
      filterIncidents: (filters) => {
        let result = crime_incidents;
        if (filters.dateRange) {
          const [start, end] = filters.dateRange;
          result = result.filter(i => i.incident_date >= start && i.incident_date <= end);
        }
        if (filters.crimeTypes?.length) {
          result = result.filter(i => filters.crimeTypes.includes(i.crime_type));
        }
        if (filters.stations?.length) {
          result = result.filter(i => filters.stations.includes(i.police_station));
        }
        if (filters.districts?.length) {
          result = result.filter(i => filters.districts.includes(i.district));
        }
        if (filters.wards?.length) {
          result = result.filter(i => filters.wards.includes(i.ward));
        }
        if (filters.statuses?.length) {
          result = result.filter(i => filters.statuses.includes(i.status));
        }
        if (filters.severityRange) {
          const [min, max] = filters.severityRange;
          result = result.filter(i => i.severity >= min && i.severity <= max);
        }
        if (filters.bounds) {
          const { north, south, east, west } = filters.bounds;
          result = result.filter(i => 
            i.latitude <= north && i.latitude >= south && 
            i.longitude <= east && i.longitude >= west
          );
        }
        return result;
      },

      // Geospatial search
      searchIncidents: (params) => {
        let result = crime_incidents;
        
        if (params.lat && params.lng && params.radiusKm) {
          const R = 6371; // Earth radius in km
          result = result.filter(i => {
            const dLat = (i.latitude - params.lat) * Math.PI / 180;
            const dLng = (i.longitude - params.lng) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(params.lat * Math.PI/180) * Math.cos(i.latitude * Math.PI/180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c <= params.radiusKm;
          });
        }
        
        if (params.crimeType) {
          result = result.filter(i => i.crime_type === params.crimeType);
        }
        if (params.dateRange) {
          const [start, end] = params.dateRange;
          result = result.filter(i => i.incident_date >= start && i.incident_date <= end);
        }
        if (params.station) {
          result = result.filter(i => i.police_station === params.station);
        }
        
        return result;
      },

      // PostGIS query equivalent (for technical view)
      getPostGISQuery: (params) => {
        const conditions = [];
        if (params.lat && params.lng && params.radiusKm) {
          conditions.push(
            `ST_DWithin(geom, ST_SetSRID(ST_MakePoint(${params.lng}, ${params.lat}), 4326)::geography, ${params.radiusKm * 1000})`
          );
        }
        if (params.crimeType) {
          conditions.push(`crime_type = '${params.crimeType}'`);
        }
        if (params.dateRange) {
          conditions.push(`incident_date BETWEEN '${params.dateRange[0]}' AND '${params.dateRange[1]}'`);
        }
        if (params.station) {
          conditions.push(`police_station = '${params.station}'`);
        }
        
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        return `SELECT * FROM crime_incidents ${whereClause} ORDER BY incident_date DESC;`;
      }
    };
  }, [data]);

  const value = { data, loading, error, services };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}