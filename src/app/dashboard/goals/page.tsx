import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getGoalProgress } from '@/lib/dal/goals';
import ProgressRing from '@/components/charts/ProgressRing';
import Card from '@/components/ui/Card';
import GoalForm from './GoalForm';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function GoalsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const goalProgress = await getGoalProgress(session.user.id);

  // Milestones list calculated from progress levels
  const milestones = [
    { level: 10, title: 'Carbon Scout', desc: 'Achieved 10% of monthly reduction goal', achieved: goalProgress ? goalProgress.progress >= 10 : false },
    { level: 25, title: 'Eco Apprentice', desc: 'Achieved 25% of monthly reduction goal', achieved: goalProgress ? goalProgress.progress >= 25 : false },
    { level: 50, title: 'Green Guardian', desc: 'Achieved 50% of monthly reduction goal', achieved: goalProgress ? goalProgress.progress >= 50 : false },
    { level: 75, title: 'Sustainability Champion', desc: 'Achieved 75% of monthly reduction goal', achieved: goalProgress ? goalProgress.progress >= 75 : false },
    { level: 100, title: 'Net-Zero Hero', desc: 'Completely met or exceeded reduction goal!', achieved: goalProgress ? goalProgress.progress >= 100 : false },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Carbon Reduction Goals</h1>
        <p className={styles.subtitle}>
          Set ambitious reduction targets, track your progress, and earn milestones along the way.
        </p>
      </div>

      <div className={styles.layout}>
        {/* Left Side: Current active Goal and Milestones */}
        <div className={styles.mainContent}>
          {goalProgress ? (
            <Card variant="glass" className={styles.currentGoalCard}>
              <h2 className={styles.cardTitle}>Active Reduction Goal</h2>
              <div className={styles.goalInfo}>
                <ProgressRing
                  progress={goalProgress.progress}
                  size={160}
                  label={`${goalProgress.progress}%`}
                  sublabel="reduction met"
                />
                
                <div className={styles.goalDetails}>
                  <p className={styles.statusText}>
                    Status:{' '}
                    <span className={goalProgress.isOnTrack ? styles.trackOn : styles.trackOff}>
                      {goalProgress.isOnTrack ? 'On Track' : 'Off Track'}
                    </span>
                  </p>
                  <ul className={styles.detailsList}>
                    <li>
                      <strong>Target CO₂:</strong> {goalProgress.targetCo2} kg/month
                    </li>
                    <li>
                      <strong>Current Emissions:</strong> {goalProgress.currentMonthTotal} kg
                    </li>
                    <li>
                      <strong>Baseline average:</strong> {goalProgress.goal.baselineCo2} kg/month
                    </li>
                    <li>
                      <strong>Reduction Target:</strong> {goalProgress.goal.targetReduction}%
                    </li>
                    <li>
                      <strong>Goal Period:</strong>{' '}
                      {new Date(goalProgress.goal.startDate).toLocaleDateString()} to{' '}
                      {new Date(goalProgress.goal.endDate).toLocaleDateString()}
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          ) : (
            <Card variant="glass" className={styles.emptyGoalCard}>
              <div className={styles.emptyIcon}>🎯</div>
              <h2>No Active Target Set</h2>
              <p>Shrinking your carbon footprint starts with a plan. Set a reduction goal to start tracking progress.</p>
            </Card>
          )}

          {/* Milestones Card */}
          <Card variant="glass" className={styles.milestonesCard}>
            <h2 className={styles.cardTitle}>Goal Milestones</h2>
            <div className={styles.milestoneList}>
              {milestones.map((m) => (
                <div
                  key={m.level}
                  className={`${styles.milestoneItem} ${m.achieved ? styles.milestoneAchieved : ''}`}
                >
                  <div className={styles.checkbox} aria-hidden="true">
                    {m.achieved ? '✓' : ''}
                  </div>
                  <div className={styles.milestoneInfo}>
                    <h3 className={styles.milestoneTitle}>{m.title}</h3>
                    <p className={styles.milestoneDesc}>{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Side: Goal Creation Form */}
        <div className={styles.sidebar}>
          <GoalForm />
        </div>
      </div>
    </div>
  );
}
