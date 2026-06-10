'use client';

/**
 * @fileoverview TrendChart – line chart showing CO₂ emissions over time.
 * Uses Chart.js with smooth curves, gradient fills, and a colorblind-safe palette.
 */

import { useRef, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import styles from './TrendChart.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/** Colorblind-safe palette (Wong 2011) adapted for dark backgrounds */
const COLORBLIND_PALETTE = [
  { border: 'hsl(152, 68%, 42%)', bg: 'hsla(152, 68%, 42%, 0.15)' },
  { border: 'hsl(200, 85%, 55%)', bg: 'hsla(200, 85%, 55%, 0.15)' },
  { border: 'hsl(40, 95%, 55%)', bg: 'hsla(40, 95%, 55%, 0.15)' },
  { border: 'hsl(0, 75%, 55%)', bg: 'hsla(0, 75%, 55%, 0.15)' },
  { border: 'hsl(280, 60%, 60%)', bg: 'hsla(280, 60%, 60%, 0.15)' },
] as const;

/** Dataset configuration for the TrendChart */
export interface TrendDataset {
  /** Display label for the dataset */
  label: string;
  /** Numeric data points */
  data: number[];
  /** Optional border (line) color override */
  borderColor?: string;
  /** Optional fill color override */
  backgroundColor?: string;
}

/** Props for the TrendChart component */
export interface TrendChartProps {
  /** Chart data with labels and datasets */
  data: {
    labels: string[];
    datasets: TrendDataset[];
  };
  /** Time period for axis formatting */
  period: 'week' | 'month' | '6months' | 'year';
}

/**
 * Returns a human-readable period label for chart title generation.
 * @param period - The selected time period
 */
function getPeriodLabel(period: TrendChartProps['period']): string {
  const labels: Record<TrendChartProps['period'], string> = {
    week: 'Past Week',
    month: 'Past Month',
    '6months': 'Past 6 Months',
    year: 'Past Year',
  };
  return labels[period];
}

/**
 * TrendChart renders a responsive line chart for CO₂ emissions over time.
 * Features smooth curves (tension 0.4), gradient fills, dark theme grid lines,
 * and full keyboard/screen-reader accessibility.
 */
export default function TrendChart({ data, period }: TrendChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  /** Creates a vertical gradient fill for a dataset line */
  const createGradient = useCallback(
    (ctx: CanvasRenderingContext2D, colorHsl: string): CanvasGradient => {
      const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.clientHeight);
      gradient.addColorStop(0, colorHsl.replace(')', ', 0.35)').replace('hsl', 'hsla'));
      gradient.addColorStop(1, colorHsl.replace(')', ', 0.02)').replace('hsl', 'hsla'));
      return gradient;
    },
    []
  );

  /** Apply gradients once the chart canvas is ready */
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const ctx = chart.ctx;
    chart.data.datasets.forEach((dataset, i) => {
      const palette = COLORBLIND_PALETTE[i % COLORBLIND_PALETTE.length];
      const borderCol = (dataset.borderColor as string) || palette.border;
      dataset.backgroundColor = createGradient(ctx, borderCol);
    });
    chart.update('none');
  }, [data, createGradient]);

  const chartData: ChartData<'line'> = {
    labels: data.labels,
    datasets: data.datasets.map((ds, i) => {
      const palette = COLORBLIND_PALETTE[i % COLORBLIND_PALETTE.length];
      return {
        label: ds.label,
        data: ds.data,
        borderColor: ds.borderColor ?? palette.border,
        backgroundColor: ds.backgroundColor ?? palette.bg,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: ds.borderColor ?? palette.border,
        pointBorderColor: 'hsl(220, 16%, 16%)',
        pointBorderWidth: 2,
        borderWidth: 2.5,
      };
    }),
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: data.datasets.length > 1,
        position: 'top',
        labels: {
          color: 'hsl(0, 0%, 70%)',
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { size: 12, family: 'system-ui, sans-serif' },
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
        displayColors: true,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y !== null && ctx.parsed.y !== undefined ? ctx.parsed.y.toFixed(2) : '0.00'} kg CO₂`,
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'hsl(220, 15%, 25%)',
          lineWidth: 0.5,
        },
        ticks: {
          color: 'hsl(0, 0%, 70%)',
          font: { size: 11, family: 'system-ui, sans-serif' },
          maxRotation: 45,
          autoSkip: true,
          maxTicksLimit: period === 'week' ? 7 : period === 'month' ? 10 : 12,
        },
        border: { color: 'hsl(220, 15%, 25%)' },
      },
      y: {
        grid: {
          color: 'hsl(220, 15%, 20%)',
          lineWidth: 0.5,
        },
        ticks: {
          color: 'hsl(0, 0%, 70%)',
          font: { size: 11, family: 'system-ui, sans-serif' },
          callback: (value) => `${value} kg`,
        },
        title: {
          display: true,
          text: 'kg CO₂',
          color: 'hsl(0, 0%, 70%)',
          font: { size: 12, family: 'system-ui, sans-serif' },
        },
        border: { color: 'hsl(220, 15%, 25%)' },
        beginAtZero: true,
      },
    },
  };

  const periodLabel = getPeriodLabel(period);

  return (
    <div
      className={styles.container}
      role="img"
      aria-label={`Line chart showing CO₂ emissions trend for the ${periodLabel}. ${data.datasets.length} dataset(s) with ${data.labels.length} data points.`}
    >
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
