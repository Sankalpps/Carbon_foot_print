'use client';

/**
 * @fileoverview FuelMixChart – real-time doughnut chart showing
 * energy source breakdown (fuel mix) with smooth update animations.
 */

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
  type Plugin,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import styles from './FuelMixChart.module.css';

ChartJS.register(ArcElement, Tooltip, Legend);

/** A single energy source in the fuel mix */
export interface FuelSource {
  /** Name of the energy source (e.g. "Solar", "Coal") */
  source: string;
  /** Percentage share (0–100) */
  percentage: number;
  /** Display color (CSS color value) */
  color: string;
}

/** Props for the FuelMixChart component */
export interface FuelMixChartProps {
  /** Array of energy sources with their percentages and colors */
  data: FuelSource[];
}

/** Default color assignments for common energy sources */
const DEFAULT_SOURCE_COLORS: Record<string, string> = {
  Solar: 'hsl(48, 90%, 50%)',
  Wind: 'hsl(152, 68%, 55%)',
  Nuclear: 'hsl(200, 85%, 55%)',
  Hydro: 'hsl(180, 60%, 45%)',
  Biomass: 'hsl(90, 45%, 50%)',
  Gas: 'hsl(30, 30%, 55%)',
  Coal: 'hsl(0, 0%, 40%)',
  Oil: 'hsl(20, 30%, 35%)',
  Other: 'hsl(0, 0%, 55%)',
};

/**
 * Chart.js plugin that renders percentage labels inside segments
 * when the segment is large enough (> 5%).
 */
const segmentLabelPlugin: Plugin<'doughnut'> = {
  id: 'segmentLabels',
  afterDraw(chart) {
    const { ctx } = chart;
    const dataset = chart.data.datasets[0];
    if (!dataset) return;

    const meta = chart.getDatasetMeta(0);
    const total = (dataset.data as number[]).reduce((s, v) => s + (v as number), 0);

    meta.data.forEach((element, i) => {
      const value = (dataset.data as number[])[i] ?? 0;
      const pct = total > 0 ? (value / total) * 100 : 0;

      if (pct <= 5) return;

      const arc = element as unknown as {
        x: number;
        y: number;
        startAngle: number;
        endAngle: number;
        innerRadius: number;
        outerRadius: number;
      };

      const midAngle = (arc.startAngle + arc.endAngle) / 2;
      const midRadius = (arc.innerRadius + arc.outerRadius) / 2;
      const x = arc.x + Math.cos(midAngle) * midRadius;
      const y = arc.y + Math.sin(midAngle) * midRadius;

      ctx.save();
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillStyle = 'hsl(0, 0%, 100%)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${pct.toFixed(0)}%`, x, y);
      ctx.restore();
    });
  },
};

/**
 * FuelMixChart renders a doughnut chart showing the real-time energy source
 * breakdown. Segments animate smoothly on data updates and display percentage
 * labels when large enough.
 */
export default function FuelMixChart({ data }: FuelMixChartProps) {
  const labels = useMemo(() => data.map((d) => d.source), [data]);
  const values = useMemo(() => data.map((d) => d.percentage), [data]);
  const colors = useMemo(
    () => data.map((d) => d.color || DEFAULT_SOURCE_COLORS[d.source] || 'hsl(0, 0%, 55%)'),
    [data]
  );

  const total = useMemo(() => values.reduce((s, v) => s + v, 0), [values]);

  const chartData: ChartData<'doughnut'> = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderColor: 'hsl(220, 16%, 16%)',
        borderWidth: 3,
        hoverBorderColor: 'hsl(220, 16%, 22%)',
        hoverOffset: 6,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '52%',
    animation: {
      animateRotate: true,
      duration: 600,
      easing: 'easeInOutQuart',
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: 'hsl(0, 0%, 70%)',
          padding: 12,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { size: 11, family: 'system-ui, sans-serif' },
          generateLabels: (chart) => {
            const ds = chart.data.datasets[0];
            return (chart.data.labels as string[]).map((lbl, i) => {
              const val = (ds.data as number[])[i] ?? 0;
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
              return {
                text: `${lbl} (${pct}%)`,
                fillStyle: (ds.backgroundColor as string[])[i],
                strokeStyle: 'transparent',
                lineWidth: 0,
                index: i,
                hidden: false,
                pointStyle: 'circle',
              };
            });
          },
        },
      },
      tooltip: {
        backgroundColor: 'hsl(220, 18%, 12%)',
        titleColor: 'hsl(0, 0%, 95%)',
        bodyColor: 'hsl(0, 0%, 70%)',
        borderColor: 'hsl(220, 15%, 25%)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed;
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
            return `${ctx.label}: ${val.toFixed(1)}% (${pct}% of mix)`;
          },
        },
      },
    },
  };

  const ariaDescription = data
    .filter((d) => d.percentage > 0)
    .map((d) => {
      const pct = total > 0 ? ((d.percentage / total) * 100).toFixed(1) : '0';
      return `${d.source}: ${pct}%`;
    })
    .join(', ');

  return (
    <div
      className={styles.container}
      role="img"
      aria-label={`Fuel mix doughnut chart showing energy source breakdown. ${ariaDescription}`}
    >
      <Doughnut data={chartData} options={options} plugins={[segmentLabelPlugin]} />
    </div>
  );
}
