import type { Category } from '@/lib/validations';

/**
 * Emission factor entry with metadata.
 */
export interface EmissionFactor {
  /** Category of the activity */
  category: Category;
  /** Sub-category identifier */
  subCategory: string;
  /** Human-readable display name */
  displayName: string;
  /** kg CO₂e per unit */
  factor: number;
  /** Unit of measurement */
  unit: string;
  /** Emoji icon for display */
  icon: string;
}

/**
 * Comprehensive emission factors database.
 * Values are sourced from DEFRA, EPA, and Our World in Data.
 * All factors are in kg CO₂e per unit.
 */
export const EMISSION_FACTORS: EmissionFactor[] = [
  // Transport
  { category: 'transport', subCategory: 'car_petrol', displayName: 'Car (Petrol)', factor: 0.21, unit: 'km', icon: '🚗' },
  { category: 'transport', subCategory: 'car_diesel', displayName: 'Car (Diesel)', factor: 0.17, unit: 'km', icon: '🚙' },
  { category: 'transport', subCategory: 'car_electric', displayName: 'Car (Electric)', factor: 0.05, unit: 'km', icon: '⚡' },
  { category: 'transport', subCategory: 'bus', displayName: 'Bus', factor: 0.089, unit: 'km', icon: '🚌' },
  { category: 'transport', subCategory: 'train', displayName: 'Train', factor: 0.041, unit: 'km', icon: '🚆' },
  { category: 'transport', subCategory: 'domestic_flight', displayName: 'Domestic Flight', factor: 0.255, unit: 'km', icon: '✈️' },
  { category: 'transport', subCategory: 'international_flight', displayName: 'International Flight', factor: 0.195, unit: 'km', icon: '🌍' },
  { category: 'transport', subCategory: 'bicycle', displayName: 'Bicycle', factor: 0.0, unit: 'km', icon: '🚲' },

  // Energy
  { category: 'energy', subCategory: 'electricity', displayName: 'Electricity', factor: 0.42, unit: 'kWh', icon: '💡' },
  { category: 'energy', subCategory: 'natural_gas', displayName: 'Natural Gas', factor: 2.0, unit: 'm³', icon: '🔥' },
  { category: 'energy', subCategory: 'lpg', displayName: 'LPG', factor: 2.98, unit: 'kg', icon: '🛢️' },

  // Food
  { category: 'food', subCategory: 'beef', displayName: 'Beef', factor: 27.0, unit: 'kg', icon: '🥩' },
  { category: 'food', subCategory: 'poultry', displayName: 'Poultry', factor: 6.9, unit: 'kg', icon: '🍗' },
  { category: 'food', subCategory: 'fish', displayName: 'Fish', factor: 6.1, unit: 'kg', icon: '🐟' },
  { category: 'food', subCategory: 'dairy', displayName: 'Dairy', factor: 3.2, unit: 'kg', icon: '🧀' },
  { category: 'food', subCategory: 'vegetables', displayName: 'Vegetables', factor: 2.0, unit: 'kg', icon: '🥦' },
  { category: 'food', subCategory: 'fruits', displayName: 'Fruits', factor: 1.1, unit: 'kg', icon: '🍎' },
  { category: 'food', subCategory: 'grains', displayName: 'Grains/Cereals', factor: 1.4, unit: 'kg', icon: '🌾' },

  // Shopping
  { category: 'shopping', subCategory: 'clothing', displayName: 'Clothing', factor: 22.0, unit: 'items', icon: '👕' },
  { category: 'shopping', subCategory: 'electronics', displayName: 'Electronics', factor: 50.0, unit: 'items', icon: '📱' },
  { category: 'shopping', subCategory: 'furniture', displayName: 'Furniture', factor: 80.0, unit: 'items', icon: '🪑' },
];

/**
 * Get emission factor for a specific sub-category.
 */
export function getEmissionFactor(subCategory: string): EmissionFactor | undefined {
  return EMISSION_FACTORS.find((ef) => ef.subCategory === subCategory);
}

/**
 * Get all emission factors for a category.
 */
export function getFactorsByCategory(category: Category): EmissionFactor[] {
  return EMISSION_FACTORS.filter((ef) => ef.category === category);
}

/**
 * Get the unit for a sub-category.
 */
export function getUnit(subCategory: string): string {
  return getEmissionFactor(subCategory)?.unit ?? 'units';
}

/**
 * Category metadata for display.
 */
export const CATEGORY_META: Record<Category, { label: string; icon: string; color: string }> = {
  transport: { label: 'Transport', icon: '🚗', color: 'hsl(200, 85%, 55%)' },
  energy: { label: 'Energy', icon: '⚡', color: 'hsl(38, 92%, 55%)' },
  food: { label: 'Food', icon: '🍽️', color: 'hsl(152, 68%, 42%)' },
  shopping: { label: 'Shopping', icon: '🛒', color: 'hsl(280, 65%, 55%)' },
};
