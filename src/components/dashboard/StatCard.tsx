'use client';

import { type ReactNode, useEffect, useState } from 'react';
import styles from './StatCard.module.css';

/** Direction of the trend indicator. */
type TrendDirection = 'up' | 'down' | 'neutral';

/** Trend data for the stat card. */
interface Trend {
  direction: TrendDirection;
  value: string;
}

/** Supported accent colors. */
type StatColor = 'green' | 'blue' | 'amber' | 'red';

/** Props for the {@link StatCard} component. */
interface StatCardProps {
  /** Metric label. */
  title: string;
  /** Primary metric value (number or formatted string). */
  value: string;
  /** Unit label displayed after the value (e.g. "kg CO₂"). */
  unit?: string;
  /** Trend indicator with direction arrow and change value. */
  trend?: Trend;
  /** Icon rendered in a tinted circle. */
  icon?: ReactNode;
  /** Accent color for the icon background. @default 'green' */
  color?: StatColor;
}

/** Map of color → CSS module class. */
const COLOR_MAP: Record<StatColor, string> = {
  green: styles.iconWrapperGreen,
  blue: styles.iconWrapperBlue,
  amber: styles.iconWrapperAmber,
  red: styles.iconWrapperRed,
};

/** Map of trend direction → CSS module class. */
const TREND_CLASS_MAP: Record<TrendDirection, string> = {
  up: styles.trendUp,
  down: styles.trendDown,
  neutral: styles.trendNeutral,
};

/** Map of trend direction → arrow character. */
const TREND_ARROW_MAP: Record<TrendDirection, string> = {
  up: '▲',
  down: '▼',
  neutral: '—',
};

/**
 * Stat metric card displaying a large numeric value, optional unit, trend
 * indicator (▲/▼ + percentage), and a tinted icon. The value animates in
 * on mount with a fade-up effect.
 *
 * @example
 * ```tsx
 * <StatCard
 *   title="Monthly Emissions"
 *   value="142.5"
 *   unit="kg CO₂"
 *   trend={{ direction: 'down', value: '12%' }}
 *   color="green"
 *   icon={<LeafIcon />}
 * />
 * ```
 */
export default function StatCard({
  title,
  value,
  unit,
  trend,
  icon,
  color = 'green',
}: StatCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger the fade-up animation after mount
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {icon && (
          <div className={`${styles.iconWrapper} ${COLOR_MAP[color]}`}>
            <span className={styles.iconInner}>{icon}</span>
          </div>
        )}
      </div>

      <div className={styles.body}>
        <p className={`${styles.value} ${mounted ? styles.valueAnimating : ''}`}>
          {value}
        </p>
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>

      {trend && (
        <div className={styles.footer}>
          <span
            className={`${styles.trend} ${TREND_CLASS_MAP[trend.direction]}`}
            aria-label={`Trend: ${trend.direction} ${trend.value}`}
          >
            <span className={styles.trendArrow} aria-hidden="true">
              {TREND_ARROW_MAP[trend.direction]}
            </span>
            {trend.value}
          </span>
        </div>
      )}
    </div>
  );
}
