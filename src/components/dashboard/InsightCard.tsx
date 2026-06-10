import { type ReactNode } from 'react';
import styles from './InsightCard.module.css';

/** Emission categories. */
type InsightCategory = 'transport' | 'energy' | 'food' | 'shopping';

/** Props for the {@link InsightCard} component. */
interface InsightCardProps {
  /** Insight title. */
  title: string;
  /** Full description of the recommendation. */
  description: string;
  /** Impact summary, e.g. "Save 15 kg CO₂/month". */
  impact: string;
  /** Emission category, determines left border color and icon. */
  category: InsightCategory;
  /** AI model confidence score (0–1). When provided shows a badge. */
  confidence?: number;
}

/** Category-specific inline SVG icons. */
const CATEGORY_ICONS: Record<InsightCategory, ReactNode> = {
  transport: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14M6 9h12l1.5 4H4.5L6 9z" />
      <circle cx="7.5" cy="17" r="1.5" />
      <circle cx="16.5" cy="17" r="1.5" />
      <path d="M5 13h14" />
    </svg>
  ),
  energy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  food: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  ),
  shopping: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  ),
};

/**
 * Insight recommendation card with a colour-coded left border by category,
 * category icon, impact summary, and an optional AI confidence badge.
 *
 * @example
 * ```tsx
 * <InsightCard
 *   title="Switch to cycling for short trips"
 *   description="Trips under 5km could be replaced with cycling."
 *   impact="Save 15 kg CO₂/month"
 *   category="transport"
 *   confidence={0.87}
 * />
 * ```
 */
export default function InsightCard({
  title,
  description,
  impact,
  category,
  confidence,
}: InsightCardProps) {
  const confidencePercent =
    confidence !== undefined ? `${Math.round(confidence * 100)}%` : null;

  return (
    <article className={`${styles.card} ${styles[category]}`}>
      {/* Category icon */}
      <div className={styles.iconWrapper}>
        <span className={styles.iconInner}>{CATEGORY_ICONS[category]}</span>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          {confidencePercent && (
            <span className={styles.confidenceBadge} aria-label={`AI confidence: ${confidencePercent}`}>
              <svg
                className={styles.confidenceIcon}
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M6 3.5v3l2 1"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              AI {confidencePercent}
            </span>
          )}
        </div>

        <p className={styles.description}>{description}</p>

        <span className={styles.impact}>
          <svg
            className={styles.impactIcon}
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 1v10M1 6l5-5 5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {impact}
        </span>
      </div>
    </article>
  );
}
