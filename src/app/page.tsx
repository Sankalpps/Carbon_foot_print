import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.css';

/**
 * Landing page metadata for SEO.
 */
export const metadata: Metadata = {
  title: 'CarbonWise - AI-Powered Carbon Footprint Tracker',
  description:
    'Track, analyze, and reduce your carbon footprint with AI-powered insights, real-time energy data, and personalized recommendations.',
};

/**
 * Feature item definition for the features grid.
 */
interface FeatureItem {
  icon: string;
  colorClass: string;
  title: string;
  description: string;
}

/** Features data displayed on the landing page. */
const features: FeatureItem[] = [
  {
    icon: '📊',
    colorClass: 'featureIconGreen',
    title: 'Smart Tracking',
    description:
      'Log your daily activities and automatically calculate your carbon emissions across transport, energy, food, and shopping categories.',
  },
  {
    icon: '🤖',
    colorClass: 'featureIconBlue',
    title: 'AI Predictions',
    description:
      'Machine learning models analyze your patterns to predict future emissions and identify anomalies before they become habits.',
  },
  {
    icon: '⚡',
    colorClass: 'featureIconYellow',
    title: 'Real-Time Grid Data',
    description:
      'Live carbon intensity data shows you the best times to use electricity, helping you make greener energy choices.',
  },
  {
    icon: '🎯',
    colorClass: 'featureIconRed',
    title: 'Goals & Insights',
    description:
      'Set reduction targets, earn achievement badges, and get personalized recommendations to shrink your carbon footprint.',
  },
];

/** Stats displayed in the social proof bar. */
const stats = [
  { value: '10K+', label: 'Active Users' },
  { value: '2.5M', label: 'kg CO₂ Tracked' },
  { value: '18%', label: 'Avg Reduction' },
  { value: '4.9★', label: 'User Rating' },
];

/**
 * Landing page component.
 * Displays the hero section, features grid, stats bar, and footer.
 * This is a Server Component — no client-side JavaScript is shipped.
 */
export default function LandingPage() {
  return (
    <main id="main-content" className={styles.landing}>
      {/* --- Hero Section --- */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroBg} aria-hidden="true" />
        <div className={styles.heroContent}>
          <span className={styles.badge}>
            <span className={styles.badgeDot} aria-hidden="true" />
            AI-Powered Sustainability
          </span>

          <h1 id="hero-title" className={styles.heroTitle}>
            Track Your{' '}
            <span className={styles.heroHighlight}>Carbon Footprint</span>
            <br />
            With Intelligence
          </h1>

          <p className={styles.heroDescription}>
            CarbonWise uses machine learning to analyze your habits, predict
            your emissions, and guide you toward a more sustainable lifestyle —
            all in real time.
          </p>

          <div className={styles.heroCta}>
            <Link href="/register" className={styles.ctaPrimary}>
              Get Started Free
              <span className={styles.ctaArrow} aria-hidden="true">
                →
              </span>
            </Link>
            <Link href="/login" className={styles.ctaSecondary}>
              Sign In
              <span className={styles.ctaArrow} aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* --- Features Section --- */}
      <section className={styles.features} aria-labelledby="features-title">
        <div className={styles.featuresInner}>
          <header className={styles.featuresHeader}>
            <h2 id="features-title" className={styles.featuresTitle}>
              Everything You Need to Go Green
            </h2>
            <p className={styles.featuresSubtitle}>
              Powerful tools to understand, track, and reduce your environmental
              impact.
            </p>
          </header>

          <div className={styles.featuresGrid} role="list">
            {features.map((feature) => (
              <article
                key={feature.title}
                className={styles.featureCard}
                role="listitem"
              >
                <div
                  className={`${styles.featureIcon} ${styles[feature.colorClass]}`}
                  aria-hidden="true"
                >
                  {feature.icon}
                </div>
                <h3 className={styles.featureCardTitle}>{feature.title}</h3>
                <p className={styles.featureCardDescription}>
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* --- Stats Bar --- */}
      <section className={styles.statsBar} aria-label="Platform statistics">
        {stats.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </section>

      {/* --- Footer --- */}
      <footer className={styles.footer}>
        <p>
          &copy; {new Date().getFullYear()} CarbonWise. Built for a sustainable
          future.
        </p>
      </footer>
    </main>
  );
}
