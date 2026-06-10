import styles from './LiveIntensityBanner.module.css';

/** Grid intensity status levels. */
type IntensityStatus = 'low' | 'moderate' | 'high';

/** Props for the {@link LiveIntensityBanner} component. */
interface LiveIntensityBannerProps {
  /** Current carbon intensity in gCO₂/kWh. */
  intensity: number;
  /** Qualitative status bucket. */
  status: IntensityStatus;
  /** Whether the SSE/WebSocket connection is active. */
  isConnected: boolean;
}

/** Map of status → pulsing dot CSS class. */
const DOT_CLASS_MAP: Record<IntensityStatus, string> = {
  low: styles.dotLow,
  moderate: styles.dotModerate,
  high: styles.dotHigh,
};

/** Map of status → status text CSS class. */
const STATUS_TEXT_CLASS_MAP: Record<IntensityStatus, string> = {
  low: styles.statusLow,
  moderate: styles.statusModerate,
  high: styles.statusHigh,
};

/** Map of status → human-readable guidance text. */
const STATUS_TEXT_MAP: Record<IntensityStatus, string> = {
  low: 'Good time to use electricity',
  moderate: 'Moderate carbon intensity',
  high: 'Avoid if possible',
};

/**
 * Compact banner displaying live electricity grid carbon intensity.
 * Shows a pulsing status dot, the numeric intensity value, and contextual
 * guidance text. Uses `aria-live="polite"` so screen readers announce updates.
 *
 * @example
 * ```tsx
 * <LiveIntensityBanner intensity={124} status="low" isConnected={true} />
 * ```
 */
export default function LiveIntensityBanner({
  intensity,
  status,
  isConnected,
}: LiveIntensityBannerProps) {
  const dotClass = isConnected
    ? DOT_CLASS_MAP[status]
    : styles.dotDisconnected;

  return (
    <div className={styles.banner} aria-live="polite">
      {/* Pulsing status dot */}
      <span
        className={`${styles.statusDot} ${dotClass}`}
        aria-hidden="true"
      />

      {/* Intensity value */}
      <p className={styles.intensityValue}>
        {Math.round(intensity)}
        <span className={styles.intensityUnit}>gCO₂/kWh</span>
      </p>

      <div className={styles.divider} aria-hidden="true" />

      {/* Status text */}
      <p
        className={`${styles.statusText} ${
          isConnected ? STATUS_TEXT_CLASS_MAP[status] : ''
        }`}
      >
        {isConnected ? STATUS_TEXT_MAP[status] : 'Disconnected'}
      </p>

      {/* Connection indicator */}
      <span className={styles.connectionStatus}>
        <span
          className={`${styles.connectionDot} ${
            isConnected
              ? styles.connectionDotOnline
              : styles.connectionDotOffline
          }`}
          aria-hidden="true"
        />
        {isConnected ? 'Live' : 'Offline'}
      </span>
    </div>
  );
}
