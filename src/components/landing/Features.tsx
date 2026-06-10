'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import styles from './Features.module.css';

/* ─────────────── Feature data ─────────────── */

interface Feature {
  title: string;
  description: string;
  iconClass: string;
  icon: ReactNode;
}

const FEATURES: Feature[] = [
  {
    title: 'AI Predictions',
    description:
      'LSTM neural network forecasts your future emissions based on historical patterns, helping you plan and stay on target.',
    iconClass: styles.iconAI,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 014 4c0 1.95-1.4 3.57-3.25 3.92" />
        <path d="M8.75 9.92A4.001 4.001 0 0112 2" />
        <path d="M9 22h6" />
        <path d="M10 18h4" />
        <path d="M12 14v4" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Real-Time Grid Data',
    description:
      'Live carbon intensity from the electricity grid so you know the best time to use energy-intensive appliances.',
    iconClass: styles.iconGrid,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    title: 'Smart Insights',
    description:
      'Personalized recommendations based on your emission patterns, powered by data analysis and behavioural nudges.',
    iconClass: styles.iconInsights,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
  },
  {
    title: 'Track Everything',
    description:
      'Log transport, energy, food, and shopping emissions in one place. Get a complete picture of your carbon footprint.',
    iconClass: styles.iconTrack,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10" />
        <path d="M18 20V4" />
        <path d="M6 20v-4" />
      </svg>
    ),
  },
];

/* ────────────── Animated feature card ────────────── */

interface FeatureCardProps {
  feature: Feature;
  /** Stagger delay in ms for the entrance animation. */
  delay: number;
}

/**
 * A single feature card that animates in when it becomes visible in the
 * viewport via IntersectionObserver.
 */
function FeatureCard({ feature, delay }: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Stagger the animation by `delay` ms
          const timer = setTimeout(() => setVisible(true), delay);
          observer.unobserve(element);
          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [delay]);

  const cardClasses = [styles.card, visible ? styles.cardVisible : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={ref} className={cardClasses}>
      <div className={`${styles.iconWrapper} ${feature.iconClass}`}>
        <span className={styles.iconInner}>{feature.icon}</span>
      </div>
      <h3 className={styles.cardTitle}>{feature.title}</h3>
      <p className={styles.cardDescription}>{feature.description}</p>
    </div>
  );
}

/* ────────────── Features section ────────────── */

/**
 * Landing page features section with four glass-style cards in a 2×2 grid.
 * Each card animates in when scrolled into view using IntersectionObserver
 * with a staggered delay.
 *
 * @example
 * ```tsx
 * <Features />
 * ```
 */
export default function Features() {
  return (
    <section id="features" className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          Everything you need to go carbon-neutral
        </h2>
        <p className={styles.sectionSubtitle}>
          Powerful tools and intelligent insights to measure, understand, and
          reduce your environmental footprint.
        </p>
      </div>

      <div className={styles.grid}>
        {FEATURES.map((feature, index) => (
          <FeatureCard
            key={feature.title}
            feature={feature}
            delay={index * 120}
          />
        ))}
      </div>
    </section>
  );
}
