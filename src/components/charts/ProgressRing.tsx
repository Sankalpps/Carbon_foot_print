'use client';

/**
 * @fileoverview ProgressRing – SVG circular progress indicator.
 * Animates stroke-dashoffset on mount and value changes.
 * Fully accessible with role="progressbar" and ARIA attributes.
 */

import { useMemo } from 'react';
import styles from './ProgressRing.module.css';

/** Props for the ProgressRing component */
export interface ProgressRingProps {
  /** Progress value from 0 to 100 */
  progress: number;
  /** Diameter of the ring in pixels */
  size?: number;
  /** Stroke width of the ring in pixels */
  strokeWidth?: number;
  /** Ring fill color (CSS color value) */
  color?: string;
  /** Primary text shown inside the ring */
  label: string;
  /** Secondary text shown below the label */
  sublabel?: string;
}

/**
 * ProgressRing renders an animated SVG circle that fills proportionally
 * to the given progress value (0–100). Includes center text and sub-label.
 *
 * @example
 * ```tsx
 * <ProgressRing progress={72} label="72%" sublabel="of goal" />
 * ```
 */
export default function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = 'hsl(152, 68%, 42%)',
  label,
  sublabel,
}: ProgressRingProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const { radius, circumference, dashOffset } = useMemo(() => {
    const r = (size - strokeWidth) / 2;
    const c = 2 * Math.PI * r;
    const offset = c - (clampedProgress / 100) * c;
    return { radius: r, circumference: c, dashOffset: offset };
  }, [size, strokeWidth, clampedProgress]);

  const center = size / 2;

  return (
    <div
      className={styles.wrapper}
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progress: ${clampedProgress}%. ${label}${sublabel ? ` – ${sublabel}` : ''}`}
      style={{ width: size, height: size }}
    >
      <svg
        className={styles.svg}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background track */}
        <circle
          className={styles.track}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(220, 15%, 25%)"
          strokeWidth={strokeWidth}
        />
        {/* Animated progress arc */}
        <circle
          className={styles.progress}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <div className={styles.textContainer}>
        <span className={styles.label}>{label}</span>
        {sublabel && <span className={styles.sublabel}>{sublabel}</span>}
      </div>
    </div>
  );
}
