'use client';

import styles from './AnomalyAlert.module.css';

/** Props for the {@link AnomalyAlert} component. */
interface AnomalyAlertProps {
  /** Emission category where the anomaly was detected. */
  category: string;
  /** The actual observed value. */
  actualValue: number;
  /** The expected (baseline) value predicted by the model. */
  expectedValue: number;
  /** Date when the anomaly was detected. */
  date: string;
  /** Called when the user dismisses the alert. */
  onDismiss: () => void;
}

/**
 * Alert card for ML-detected anomalies in carbon emissions. Shows how much
 * the actual value deviates from the expected baseline. Dismissible with
 * `role="alert"` for screen-reader announcement.
 *
 * @example
 * ```tsx
 * <AnomalyAlert
 *   category="energy"
 *   actualValue={45.2}
 *   expectedValue={28.0}
 *   date="2025-06-10"
 *   onDismiss={() => dismissAnomaly(id)}
 * />
 * ```
 */
export default function AnomalyAlert({
  category,
  actualValue,
  expectedValue,
  date,
  onDismiss,
}: AnomalyAlertProps) {
  const deviationPercent =
    expectedValue > 0
      ? Math.round(((actualValue - expectedValue) / expectedValue) * 100)
      : 0;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={styles.alert} role="alert">
      {/* Warning icon */}
      <svg
        className={styles.warningIcon}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 2L1 21h22L12 2z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M12 9v5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <circle cx="12" cy="17" r="0.75" fill="currentColor" />
      </svg>

      {/* Content */}
      <div className={styles.content}>
        <h3 className={styles.heading}>Unusual activity detected</h3>
        <p className={styles.category}>{category}</p>

        <div className={styles.details}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Actual</span>
            <span className={styles.detailValue}>
              {actualValue.toFixed(1)} kg
            </span>
          </div>

          <div className={styles.separator} aria-hidden="true" />

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Expected</span>
            <span className={styles.detailValue}>
              {expectedValue.toFixed(1)} kg
            </span>
          </div>

          <div className={styles.separator} aria-hidden="true" />

          <span className={styles.deviation}>
            <span className={styles.deviationArrow} aria-hidden="true">
              ▲
            </span>
            {deviationPercent}% higher
          </span>
        </div>

        <p className={styles.date}>{formattedDate}</p>
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        className={styles.dismissButton}
        onClick={onDismiss}
        aria-label={`Dismiss anomaly alert for ${category}`}
      >
        <svg
          className={styles.dismissIcon}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 4L4 12M4 4l8 8" />
        </svg>
      </button>
    </div>
  );
}
