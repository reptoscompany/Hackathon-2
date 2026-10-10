import { useRef, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { LineChart, BarChart, HeatmapChart, PieChart, ScatterChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent, VisualMapComponent, DatasetComponent, MarkPointComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  LineChart, BarChart, HeatmapChart, PieChart, ScatterChart,
  TitleComponent, TooltipComponent, GridComponent, LegendComponent,
  VisualMapComponent, DatasetComponent, MarkPointComponent,
  CanvasRenderer
]);

const COLORS = [
  '#2118C9', '#D71920', '#16a34a', '#E8C21A', '#7c3aed', '#ea580c', '#0891b2', '#64748b'
];

const getTheme = (dark = false) => ({
  color: COLORS,
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'IBM Plex Sans, sans-serif',
    color: dark ? '#e2e8f0' : '#1e293b',
    fontSize: 12
  },
  title: {
    textStyle: {
      color: dark ? '#f1f5f9' : '#111C32',
      fontWeight: 600,
      fontSize: 14
    }
  },
  grid: {
    left: 40,
    right: 20,
    top: 40,
    bottom: 40
  },
  xAxis: {
    axisLine: { lineStyle: { color: dark ? '#334155' : '#e2e8f0' } },
    axisTick: { show: false },
    axisLabel: { color: dark ? '#94a3b8' : '#64748b', fontSize: 11 },
    splitLine: { show: false }
  },
  yAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: dark ? '#94a3b8' : '#64748b', fontSize: 11 },
    splitLine: { lineStyle: { color: dark ? '#1e293b' : '#f1f5f9', type: 'dashed' } }
  },
  tooltip: {
    backgroundColor: dark ? '#1e293b' : '#ffffff',
    borderColor: dark ? '#334155' : '#e2e8f0',
    borderWidth: 1,
    textStyle: { color: dark ? '#f1f5f9' : '#1e293b' },
    extraCssText: 'box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); border-radius: 8px; padding: 8px 12px;'
  },
  legend: {
    textStyle: { color: dark ? '#cbd5e1' : '#475569', fontSize: 12 },
    itemWidth: 12,
    itemHeight: 8,
    itemGap: 16,
    padding: [0, 0, 8, 0]
  },
  visualMap: {
    textStyle: { color: dark ? '#cbd5e1' : '#475569', fontSize: 11 }
  }
});

const Chart = ({ 
  option, 
  className = '', 
  style = {}, 
  height = 300,
  loading = false,
  onClick,
  onDataZoom,
  theme = 'light',
  ...props 
}) => {
  const chartRef = useRef(null);
  const mergedOption = useMemo(() => ({
    ...getTheme(theme === 'dark'),
    ...option,
    animation: true,
    animationDuration: 500,
    animationEasing: 'cubicOut'
  }), [option, theme]);

  const handleEvents = useMemo(() => ({
    click: onClick,
    datazoom: onDataZoom
  }), [onClick, onDataZoom]);

  return (
    <div className={`relative ${className}`} style={{ height, width: '100%', ...style }} role="img" aria-label={option.title?.text || 'Chart'}>
      <ReactECharts
        ref={chartRef}
        option={mergedOption}
        style={{ height: '100%', width: '100%' }}
        onEvents={handleEvents}
        opts={{ 
          renderer: 'canvas',
          useDirtyRect: true
        }}
        {...props}
      />
      {loading && (
        <div className="absolute inset-0 bg-[var(--color-surface)]/80 flex items-center justify-center z-10 rounded-lg">
          <svg className="animate-spin w-8 h-8 text-[var(--color-accent)]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
        </div>
      )}
    </div>
  );
};

// Helper functions for common chart configs
export const createLineChartOption = (data, { 
  xKey = 'month', 
  yKeys = [], 
  labels = {}, 
  colors = COLORS,
  title,
  showLegend = true,
  smooth = true,
  areaStyle = false
} = {}) => ({
  title: title ? { text: title, left: 'center' } : undefined,
  legend: showLegend ? { 
    data: yKeys.map(k => labels[k] || k), 
    bottom: 0,
    selectedMode: true
  } : false,
  tooltip: { 
    trigger: 'axis',
    valueFormatter: (v) => v.toLocaleString()
  },
  xAxis: { 
    type: 'category', 
    data: data.map(d => d[xKey]),
    boundaryGap: false
  },
  yAxis: { 
    type: 'value',
    axisLabel: { formatter: '{value}' }
  },
  series: yKeys.map((key, i) => ({
    name: labels[key] || key,
    type: 'line',
    data: data.map(d => d[key] ?? null),
    smooth,
    showSymbol: false,
    lineStyle: { width: 2, color: colors[i % colors.length] },
    itemStyle: { color: colors[i % colors.length] },
    areaStyle: areaStyle ? { 
      opacity: 0.1,
      color: {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: colors[i % colors.length] }, { offset: 1, color: 'transparent' }]
      }
    } : undefined,
    emphasis: { focus: 'series' }
  }))
});

export const createBarChartOption = (data, { 
  xKey = 'month', 
  yKeys = [], 
  labels = {}, 
  colors = COLORS,
  title,
  showLegend = true,
  stacked = false
} = {}) => ({
  title: title ? { text: title, left: 'center' } : undefined,
  legend: showLegend ? { data: yKeys.map(k => labels[k] || k), bottom: 0 } : false,
  tooltip: { trigger: 'axis', valueFormatter: (v) => v.toLocaleString() },
  xAxis: { type: 'category', data: data.map(d => d[xKey]) },
  yAxis: { type: 'value' },
  series: yKeys.map((key, i) => ({
    name: labels[key] || key,
    type: 'bar',
    data: data.map(d => d[key] ?? 0),
    stack: stacked ? 'total' : undefined,
    itemStyle: { color: colors[i % colors.length], borderRadius: [4, 4, 0, 0] },
    emphasis: { focus: 'series' },
    barMaxWidth: 32
  }))
});

export const createHeatmapOption = (data, { 
  xLabels = [], 
  yLabels = [], 
  title,
  colorScale = ['#fef3c7', '#fde68a', '#fcd34d', '#f59e0b', '#d97706', '#b45309']
} = {}) => ({
  title: title ? { text: title, left: 'center' } : undefined,
  tooltip: { 
    trigger: 'item',
    formatter: (params) => `${params.value[2] ? yLabels[params.value[1]] : ''} ${params.value[1] ? xLabels[params.value[0]] : ''}: ${params.value[2] ?? 0}`
  },
  grid: { left: 80, right: 20, top: 40, bottom: 60 },
  xAxis: { type: 'category', data: xLabels, axisLabel: { interval: 0, rotate: 45 } },
  yAxis: { type: 'category', data: yLabels },
  visualMap: { 
    min: 0, 
    max: Math.max(...data.map(d => d[2] || 0), 1),
    calculable: true, 
    orient: 'horizontal', 
    left: 'center', 
    bottom: 10,
    inRange: { color: colorScale }
  },
  series: [{
    type: 'heatmap',
    data,
    emphasis: { focus: 'cell' },
    label: { show: true, formatter: (p) => p.value[2] ? p.value[2] : '', fontSize: 10 }
  }]
});

export const createPieChartOption = (data, { title, valueKey = 'count', nameKey = 'type', colors = COLORS } = {}) => ({
  title: title ? { text: title, left: 'center' } : undefined,
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { orient: 'vertical', left: 'left', top: 'middle' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
    label: { show: false, position: 'center' },
    emphasis: { 
      label: { show: true, fontSize: 16, fontWeight: 'bold' } 
    },
    labelLine: { show: false },
    data: data.map((d, i) => ({
      value: d[valueKey],
      name: d[nameKey],
      itemStyle: { color: colors[i % colors.length] }
    }))
  }]
});

export { Chart };
export default Chart;