import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getActivities, getActivityStats } from '@/lib/dal/activities';
import { generateInsights, getComparison, getAchievements } from '@/lib/carbon/insights';
import InsightCard from '@/components/dashboard/InsightCard';
import Card from '@/components/ui/Card';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function InsightsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;

  // Fetch all user activities
  const allActivities = await getActivities(userId, { limit: 1000 });
  const monthlyStats = await getActivityStats(userId, 'month');

  // Generate recommendations
  const insights = generateInsights(allActivities);

  // Get comparisons
  const comparison = getComparison(monthlyStats.totalCO2);

  // Get achievements/badges
  const achievements = getAchievements(allActivities);

  const globalAvg = 392; // kg/month

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Personalized Insights</h1>
        <p className={styles.subtitle}>
          AI-driven recommendations and targets to help you reduce your environmental footprint.
        </p>
      </div>

      {/* Recommendations Grid */}
      <section className={styles.section} aria-labelledby="recs-title">
        <h2 id="recs-title" className={styles.sectionTitle}>
          Tailored Recommendations
        </h2>
        {insights.length > 0 ? (
          <div className={styles.insightsGrid}>
            {insights.map((insight) => (
              <InsightCard
                key={insight.id}
                title={insight.title}
                description={insight.description}
                impact={insight.impact}
                category={insight.category}
                confidence={insight.confidence}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyInsights}>
            <p>Log more activities to generate personalized carbon-reduction tips.</p>
          </div>
        )}
      </section>

      {/* Comparisons and Achievements */}
      <div className={styles.detailsGrid}>
        {/* Comparison card */}
        <Card variant="glass" className={styles.compareCard}>
          <h2 className={styles.cardTitle}>Global Footprint Comparison</h2>
          <div className={styles.compareContent}>
            <div className={styles.metrics}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Your Monthly Average</span>
                <span className={styles.metricVal}>{monthlyStats.totalCO2} kg</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Global Target (Sustainable)</span>
                <span className={styles.metricVal}>150 kg</span>
              </div>
            </div>

            {/* Visual comparison bar */}
            <div className={styles.comparisonVisual}>
              <div className={styles.barGroup}>
                <div className={styles.barLabel}>You</div>
                <div className={styles.barWrapper}>
                  <div
                    className={`${styles.bar} ${styles.userBar}`}
                    style={{ width: `${Math.min(100, (monthlyStats.totalCO2 / globalAvg) * 100)}%` }}
                  />
                </div>
                <div className={styles.barValue}>{monthlyStats.totalCO2} kg</div>
              </div>

              <div className={styles.barGroup}>
                <div className={styles.barLabel}>Global Avg</div>
                <div className={styles.barWrapper}>
                  <div
                    className={`${styles.bar} ${styles.avgBar}`}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className={styles.barValue}>{globalAvg} kg</div>
              </div>
            </div>

            <p className={styles.compareDescription}>
              Your monthly carbon emissions are{' '}
              <strong className={comparison.vsGlobal > 0 ? styles.highColor : styles.lowColor}>
                {Math.abs(comparison.vsGlobal)}% {comparison.vsGlobal > 0 ? 'higher' : 'lower'}
              </strong>{' '}
              than the global average. You rank in the <strong>{comparison.percentile}</strong> group.
            </p>
          </div>
        </Card>

        {/* Gamification/Achievements card */}
        <Card variant="glass" className={styles.badgeCard}>
          <h2 className={styles.cardTitle}>Achievements & Badges</h2>
          <div className={styles.badgesGrid}>
            {achievements.map((badge) => {
              const pct = Math.round(badge.progress * 100);
              return (
                <div
                  key={badge.id}
                  className={`${styles.badgeItem} ${badge.earned ? styles.badgeEarned : ''}`}
                  title={`${badge.title}: ${badge.description}`}
                >
                  <div className={styles.badgeIcon} aria-hidden="true">
                    {badge.icon}
                  </div>
                  <div className={styles.badgeText}>
                    <h3 className={styles.badgeTitle}>{badge.title}</h3>
                    <p className={styles.badgeDesc}>{badge.description}</p>
                    <div className={styles.progressWrapper}>
                      <div
                        className={styles.progressBar}
                        style={{ width: `${pct}%` }}
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${badge.title} progress`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
