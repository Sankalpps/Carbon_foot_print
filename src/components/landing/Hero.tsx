import Link from 'next/link';
import styles from './Hero.module.css';

/**
 * Landing page hero section with an animated gradient background, floating
 * decorative blobs, a headline with gradient accent, subtitle, and two
 * CTA buttons (Get Started → /register, Learn More → #features scroll).
 *
 * This is a Server Component — no client-side hooks needed.
 *
 * @example
 * ```tsx
 * <Hero />
 * ```
 */
export default function Hero() {
  return (
    <section className={styles.hero}>
      {/* Animated gradient background */}
      <div className={styles.background} aria-hidden="true" />

      {/* Floating decorative blobs */}
      <div className={`${styles.blob} ${styles.blob1}`} aria-hidden="true" />
      <div className={`${styles.blob} ${styles.blob2}`} aria-hidden="true" />
      <div className={`${styles.blob} ${styles.blob3}`} aria-hidden="true" />

      {/* Content */}
      <div className={styles.content}>
        <h1 className={styles.headline}>
          Track Your{' '}
          <span className={styles.headlineAccent}>Carbon Footprint</span>{' '}
          with AI
        </h1>

        <p className={styles.subtitle}>
          ML-powered predictions, real-time grid data, and personalized insights
          to help you reduce your environmental impact.
        </p>

        <div className={styles.actions}>
          <Link href="/register" className={styles.primaryCta}>
            Get Started
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>

          <a href="#features" className={styles.ghostCta}>
            Learn More
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
