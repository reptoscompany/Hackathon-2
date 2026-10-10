import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useData } from './DataContext';

const AlertContext = createContext(null);

function generateAlerts(services) {
  if (!services) return [];
  
  const { incidents, charts } = services;
  const alerts = [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

  // Sharp increase alert - compare today vs yesterday
  const todayCount = incidents.filter(i => i.incident_date === todayStr).length;
  const yesterdayCount = incidents.filter(i => i.incident_date === yesterdayStr).length;
  if (yesterdayCount > 0 && todayCount > yesterdayCount * 1.5) {
    alerts.push({
      id: `alert_sharp_${Date.now()}`,
      type: 'sharp_increase',
      severity: 'high',
      title: 'Sharp Increase in Incidents',
      message: `${todayCount} incidents today vs ${yesterdayCount} yesterday (${((todayCount/yesterdayCount-1)*100).toFixed(0)}% increase)`,
      time: new Date().toISOString(),
      read: false,
      action: { view: 'dashboard', params: {} }
    });
  }

  // New high-severity incident
  const highSeverityToday = incidents.filter(i => 
    i.incident_date === todayStr && i.severity > 0.8
  );
  if (highSeverityToday.length > 0) {
    highSeverityToday.slice(0, 3).forEach(incident => {
      alerts.push({
        id: `alert_highsev_${incident.incident_id}`,
        type: 'high_severity',
        severity: 'critical',
        title: 'High-Severity Incident Reported',
        message: `${incident.crime_type} at ${incident.address} (Severity: ${(incident.severity * 100).toFixed(0)}%)`,
        time: incident.created_at,
        read: false,
        action: { view: 'crime-map', params: { incidentId: incident.incident_id } }
      });
    });
  }

  // Hotspot over threshold
  const hotspotThreshold = 10;
  const recentIncidents = incidents.filter(i => 
    i.incident_date >= new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0]
  );
  const wardCounts = {};
  recentIncidents.forEach(i => { wardCounts[i.ward] = (wardCounts[i.ward] || 0) + 1; });
  Object.entries(wardCounts).forEach(([ward, count]) => {
    if (count >= hotspotThreshold) {
      alerts.push({
        id: `alert_hotspot_${ward.replace(/\s+/g, '_')}`,
        type: 'hotspot_threshold',
        severity: count >= 20 ? 'critical' : 'high',
        title: 'Hotspot Threshold Exceeded',
        message: `${ward}: ${count} incidents in last 7 days`,
        time: new Date().toISOString(),
        read: false,
        action: { view: 'hotspots-risk', params: { ward } }
      });
    }
  });

  // Urgent patrol need - areas with high incidents but few available units nearby
  const stationIncidents = {};
  recentIncidents.forEach(i => { stationIncidents[i.police_station] = (stationIncidents[i.police_station] || 0) + 1; });
  Object.entries(stationIncidents).forEach(([station, count]) => {
    if (count > 15) {
      const stationObj = services.stations.find(s => s.name === station);
      const nearbyUnits = services.units.filter(u => u.assigned_station === station && u.availability_status === 'Available').length;
      if (nearbyUnits < 2) {
        alerts.push({
          id: `alert_patrol_${station.replace(/\s+/g, '_')}`,
          type: 'patrol_need',
          severity: 'high',
          title: 'Urgent Patrol Need',
          message: `${station}: ${count} recent incidents, only ${nearbyUnits} available units`,
          time: new Date().toISOString(),
          read: false,
          action: { view: 'patrol-planner', params: { station } }
        });
      }
    }
  });

  return alerts.sort((a, b) => new Date(b.time) - new Date(a.time));
}

export function AlertProvider({ children }) {
  const { services } = useData();
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (services) {
      const newAlerts = generateAlerts(services);
      setAlerts(newAlerts);
      setUnreadCount(newAlerts.filter(a => !a.read).length);
    }
  }, [services]);

  const markRead = useCallback((id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  }, []);

  const markAllRead = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  }, []);

  const dismiss = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  useEffect(() => {
    setUnreadCount(alerts.filter(a => !a.read).length);
  }, [alerts]);

  const value = useMemo(() => ({
    alerts,
    unreadCount,
    panelOpen,
    setPanelOpen,
    markRead,
    markAllRead,
    dismiss
  }), [alerts, unreadCount, panelOpen]);

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
}