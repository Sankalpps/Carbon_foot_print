import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getActivityStats, getMonthlyBreakdown, getActivities } from '@/lib/dal/activities';
import { getGoalProgress } from '@/lib/dal/goals';
import { getCategoryBreakdown } from '@/lib/carbon/calculator';
import StatCard from '@/components/dashboard/StatCard';
import TrendChart from '@/components/charts/TrendChart';
import CategoryChart from '@/components/charts/CategoryChart';
import ProgressRing from '@/components/charts/ProgressRing';
import ActivityTable from '@/components/dashboard/ActivityTable';
import Card from '@/components/ui/Card';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;

  // 1. Fetch current month's activities and stats
  const currentMonthStats = await getActivityStats(userId, 'month');

  // 2. Fetch last month's stats for comparison
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  const lastMonthActivities = await db.activity.findMany({
    where: {
      userId,
      date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
    },
  });
  
  const lastMonthCO2 = lastMonthActivities.reduce((sum, a) => sum + a.co2Amount, 0);

  // Calculate percentage difference vs last month
  let trendDirection: 'up' | 'down' | 'neutral' = 'neutral';
  let trendValString = '0%';
  if (lastMonthCO2 > 0) {
    const pctDiff = ((currentMonthStats.totalCO2 - lastMonthCO2) / lastMonthCO2) * 100;
    trendDirection = pctDiff > 1 ? 'up' : pctDiff < -1 ? 'down' : 'neutral';
    trendValString = `${Math.abs(Math.round(pctDiff))}%`;
  } else if (currentMonthStats.totalCO2 > 0) {
    trendDirection = 'up';
    trendValString = 'New';
  }

  // 3. Fetch carbon goals & progress
  const goalProgress = await getGoalProgress(userId);

  // 4. Fetch 6 months historical breakdown
  const monthlyTrends = await getMonthlyBreakdown(userId, 6);

  // 5. Fetch recent 5 activities
  const recentActivities = await getActivities(userId, { limit: 5 });

  // 6. Category breakdown for current month
  const categoryBreakdown = getCategoryBreakdown(currentMonthStats.activities);

  // Format data for CategoryChart
  const categoryChartData = {
    labels: categoryBreakdown.map((c) => c.label),
    values: categoryBreakdown.map((c) => c.total),
    colors: categoryBreakdown.map((c) => c.color),
  };

  // Format data for TrendChart
  const trendChartData = {
    labels: monthlyTrends.labels,
    datasets: [
      {
        label: 'Emissions',
        data: monthlyTrends.data,
      },
    ],
  };

  return (
    <div className={styles.container}>
      {/* Page Heading */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard Overview</h1>
          <p className={styles.subtitle}>Welcome back, {session.user.name ?? 'User'}! Here is your sustainability summary.</p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Total CO₂"
          value={String(currentMonthStats.totalCO2)}
          unit="kg"
          trend={{ direction: trendDirection, value: trendValString }}
          color={trendDirection === 'down' ? 'green' : trendDirection === 'up' ? 'red' : 'blue'}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          }
        />
        <StatCard
          title="Activities Logged"
          value={String(currentMonthStats.totalActivities)}
          unit="entries"
          color="blue"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          }
        />
        <StatCard
          title="Goal Progress"
          value={String(goalProgress ? goalProgress.progress : 0)}
          unit="%"
          color="green"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StatCard
          title="Daily Average"
          value={String(Math.round((currentMonthStats.totalCO2 / 30) * 10) / 10)}
          unit="kg/day"
          color="amber"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 12M12 8v4l3 3" />
            </svg>
          }
        />
      </div>

      {/* Interactive Charts Section */}
      <div className={styles.chartsGrid}>
        {/* Line Chart */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Monthly Emission Trend</h2>
          <TrendChart data={trendChartData} period="6months" />
        </div>

        {/* Doughnut Chart */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Emissions by Category</h2>
          {categoryChartData.values.length > 0 ? (
            <CategoryChart data={categoryChartData} />
          ) : (
            <div className={styles.emptyChart}>
              <p>Log some activities to see your category breakdown.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Goal Details and Recent Activities */}
      <div className={styles.detailsGrid}>
        {/* Goal Card */}
        <Card variant="glass" className={styles.goalCard}>
          <h2 className={styles.cardTitle}>Current Carbon Goal</h2>
          {goalProgress ? (
            <div className={styles.goalContent}>
              <ProgressRing
                progress={goalProgress.progress}
                size={140}
                label={`${goalProgress.progress}%`}
                sublabel="completed"
              />
              <div className={styles.goalText}>
                <p className={styles.goalStatus}>
                  You are <span className={goalProgress.isOnTrack ? styles.trackOn : styles.trackOff}>
                    {goalProgress.isOnTrack ? 'On Track' : 'Off Track'}
                  </span>
                </p>
                <p className={styles.goalTarget}>
                  Target: <strong>{goalProgress.targetCo2} kg CO₂</strong> this month
                  (a <strong>{goalProgress.goal.targetReduction}%</strong> reduction from your baseline of{' '}
                  {goalProgress.goal.baselineCo2} kg)
                </p>
              </div>
            </div>
          ) : (
            <div className={styles.emptyGoal}>
              <p>No active goal found.</p>
              <a href="/dashboard/goals" className={styles.goalLink}>
                Set a Reduction Goal →
              </a>
            </div>
          )}
        </Card>

        {/* Recent Activities */}
        <div className={styles.tableCard}>
          <ActivityTable activities={recentActivities} />
        </div>
      </div>
    </div>
  );
}
