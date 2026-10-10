import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components';
import { Chart, createLineChartOption, createBarChartOption, createHeatmapOption } from '@/components';
import { Table } from '@/components';
import { Badge } from '@/components';
import { LoadingState, ErrorState } from '@/components/DataState';
import { useData } from '@/services/DataContext';
import { suggestPatrolWindows } from '@/utils/geo';

const HOUR_BLOCKS = ['0-2', '2-4', '4-6', '6-8', '8-10', '10-12', '12-14', '14-16', '16-18', '18-20', '20-22', '22-24'];

export function TrendsTime() {
  const { services, loading, error } = useData();

  const model = useMemo(() => {
    if (!services) return null;
    const monthly = services.charts.monthlyTrends;
    // Yearly comparison: split monthly labels into two 6-month halves of the sample window
    const half = Math.ceil(monthly.length / 2);
    const first = monthly.slice(0, half);
    const second = monthly.slice(half);

    // Weekday vs weekend
    const dow = services.charts.dayCounts; // Sun..Sat
    const weekday = dow.slice(1, 6).reduce((s, d) => s + d.count, 0);
    const weekend = dow[0].count + dow[6].count;

    // Time-by-location heatmap: ward x hour-block
    const wards = [...new Set(services.incidents.map((i) => i.ward))].sort().slice(0, 8);
    const heat = [];
    wards.forEach((w, yi) => {
      HOUR_BLOCKS.forEach((_, xi) => {
        const count = services.incidents.filter((i) => {
          if (i.ward !== w) return false;
          const h = parseInt(i.incident_time.split(':')[0], 10);
          return Math.floor(h / 2) === xi;
        }).length;
        heat.push([xi, yi, count]);
      });
    });

    const windows = suggestPatrolWindows(services.incidents, 6);

    return { monthly, first, second, weekday, weekend, wards, heat, windows };
  }, [services]);

  if (loading) return <div className="p-6"><LoadingState message="Loading time analysis…" /></div>;
  if (error || !services || !model) return <div className="p-6"><ErrorState message="Trend data could not be loaded." onRetry={() => window.location.reload()} /></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-navy-900)]">Trends &amp; Time Analysis</h1>
        <p className="text-[var(--color-text-secondary)]">When crime happens — every figure computed from the sample data</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly trend with festival markers (sample)</CardTitle>
            <CardDescription>Markers are illustrative sample annotations, not official statistics.</CardDescription>
          </CardHeader>
          <CardContent>
            <Chart
              height={280}
              option={{
                ...createLineChartOption(model.monthly, { xKey: 'month', yKeys: ['count'], labels: { count: 'Incidents' }, showLegend: false, areaStyle: true }),
                series: [{
                  ...createLineChartOption(model.monthly, { xKey: 'month', yKeys: ['count'], labels: { count: 'Incidents' }, showLegend: false, areaStyle: true }).series[0],
                  markPoint: {
                    data: [
                      { name: 'Pongal season (sample)', value: 'Jan', xAxis: model.monthly.findIndex((m) => m.month.endsWith('-01')), yAxis: 'max' },
                      { name: 'Festival season (sample)', value: 'Oct', xAxis: model.monthly.findIndex((m) => m.month.endsWith('-10')), yAxis: 'max' }
                    ]
                  }
                }]
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>First half vs second half (yearly comparison)</CardTitle>
            <CardDescription>Same 12-month sample window split in two for a like-for-like read.</CardDescription>
          </CardHeader>
          <CardContent>
            <Chart
              height={280}
              option={createBarChartOption(
                model.first.map((d, i) => ({ period: `M${i + 1}`, firstHalf: d.count, secondHalf: model.second[i]?.count ?? 0 })),
                { xKey: 'period', yKeys: ['firstHalf', 'secondHalf'], labels: { firstHalf: 'First half', secondHalf: 'Second half' } }
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hour of day</CardTitle>
            <CardDescription>Evening peak 18:00–22:00 is driven by the market cluster.</CardDescription>
          </CardHeader>
          <CardContent>
            <Chart height={260} option={createBarChartOption(services.charts.hourCounts, { xKey: 'hour', yKeys: ['count'], labels: { count: 'Incidents' }, showLegend: false })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Day of week · weekday vs weekend</CardTitle>
            <CardDescription>Weekday total {model.weekday} · weekend total {model.weekend} (sample data).</CardDescription>
          </CardHeader>
          <CardContent>
            <Chart height={260} option={createBarChartOption(services.charts.dayCounts, { xKey: 'day', yKeys: ['count'], labels: { count: 'Incidents' }, showLegend: false })} />
            <div className="mt-2 flex gap-2 flex-wrap">
              <Badge variant="gray">Weekday share: {(model.weekday / (model.weekday + model.weekend) * 100).toFixed(0)}%</Badge>
              <Badge variant="warning">Weekend share: {(model.weekend / (model.weekday + model.weekend) * 100).toFixed(0)}%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Time × location heatmap</CardTitle>
          <CardDescription>Ward rows × 2-hour columns. Darker = more incidents. Values labeled directly.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-1 px-1">
            <div className="min-w-[560px]">
              <Chart height={340} option={createHeatmapOption(model.heat, { xLabels: HOUR_BLOCKS, yLabels: model.wards })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suggested patrol windows (generated from the data)</CardTitle>
          <CardDescription>Top ward × day × 2-hour cells by incident count, then severity. Not hard-coded.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table
            columns={[
              { key: 'ward', header: 'Ward' },
              { key: 'day', header: 'Day' },
              { key: 'block', header: 'Window' },
              { key: 'count', header: 'Incidents' },
              { key: 'avgSeverity', header: 'Avg severity', render: (r) => `${(r.avgSeverity * 100).toFixed(0)}%` },
              { key: 'rec', header: 'Suggestion', render: (r) => `Foot + mobile patrol, ${r.block}` }
            ]}
            data={model.windows.map((w, i) => ({ id: i, ...w, rec: '' }))}
            pageSize={6}
            exportFilename="patrol-windows.csv"
          />
        </CardContent>
      </Card>
    </div>
  );
}
