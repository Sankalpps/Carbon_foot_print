import { db } from '@/lib/db';

/**
 * Create or update a carbon reduction goal.
 */
export async function createGoal(
  userId: string,
  data: {
    targetReduction: number;
    baselineCo2: number;
    startDate: Date;
    endDate: Date;
  }
) {
  return db.goal.create({
    data: {
      userId,
      targetReduction: data.targetReduction,
      baselineCo2: data.baselineCo2,
      startDate: data.startDate,
      endDate: data.endDate,
    },
  });
}

/**
 * Get the user's most recent active goal.
 */
export async function getActiveGoal(userId: string) {
  return db.goal.findFirst({
    where: {
      userId,
      endDate: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Calculate goal progress.
 */
export async function getGoalProgress(userId: string) {
  const goal = await getActiveGoal(userId);
  if (!goal) return null;

  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const nextMonth = new Date(currentMonth);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const activities = await db.activity.findMany({
    where: {
      userId,
      date: { gte: currentMonth, lt: nextMonth },
    },
  });

  const currentMonthTotal = activities.reduce((sum, a) => sum + a.co2Amount, 0);
  const targetCo2 = goal.baselineCo2 * (1 - goal.targetReduction / 100);
  const progress = Math.min(100, Math.round(((goal.baselineCo2 - currentMonthTotal) / (goal.baselineCo2 - targetCo2)) * 100));

  return {
    goal,
    currentMonthTotal: Math.round(currentMonthTotal * 100) / 100,
    targetCo2: Math.round(targetCo2 * 100) / 100,
    progress: Math.max(0, progress),
    isOnTrack: currentMonthTotal <= targetCo2,
  };
}
