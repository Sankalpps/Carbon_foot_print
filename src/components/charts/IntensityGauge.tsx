'use client';

/**
 * @fileoverview IntensityGauge – animated radial semicircle gauge
 * displaying real-time carbon intensity (gCO₂/kWh).
 * Color gradient: green (0–100) → yellow (100–250) → red (250+).
 */

import { useMemo } from 'react';
import styles from './IntensityGauge.module.css';

/** Props for the IntensityGauge component */
export interface IntensityGaugeProps {
  /** Current carbon intensity in gCO₂/kWh */
  value: number;
  /** Maximum gauge value (default 500) */
  maxValue?: number;
  /** Label displayed above the gauge */
  label: string;
}

/**
 * Returns an HSL color string based on the intensity value.
 * Green for low (0–100), yellow for medium (100–250), red for high (250+).
 * @param value - Current intensity value
 * @param max - Maximum gauge value
 */
function getGaugeColor(value: number, max: number): string {
  const ratio = Math.min(value / max, 1);
  if (ratio <= 0.2) return 'hsl(152, 68%, 42%)';   // Green
  if (ratio <= 0.4) return 'hsl(80, 65%, 45%)';     // Yellow-green
  if (ratio <= 0.5) return 'hsl(48, 90%, 50%)';     // Yellow
  if (ratio <= 0.65) return 'hsl(35, 90%, 50%)';    // Orange
  return 'hsl(0, 75%, 50%)';                         // Red
}

/**
 * Returns a severity label for screen readers.
 * @param value - Current intensity value
 */
function getSeverityLabel(value: number): string {
  if (value <= 100) return 'Low';
  if (value <= 250) return 'Medium';
  return 'High';
}

/**
 * IntensityGauge renders a semicircular SVG gauge that animates to the
 * current carbon intensity value. Includes a digital readout and
 * full ARIA attributes for accessibility.
 */
export default function IntensityGauge({
  value,
  maxValue = 500,
  label,
}: IntensityGaugeProps) {
  const clampedValue = Math.min(Math.max(0, value), maxValue);

  const gaugeConfig = useMemo(() => {
    const svgWidth = 200;
    const svgHeight = 120;
    const strokeW = 14;
    const radius = 80;
    const centerX = svgWidth / 2;
    const centerY = svgHeight - 10;

    /** Semicircle arc length */
    const arcLength = Math.PI * radius;
    const progress = clampedValue / maxValue;
    const dashOffset = arcLength * (1 - progress);

    /** Needle angle: 180° (left) to 0° (right) */
    const needleAngle = Math.PI * (1 - progress);
    const needleLength = radius - strokeW - 6;
    const needleX = centerX + needleLength * Math.cos(needleAngle);
    const needleY = centerY - needleLength * Math.sin(needleAngle);

    return {
      svgWidth,
      svgHeight,
      strokeW,
      radius,
      centerX,
      centerY,
      arcLength,
      dashOffset,
      needleX,
      needleY,
    };
  }, [clampedValue, maxValue]);

  const color = getGaugeColor(clampedValue, maxValue);
  const severity = getSeverityLabel(clampedValue);

  const {
    svgWidth, svgHeight, strokeW, radius,
    centerX, centerY, arcLength, dashOffset,
    needleX, needleY,
  } = gaugeConfig;

  /** Arc path: semicircle from left to right */
  const arcPath = `
    M ${centerX - radius} ${centerY}
    A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}
  `;

  return (
    <div
      className={styles.container}
      role="meter"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={maxValue}
      aria-valuetext={`Current carbon intensity: ${clampedValue} gCO₂ per kWh. ${severity} intensity.`}
      aria-label={label}
    >
      <span className={styles.label}>{label}</span>

      <svg
        className={styles.svg}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Gradient definition for the arc */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(152, 68%, 42%)" />
            <stop offset="40%" stopColor="hsl(48, 90%, 50%)" />
            <stop offset="100%" stopColor="hsl(0, 75%, 50%)" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <path
          d={arcPath}
          fill="none"
          stroke="hsl(220, 15%, 25%)"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* Filled arc */}
        <path
          className={styles.filledArc}
          d={arcPath}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={dashOffset}
        />

        {/* Needle line */}
        <line
          className={styles.needle}
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke="hsl(0, 0%, 95%)"
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {/* Needle pivot */}
        <circle
          cx={centerX}
          cy={centerY}
          r={5}
          fill="hsl(0, 0%, 95%)"
        />

        {/* Scale labels */}
        <text
          x={centerX - radius - 5}
          y={centerY + 16}
          fill="hsl(0, 0%, 50%)"
          fontSize="10"
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
        >
          0
        </text>
        <text
          x={centerX + radius + 5}
          y={centerY + 16}
          fill="hsl(0, 0%, 50%)"
          fontSize="10"
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
        >
          {maxValue}
        </text>
      </svg>

      <div className={styles.readout}>
        <span className={styles.value} style={{ color }}>
          {Math.round(clampedValue)}
        </span>
        <span className={styles.unit}>gCO₂/kWh</span>
      </div>

      <span
        className={styles.severity}
        style={{ color }}
      >
        {severity} intensity
      </span>
    </div>
  );
}
