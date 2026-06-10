'use client';

/**
 * @fileoverview PredictionChart – line chart combining historical and
 * ML-predicted CO₂ data with a shaded confidence interval.
 */

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
  type Plugin,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import styles from './PredictionChart.module.css';

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

/** Props for the PredictionChart component */
export interface PredictionChartProps {
  /** Historical emission values (kg CO₂) */
  historicalData: number[];
  /** Predicted emission values (kg CO₂) */
  predictedData: number[];
  /** X-axis labels for all data points (historical + predicted) */
  labels: string[];
  /** Upper bound of the confidence interval */
  confidenceUpper: number[];
  /** Lower bound of the confidence interval */
  confidenceLower: number[];
}

/**
 * Chart.js plugin that draws a vertical dashed line at the boundary
 * between historical and predicted data.
 */
function createDividerPlugin(dividerIndex: number): Plugin<'line'> {
  return {
    id: 'predictionDivider',
    afterDraw(chart) {
      const { ctx, scales } = chart;
      const xScale = scales['x'];
      const yScale = scales['y'];

      if (!xScale || !yScale) return;

      const xPos = xScale.getPixelForValue(dividerIndex);

      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = 'hsl(0, 0%, 50%)';
      ctx.lineWidth = 1.5;
      ctx.moveTo(xPos, yScale.top);
      ctx.lineTo(xPos, yScale.bottom);
      ctx.stroke();

      /* Label above the divider line */
      ctx.setLineDash([]);
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = 'hsl(0, 0%, 60%)';
      ctx.textAlign = 'center';
      ctx.fillText('Forecast →', xPos + 40, yScale.top - 6);
      ctx.restore();
    },
  };
}

/**
 * PredictionChart displays historical emissions as a solid line, ML predictions
 * as a dashed line, and a shaded confidence band between upper/lower bounds.
 * A vertical dashed divider separates the two regions.
 */
export default function PredictionChart({
  historicalData,
  predictedData,
  labels,
  confidenceUpper,
  confidenceLower,
}: PredictionChartProps) {
  const histLen = historicalData.length;
  const dividerIndex = histLen - 1;

  /**
   * Build a full-length array for historical: data for indices 0..histLen-1, then NaN.
   * For predicted: NaN for indices 0..histLen-2, then overlap at histLen-1, then predicted data.
   */
  const historicalFull: (number | null)[] = labels.map((_, i) =>
    i < histLen ? historicalData[i] : null
  );

  const predictedFull: (number | null)[] = labels.map((_, i) => {
    if (i < histLen - 1) return null;
    if (i === histLen - 1) return historicalData[histLen - 1]; // overlap point
    return predictedData[i - histLen] ?? null;
  });

  const upperFull: (number | null)[] = labels.map((_, i) => {
    if (i < histLen - 1) return null;
    if (i === histLen - 1) return historicalData[histLen - 1];
    return confidenceUpper[i - histLen] ?? null;
  });

  const lowerFull: (number | null)[] = labels.map((_, i) => {
    if (i < histLen - 1) return null;
    if (i === histLen - 1) return historicalData[histLen - 1];
    return confidenceLower[i - histLen] ?? null;
  });

  const chartData: ChartData<'line'> = {
    labels,
    datasets: [
      /* Confidence upper bound (hidden line, used as fill boundary) */
      {
        label: 'Confidence Upper',
        data: upperFull as number[],
        borderColor: 'transparent',
        backgroundColor: 'hsla(200, 85%, 55%, 0.1)',
        fill: '+1',
        pointRadius: 0,
        tension: 0.3,
        borderWidth: 0,
        spanGaps: false,
      },
      /* Confidence lower bound */
      {
        label: 'Confidence Lower',
        data: lowerFull as number[],
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        fill: false,
        pointRadius: 0,
        tension: 0.3,
        borderWidth: 0,
        spanGaps: false,
      },
      /* Historical data – solid line */
      {
        label: 'Historical',
        data: historicalFull as number[],
        borderColor: 'hsl(152, 68%, 42%)',
        backgroundColor: 'hsla(152, 68%, 42%, 0.1)',
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: 'hsl(152, 68%, 42%)',
        pointBorderColor: 'hsl(220, 16%, 16%)',
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
        spanGaps: false,
      },
      /* Predicted data – dashed line */
      {
        label: 'Predicted',
        data: predictedFull as number[],
        borderColor: 'hsl(200, 85%, 55%)',
        backgroundColor: 'hsla(200, 85%, 55%, 0.08)',
        borderWidth: 2.5,
        borderDash: [8, 4],
        pointRadius: 4,
        pointBackgroundColor: 'hsl(200, 85%, 55%)',
        pointBorderColor: 'hsl(220, 16%, 16%)',
        pointBorderWidth: 2,
        tension: 0.4,
        fill: true,
        spanGaps: false,
      },
    ],
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
        display: true,
        position: 'top',
        labels: {
          color: 'hsl(0, 0%, 70%)',
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { size: 12, family: 'system-ui, sans-serif' },
          filter: (item) => {
            /* Hide the confidence bound lines from the legend */
            return !item.text?.includes('Confidence');
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
        filter: (item) => {
          return !item.dataset.label?.includes('Confidence');
        },
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y !== null && ctx.parsed.y !== undefined ? ctx.parsed.y.toFixed(2) : '0.00'} kg CO₂`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'hsl(220, 15%, 20%)',
          lineWidth: 0.5,
        },
        ticks: {
          color: 'hsl(0, 0%, 70%)',
          font: { size: 11, family: 'system-ui, sans-serif' },
          maxRotation: 45,
          autoSkip: true,
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

  const dividerPlugin = createDividerPlugin(dividerIndex);

  return (
    <div
      className={styles.container}
      role="img"
      aria-label={`Prediction chart showing ${histLen} historical data points and ${predictedData.length} predicted data points with confidence interval.`}
    >
      <Line data={chartData} options={options} plugins={[dividerPlugin]} />
    </div>
  );
}
