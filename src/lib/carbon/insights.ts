import { getCategoryBreakdown, getSubCategoryTotals, GLOBAL_MONTHLY_AVERAGE_KG, getEquivalents } from './calculator';
import type { Category } from '@/lib/validations';
import { CATEGORY_META } from './emission-factors';

interface Activity {
  id: string;
  category: string;
  subCategory: string;
  co2Amount: number;
  date: Date;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  impact: string;
  category: Category;
  confidence: number;
  priority: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  progress: number;
}

/**
 * Generate personalized insights based on user's activity data.
 */
export function generateInsights(activities: Activity[]): Insight[] {
  if (activities.length === 0) return [];

  const breakdown = getCategoryBreakdown(activities);
  const subTotals = getSubCategoryTotals(activities);
  const insights: Insight[] = [];

  // Find highest-impact category
  if (breakdown.length > 0) {
    const highest = breakdown[0];
    const cat = highest.category as Category;
    const tips = CATEGORY_TIPS[cat];

    if (tips) {
      tips.forEach((tip, i) => {
        insights.push({
          id: `${cat}-tip-${i}`,
          title: tip.title,
          description: tip.description,
          impact: tip.impact,
          category: cat,
          confidence: 0.85,
          priority: breakdown.length - i,
        });
      });
    }
  }

  // Add sub-category specific insights
  if (subTotals.length > 0) {
    const topSub = subTotals[0];
    if (topSub.subCategory === 'beef') {
      insights.push({
        id: 'food-beef-switch',
        title: 'Switch from beef to poultry',
        description: `Beef is your highest food emission source at ${topSub.total.toFixed(1)} kg CO₂. Switching just 2 meals per week to poultry could cut food emissions by ~60%.`,
        impact: `Save ~${Math.round(topSub.total * 0.6)} kg CO₂`,
        category: 'food',
        confidence: 0.92,
        priority: 10,
      });
    }
    if (topSub.subCategory === 'car_petrol') {
      insights.push({
        id: 'transport-car-bus',
        title: 'Try public transport for commuting',
        description: `Your car emissions total ${topSub.total.toFixed(1)} kg CO₂. Taking the bus for even half your trips could save significant emissions.`,
        impact: `Save ~${Math.round(topSub.total * 0.4)} kg CO₂`,
        category: 'transport',
        confidence: 0.88,
        priority: 9,
      });
    }
  }

  return insights.sort((a, b) => b.priority - a.priority).slice(0, 6);
}

/**
 * Compare user's CO₂ to global average.
 */
export function getComparison(
  userMonthlyKg: number
): { vsGlobal: number; percentile: string; status: 'excellent' | 'good' | 'average' | 'high' } {
  const vsGlobal = Math.round(((userMonthlyKg - GLOBAL_MONTHLY_AVERAGE_KG) / GLOBAL_MONTHLY_AVERAGE_KG) * 100);

  let percentile: string;
  let status: 'excellent' | 'good' | 'average' | 'high';

  if (userMonthlyKg < GLOBAL_MONTHLY_AVERAGE_KG * 0.5) {
    percentile = 'Top 10%';
    status = 'excellent';
  } else if (userMonthlyKg < GLOBAL_MONTHLY_AVERAGE_KG * 0.8) {
    percentile = 'Top 30%';
    status = 'good';
  } else if (userMonthlyKg < GLOBAL_MONTHLY_AVERAGE_KG * 1.2) {
    percentile = 'Average';
    status = 'average';
  } else {
    percentile = 'Above Average';
    status = 'high';
  }

  return { vsGlobal, percentile, status };
}

/**
 * Analyze trends over time.
 */
export function getTrendAnalysis(activities: Activity[]): {
  weekOverWeek: number;
  monthOverMonth: number;
  direction: 'improving' | 'steady' | 'worsening';
} {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const thisWeek = activities.filter((a) => a.date >= oneWeekAgo).reduce((s, a) => s + a.co2Amount, 0);
  const lastWeek = activities.filter((a) => a.date >= twoWeeksAgo && a.date < oneWeekAgo).reduce((s, a) => s + a.co2Amount, 0);
  const thisMonth = activities.filter((a) => a.date >= oneMonthAgo).reduce((s, a) => s + a.co2Amount, 0);
  const lastMonth = activities.filter((a) => a.date >= twoMonthsAgo && a.date < oneMonthAgo).reduce((s, a) => s + a.co2Amount, 0);

  const weekOverWeek = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;
  const monthOverMonth = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

  let direction: 'improving' | 'steady' | 'worsening';
  if (monthOverMonth < -5) direction = 'improving';
  else if (monthOverMonth > 5) direction = 'worsening';
  else direction = 'steady';

  return { weekOverWeek, monthOverMonth, direction };
}

/**
 * Calculate gamification achievements.
 */
export function getAchievements(activities: Activity[]): Achievement[] {
  const totalActivities = activities.length;
  const totalCO2 = activities.reduce((s, a) => s + a.co2Amount, 0);
  const uniqueDays = new Set(activities.map((a) => a.date.toISOString().split('T')[0])).size;
  const categories = new Set(activities.map((a) => a.category)).size;

  return [
    {
      id: 'first-log',
      title: 'First Step',
      description: 'Log your first activity',
      icon: '🌱',
      earned: totalActivities >= 1,
      progress: Math.min(totalActivities, 1),
    },
    {
      id: 'week-streak',
      title: 'Week Warrior',
      description: 'Log activities for 7 different days',
      icon: '🔥',
      earned: uniqueDays >= 7,
      progress: Math.min(uniqueDays / 7, 1),
    },
    {
      id: 'category-explorer',
      title: 'Full Picture',
      description: 'Track all 4 emission categories',
      icon: '🗺️',
      earned: categories >= 4,
      progress: categories / 4,
    },
    {
      id: 'data-champion',
      title: 'Data Champion',
      description: 'Log 50 activities',
      icon: '📊',
      earned: totalActivities >= 50,
      progress: Math.min(totalActivities / 50, 1),
    },
    {
      id: 'low-carbon',
      title: 'Low Carbon Hero',
      description: 'Keep monthly emissions under 200 kg CO₂',
      icon: '🌍',
      earned: totalCO2 < 200 && totalActivities > 10,
      progress: totalCO2 < 200 ? 1 : Math.max(0, 1 - (totalCO2 - 200) / 200),
    },
    {
      id: 'cyclist',
      title: 'Pedal Power',
      description: 'Log 10 bicycle trips',
      icon: '🚲',
      earned: activities.filter((a) => a.subCategory === 'bicycle').length >= 10,
      progress: Math.min(activities.filter((a) => a.subCategory === 'bicycle').length / 10, 1),
    },
  ];
}

/**
 * Suggest best times for energy use based on grid forecast.
 */
export function getSmartScheduling(
  forecast: { time: string; intensity: number }[]
): { bestTimes: { time: string; intensity: number }[]; worstTimes: { time: string; intensity: number }[] } {
  const sorted = [...forecast].sort((a, b) => a.intensity - b.intensity);
  return {
    bestTimes: sorted.slice(0, 3),
    worstTimes: sorted.slice(-3).reverse(),
  };
}

/** Category-specific reduction tips */
const CATEGORY_TIPS: Record<Category, { title: string; description: string; impact: string }[]> = {
  transport: [
    { title: 'Switch to public transport', description: 'Taking the bus instead of driving can cut your transport emissions by up to 60%.', impact: 'Save ~50 kg CO₂/month' },
    { title: 'Consider carpooling', description: 'Sharing rides with colleagues reduces per-person emissions by half.', impact: 'Save ~30 kg CO₂/month' },
    { title: 'Try cycling for short trips', description: 'Trips under 5km are perfect for cycling — zero emissions!', impact: 'Save ~10 kg CO₂/month' },
  ],
  energy: [
    { title: 'Switch to LED lighting', description: 'LEDs use 75% less energy than incandescent bulbs.', impact: 'Save ~40 kg CO₂/year' },
    { title: 'Lower thermostat by 1°C', description: 'Reducing heating temperature by just 1°C saves significant energy.', impact: 'Save ~300 kg CO₂/year' },
    { title: 'Use appliances during low-carbon hours', description: 'Check the Live Grid page for the best time to run high-energy appliances.', impact: 'Save ~15% of energy emissions' },
  ],
  food: [
    { title: 'Reduce beef consumption', description: 'Beef has the highest carbon footprint of any food. Try plant-based alternatives.', impact: 'Save ~100 kg CO₂/month' },
    { title: 'Buy seasonal produce', description: 'Out-of-season produce often requires energy-intensive greenhouses or air freight.', impact: 'Save ~20 kg CO₂/month' },
    { title: 'Reduce food waste', description: 'About 30% of food is wasted. Planning meals and proper storage helps enormously.', impact: 'Save ~50 kg CO₂/month' },
  ],
  shopping: [
    { title: 'Buy second-hand', description: 'Pre-owned clothing and electronics avoid manufacturing emissions entirely.', impact: 'Save ~20-50 kg CO₂/item' },
    { title: 'Repair instead of replace', description: 'Extending the life of electronics by even one year saves significant resources.', impact: 'Save ~70 kg CO₂/device' },
    { title: 'Choose sustainable brands', description: 'Look for brands with verified carbon reduction programs.', impact: 'Varies by product' },
  ],
};
