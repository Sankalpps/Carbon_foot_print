import { getEmissionFactor, EMISSION_FACTORS, CATEGORY_META } from './emission-factors';
import type { Category } from '@/lib/validations';

/**
 * Calculate CO₂ emissions for an activity.
 * @param subCategory - The sub-category of the activity
 * @param amount - The quantity of the activity
 * @returns CO₂ in kg, or 0 if sub-category is unknown
 */
export function calculateCO2(subCategory: string, amount: number): number {
  const factor = getEmissionFactor(subCategory);
  if (!factor) return 0;
  return Math.round(factor.factor * amount * 1000) / 1000;
}

/**
 * Calculate CO₂ using real-time grid intensity for electricity.
 * @param amount - kWh of electricity used
 * @param gridIntensity - Current grid intensity in gCO₂/kWh
 * @returns CO₂ in kg
 */
export function calculateWithRealTimeGrid(amount: number, gridIntensity: number): number {
  // gridIntensity is in gCO₂/kWh, convert to kgCO₂/kWh
  return Math.round((amount * gridIntensity / 1000) * 1000) / 1000;
}

/**
 * Get real-world equivalents for a CO₂ amount.
 */
export function getEquivalents(co2Kg: number): {
  trees: number;
  driving: number;
  flights: string;
  smartphones: number;
} {
  return {
    /** Number of tree-years needed to absorb this CO₂ */
    trees: Math.round(co2Kg / 22 * 10) / 10,
    /** Equivalent km of driving a petrol car */
    driving: Math.round(co2Kg / 0.21),
    /** Equivalent flights (London to Paris = ~120kg CO₂) */
    flights: (co2Kg / 120).toFixed(1),
    /** Equivalent smartphone charges (~8g CO₂ per charge) */
    smartphones: Math.round(co2Kg / 0.008),
  };
}

/**
 * Get CO₂ breakdown by category.
 */
export function getCategoryBreakdown(
  activities: { category: string; co2Amount: number }[]
): { category: string; label: string; icon: string; color: string; total: number; percentage: number }[] {
  const totals: Record<string, number> = {};
  
  for (const activity of activities) {
    totals[activity.category] = (totals[activity.category] ?? 0) + activity.co2Amount;
  }

  const grandTotal = Object.values(totals).reduce((sum, val) => sum + val, 0);

  return Object.entries(totals)
    .map(([category, total]) => {
      const meta = CATEGORY_META[category as Category] ?? { label: category, icon: '📊', color: '#888' };
      return {
        category,
        label: meta.label,
        icon: meta.icon,
        color: meta.color,
        total: Math.round(total * 100) / 100,
        percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

/**
 * Get the monthly average CO₂ for global context.
 * World average: ~4.7 tonnes/year per person = ~392 kg/month
 */
export const GLOBAL_MONTHLY_AVERAGE_KG = 392;

/**
 * Calculate sub-category totals from activities.
 */
export function getSubCategoryTotals(
  activities: { subCategory: string; co2Amount: number }[]
): { subCategory: string; displayName: string; total: number; icon: string }[] {
  const totals: Record<string, number> = {};

  for (const activity of activities) {
    totals[activity.subCategory] = (totals[activity.subCategory] ?? 0) + activity.co2Amount;
  }

  return Object.entries(totals)
    .map(([subCategory, total]) => {
      const factor = getEmissionFactor(subCategory);
      return {
        subCategory,
        displayName: factor?.displayName ?? subCategory,
        total: Math.round(total * 100) / 100,
        icon: factor?.icon ?? '📊',
      };
    })
    .sort((a, b) => b.total - a.total);
}

/**
 * Get all available emission factor categories and sub-categories for display.
 */
export function getAllCategories(): {
  category: Category;
  label: string;
  icon: string;
  color: string;
  subCategories: { value: string; label: string; icon: string; unit: string; factor: number }[];
}[] {
  const categories = Object.entries(CATEGORY_META) as [Category, { label: string; icon: string; color: string }][];

  return categories.map(([category, meta]) => ({
    category,
    ...meta,
    subCategories: EMISSION_FACTORS.filter((ef) => ef.category === category).map((ef) => ({
      value: ef.subCategory,
      label: ef.displayName,
      icon: ef.icon,
      unit: ef.unit,
      factor: ef.factor,
    })),
  }));
}
