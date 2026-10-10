import { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Clock, 
  Users, 
  Shield, 
  FileText,
  ChevronDown,
  ChevronUp,
  Bell,
  Filter,
  X
} from 'lucide-react';
import { Button } from '@/components';
import { Card, CardHeader, CardTitle, CardContent } from '@/components';
import { KPICard, KPICardSecondary } from '@/components';
import { Chart, createLineChartOption, createBarChartOption } from '@/components';
import { Badge } from '@/components';
import { Select, DateRangePicker } from '@/components';
import { Table } from '@/components';
import { useData } from '@/services/DataContext';
import { useAlerts } from '@/services/AlertContext';
import { useDemo } from '@/services/DemoContext';

export function Dashboard() {
  const { services } = useData();
  const { alerts, unreadCount } = useAlerts();
  const { active: demoActive, currentStepData } = useDemo();
  
  const [filters, setFilters] = useState({
    level: 'city',
    dateRange: [],
    crimeTypes: [],
    stations: []
  });
  
  const [showAllKPIs, setShowAllKPIs] = useState(false);

  // Demo: highlight if on demo step 4 (dashboard alert)
  const isDemoAlertStep = demoActive && currentStepData?.id === 4;

  const kpis = useMemo(() => {
    if (!services) return null;
    const { kpis } = services;
    return [
      { title: 'Total Incidents', value: kpis.totalIncidents.toLocaleString(), icon: FileText, trend: kpis.changePct >= 0 ? 'up' : 'down', change: Math.abs(kpis.changePct), changeLabel: 'vs last month' },
      { title: 'Today', value: kpis.todayIncidents.toLocaleString(), icon: Clock, trend: 'neutral' },
      { title: 'This Week', value: kpis.weekIncidents.toLocaleString(), icon: TrendingUp, trend: 'neutral' },
      { title: 'Most Common Type', value: kpis.mostCommonType, icon: AlertTriangle, trend: 'neutral' },
      { title: 'Active Hotspots', value: kpis.activeHotspots, icon: MapPin, trend: kpis.activeHotspots > 5 ? 'up' : 'neutral', change: kpis.activeHotspots > 5 ? 1 : 0 },
      { title: 'Unresolved Cases', value: kpis.unresolvedCases.toLocaleString(), icon: FileText, trend: 'neutral' },
      { title: 'Avg Response Time', value: kpis.avgResponseTime, icon: Clock, trend: 'neutral' },
      { title: 'Crime Change %', value: `${kpis.changePct >= 0 ? '+' : ''}${kpis.changePct}%`, icon: TrendingUp, trend: kpis.changePct >= 0 ? 'up' : 'down', change: Math.abs(kpis.changePct) },
      { title: 'Highest Severity Area', value: kpis.highestSeverityArea, icon: AlertTriangle, trend: 'neutral' },
      { title: 'Available Patrol Units', value: `${kpis.availableUnits} / ${kpis.totalUnits}`, icon: Shield, trend: kpis.availableUnits > 5 ? 'up' : 'down' }
    ];
  }, [services]);

  const priorityKPIs = kpis?.slice(0, 5) || [];
  const secondaryKPIs = kpis?.slice(5) || [];

  const chartData = useMemo(() => {
    if (!services) return { monthly: [], hourly: [], daily: [], types: [] };
    return {
      monthly: services.charts.monthlyTrends,
      hourly: services.charts.hourCounts,
      daily: services.charts.dayCounts,
      types: services.charts.crimeTypeDist
    };
  }, [services]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ level: 'city', dateRange: [], crimeTypes: [], stations: [] });
  };

  const hasActiveFilters = filters.dateRange.length > 0 || filters.crimeTypes.length > 0 || filters.stations.length > 0;

  if (!services) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-var(--header-height)-4rem)]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-navy-900)]">Dashboard</h1>
          <p className="text-[var(--color-text-secondary)]">Key metrics, trends & alerts — {filters.level} level</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select
            value={filters.level}
            onChange={(e) => handleFilterChange('level', e.target.value)}
            options={[
              { value: 'city', label: 'City' },
              { value: 'district', label: 'District' },
              { value: 'station', label: 'Station' },
              { value: 'ward', label: 'Ward' },
              { value: 'street', label: 'Street' }
            ]}
            className="w-40"
          />
          <DateRangePicker
            value={filters.dateRange}
            onChange={(v) => handleFilterChange('dateRange', v)}
            className="w-full sm:w-[360px] max-w-full"
          />
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} leftIcon={<X className="w-4 h-4" aria-hidden="true" />}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Priority KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {priorityKPIs.map((kpi, i) => (
          <KPICard 
            key={i} 
            title={kpi.title} 
            value={kpi.value} 
            icon={<kpi.icon className="w-6 h-6" aria-hidden="true" />}
            trend={kpi.trend}
            change={kpi.change}
            changeLabel={kpi.changeLabel}
            className={isDemoAlertStep && i === 0 ? 'ring-2 ring-[var(--color-crime-assault)]' : ''}
          />
        ))}
      </div>

      {/* Secondary KPIs - collapsible */}
      <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
        <Button
          variant="ghost"
          className="w-full justify-between px-4 py-3"
          onClick={() => setShowAllKPIs(!showAllKPIs)}
          leftIcon={<Filter className="w-4 h-4" aria-hidden="true" />}
        >
          <span className="font-medium text-[var(--color-text-primary)]">Additional Metrics ({secondaryKPIs.length})</span>
          {showAllKPIs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </Button>
        {showAllKPIs && (
          <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 border-t border-[var(--color-border)] animate-slide-up">
            {secondaryKPIs.map((kpi, i) => (
              <KPICardSecondary 
                key={i} 
                title={kpi.title} 
                value={kpi.value} 
                subtitle={kpi.changeLabel}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Trend chart + Top areas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trend Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle>Incident Trend (Last 12 Months)</CardTitle>
              <Badge variant="gray" size="sm">Monthly</Badge>
            </CardHeader>
            <CardContent>
              <Chart
                height={300}
                option={createLineChartOption(chartData.monthly, {
                  xKey: 'month',
                  yKeys: ['count'],
                  labels: { count: 'Incidents' },
                  title: '',
                  showLegend: false,
                  areaStyle: true
                })}
              />
            </CardContent>
          </Card>

          {/* Top Areas + Hourly Distribution */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Areas by Incidents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-auto">
                  {services.charts.topAreas.slice(0, 8).map((area, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 py-2 border-b border-[var(--color-border)] last:border-0">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <span className="w-6 text-center text-[var(--color-text-muted)] text-sm font-medium flex-shrink-0">{i + 1}</span>
                        <span className="text-sm text-[var(--color-text-primary)] truncate max-w-[120px] sm:max-w-[200px]">{area.area}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <span className="text-sm font-mono tabular-nums text-[var(--color-text-primary)]">{area.count}</span>
                        <div className="w-16 sm:w-24 h-2 bg-[var(--color-navy-100)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[var(--color-accent)] rounded-full" 
                            style={{ width: `${(area.count / services.charts.topAreas[0]?.count) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hour of Day Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <Chart
                  height={250}
                  option={createBarChartOption(chartData.hourly, {
                    xKey: 'hour',
                    yKeys: ['count'],
                    labels: { count: 'Incidents' },
                    title: '',
                    showLegend: false
                  })}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right column - Alerts + Day of week + Crime types */}
        <div className="space-y-6">
          {/* Alerts Panel */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" aria-hidden="true" />
                Recent Alerts
                {unreadCount > 0 && (
                  <Badge variant="danger" size="sm">{unreadCount}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {services.charts.recentAlerts.length === 0 ? (
                <p className="text-[var(--color-text-muted)] text-sm py-8 text-center">No recent alerts</p>
              ) : (
                <div className="space-y-3">
                  {services.charts.recentAlerts.slice(0, 5).map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`p-3 rounded-md border-l-4 ${isDemoAlertStep && alert.type === 'sharp_increase' ? 'bg-[var(--color-crime-assault)]/5 border-[var(--color-crime-assault)]' : 'bg-[var(--color-navy-50)] border-[var(--color-border)]'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-[var(--color-text-primary)]">{alert.title}</p>
                          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{alert.message}</p>
                        </div>
                        <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                          {new Date(alert.time).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Day of Week */}
          <Card>
            <CardHeader>
              <CardTitle>Day of Week Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <Chart
                height={200}
                option={createBarChartOption(chartData.daily, {
                  xKey: 'day',
                  yKeys: ['count'],
                  labels: { count: 'Incidents' },
                  title: '',
                  showLegend: false
                })}
              />
            </CardContent>
          </Card>

          {/* Crime Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Crime Type Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {chartData.types.map((type, i) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <Badge 
                      variant={type.type.toLowerCase().includes('assault') ? 'danger' : 
                               type.type.toLowerCase().includes('theft') ? 'info' :
                               type.type.toLowerCase().includes('traffic') ? 'warning' :
                               type.type.toLowerCase().includes('cyber') ? 'purple' :
                               type.type.toLowerCase().includes('missing') ? 'orange' : 'success'} 
                      size="sm"
                      className="w-20 sm:w-24 text-center truncate"
                    >
                      {type.type}
                    </Badge>
                    <div className="flex-1 h-2 bg-[var(--color-navy-100)] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${(type.count / chartData.types[0]?.count) * 100}%`,
                          backgroundColor: `var(--color-crime-${type.type.toLowerCase().includes('assault') ? 'assault' : 
                            type.type.toLowerCase().includes('theft') ? 'theft' :
                            type.type.toLowerCase().includes('traffic') ? 'traffic' :
                            type.type.toLowerCase().includes('cyber') ? 'cyber' :
                            type.type.toLowerCase().includes('missing') ? 'missing' : 'resolved'})`
                        }} 
                      />
                    </div>
                    <span className="text-sm font-mono tabular-nums text-[var(--color-text-primary)] w-16 text-right">{type.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Prototype disclaimer */}
      <div className="hidden sm:block fixed bottom-4 right-4 text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] px-3 py-1.5 rounded border border-[var(--color-border)] shadow-sm">
        Prototype — Simulated Data
      </div>
    </div>
  );
}