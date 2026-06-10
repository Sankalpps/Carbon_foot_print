import { db } from '@/lib/db';
import { calculateCO2 } from '@/lib/carbon/calculator';
import { getUnit } from '@/lib/carbon/emission-factors';
import type { ActivityInput } from '@/lib/validations';

/**
 * Create a new activity with CO₂ calculation.
 */
export async function createActivity(userId: string, data: ActivityInput, gridIntensity?: number) {
  const co2Amount = calculateCO2(data.subCategory, data.amount);
  const unit = getUnit(data.subCategory);

  return db.activity.create({
    data: {
      userId,
      category: data.category,
      subCategory: data.subCategory,
      amount: data.amount,
      unit,
      co2Amount,
      gridIntensity: gridIntensity ?? null,
      date: data.date,
      notes: data.notes || null,
    },
  });
}

/**
 * Get activities for a user with optional filters.
 */
export async function getActivities(
  userId: string,
  options?: {
    category?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
    orderBy?: 'date' | 'co2Amount';
    order?: 'asc' | 'desc';
  }
) {
  const where: Record<string, unknown> = { userId };

  if (options?.category) {
    where.category = options.category;
  }

  if (options?.startDate || options?.endDate) {
    where.date = {};
    if (options?.startDate) (where.date as Record<string, Date>).gte = options.startDate;
    if (options?.endDate) (where.date as Record<string, Date>).lte = options.endDate;
  }

  return db.activity.findMany({
    where,
    orderBy: { [options?.orderBy ?? 'date']: options?.order ?? 'desc' },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
  });
}

/**
 * Get aggregated activity stats for a user.
 */
export async function getActivityStats(
  userId: string,
  period: 'week' | 'month' | '6months' | 'year' = 'month'
) {
  const now = new Date();
  const periodMap = {
    week: 7,
    month: 30,
    '6months': 180,
    year: 365,
  };
  const startDate = new Date(now.getTime() - periodMap[period] * 24 * 60 * 60 * 1000);

  const activities = await db.activity.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
    orderBy: { date: 'asc' },
  });

  const totalCO2 = activities.reduce((sum, a) => sum + a.co2Amount, 0);
  const totalActivities = activities.length;

  return {
    totalCO2: Math.round(totalCO2 * 100) / 100,
    totalActivities,
    activities,
    startDate,
    endDate: now,
  };
}

/**
 * Get monthly CO₂ breakdown for charting.
 */
export async function getMonthlyBreakdown(userId: string, months: number = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const activities = await db.activity.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
    orderBy: { date: 'asc' },
  });

  // Group by month
  const monthlyData: Record<string, number> = {};
  for (const activity of activities) {
    const monthKey = activity.date.toISOString().slice(0, 7); // YYYY-MM
    monthlyData[monthKey] = (monthlyData[monthKey] ?? 0) + activity.co2Amount;
  }

  // Fill in missing months
  const labels: string[] = [];
  const data: number[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    labels.push(label);
    data.push(Math.round((monthlyData[key] ?? 0) * 100) / 100);
  }

  return { labels, data };
}

/**
 * Delete an activity (with ownership check).
 */
export async function deleteActivity(userId: string, activityId: string) {
  const activity = await db.activity.findUnique({
    where: { id: activityId },
  });

  if (!activity || activity.userId !== userId) {
    throw new Error('Activity not found or unauthorized');
  }

  return db.activity.delete({
    where: { id: activityId },
  });
}

/**
 * Get activity count for a user.
 */
export async function getActivityCount(userId: string) {
  return db.activity.count({ where: { userId } });
}
