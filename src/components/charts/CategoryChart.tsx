'use client';

/**
 * @fileoverview CategoryChart – doughnut chart for CO₂ category breakdown.
 * Shows percentage labels and a center text displaying total emissions.
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
import styles from './CategoryChart.module.css';

ChartJS.register(ArcElement, Tooltip, Legend);

/** Default colorblind-safe category colors */
const DEFAULT_COLORS: Record<string, string> = {
  Transport: 'hsl(200, 85%, 55%)',
  Energy: 'hsl(40, 95%, 55%)',
  Food: 'hsl(152, 68%, 42%)',
  Shopping: 'hsl(280, 60%, 60%)',
};

/** Props for the CategoryChart component */
export interface CategoryChartProps {
  /** Chart data */
  data: {
    /** Category labels */
    labels: string[];
    /** Emission values (kg CO₂) per category */
    values: number[];
    /** Hex/HSL colors for each category */
    colors: string[];
  };
}

/**
 * Custom Chart.js plugin that draws total emission text in the center of the doughnut.
 */
function createCenterTextPlugin(total: number): Plugin<'doughnut'> {
  return {
    id: 'centerText',
    afterDraw(chart) {
      const { ctx, width, height } = chart;
      ctx.save();

      const formattedTotal = total >= 1000
        ? `${(total / 1000).toFixed(1)}t`
        : `${total.toFixed(1)}kg`;

      /* Total value */
      ctx.font = `bold 22px system-ui, sans-serif`;
      ctx.fillStyle = 'hsl(0, 0%, 95%)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(formattedTotal, width / 2, height / 2 - 10);

      /* Sublabel */
      ctx.font = `12px system-ui, sans-serif`;
      ctx.fillStyle = 'hsl(0, 0%, 70%)';
      ctx.fillText('CO₂ total', width / 2, height / 2 + 14);

      ctx.restore();
    },
  };
}

/**
 * CategoryChart renders a doughnut chart with a center total, percentage tooltip,
 * and an accessible bottom legend.
 */
export default function CategoryChart({ data }: CategoryChartProps) {
  const total = useMemo(() => data.values.reduce((s, v) => s + v, 0), [data.values]);

  const colors = useMemo(
    () =>
      data.labels.map(
        (label, i) => data.colors[i] ?? DEFAULT_COLORS[label] ?? `hsl(${i * 90}, 60%, 55%)`
      ),
    [data.labels, data.colors]
  );

  const centerPlugin = useMemo(() => createCenterTextPlugin(total), [total]);

  const chartData: ChartData<'doughnut'> = {
    labels: data.labels,
    datasets: [
      {
        data: data.values,
        backgroundColor: colors,
        borderColor: 'hsl(220, 16%, 16%)',
        borderWidth: 3,
        hoverBorderColor: 'hsl(220, 16%, 20%)',
        hoverOffset: 8,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: 'hsl(0, 0%, 70%)',
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { size: 12, family: 'system-ui, sans-serif' },
          generateLabels: (chart) => {
            const dataset = chart.data.datasets[0];
            return (chart.data.labels as string[]).map((label, i) => {
              const value = (dataset.data as number[])[i] ?? 0;
              const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              return {
                text: `${label} (${pct}%)`,
                fillStyle: (dataset.backgroundColor as string[])[i],
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
            const value = ctx.parsed;
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${ctx.label}: ${value.toFixed(2)} kg CO₂ (${pct}%)`;
          },
        },
      },
    },
  };

  const ariaDescription = data.labels
    .map((label, i) => {
      const pct = total > 0 ? ((data.values[i] / total) * 100).toFixed(1) : '0';
      return `${label}: ${data.values[i].toFixed(1)} kg (${pct}%)`;
    })
    .join(', ');

  return (
    <div
      className={styles.container}
      role="img"
      aria-label={`Doughnut chart showing CO₂ breakdown by category. Total: ${total.toFixed(1)} kg. ${ariaDescription}`}
    >
      <Doughnut data={chartData} options={options} plugins={[centerPlugin]} />
    </div>
  );
}
