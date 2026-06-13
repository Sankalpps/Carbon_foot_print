import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  activitySchema,
  goalSchema,
  CATEGORIES,
  SUB_CATEGORIES,
} from '@/lib/validations';

/**
 * Tests for all Zod validation schemas.
 * Covers login, register, activity, and goal schemas with happy paths,
 * invalid inputs, boundary conditions, and edge cases.
 */
describe('Validations', () => {
  // ── CATEGORIES & SUB_CATEGORIES ───────────────────────────────────────────

  describe('CATEGORIES', () => {
    it('should have exactly 4 entries', () => {
      expect(CATEGORIES).toHaveLength(4);
    });

    it('should contain transport, energy, food, shopping', () => {
      expect(CATEGORIES).toContain('transport');
      expect(CATEGORIES).toContain('energy');
      expect(CATEGORIES).toContain('food');
      expect(CATEGORIES).toContain('shopping');
    });
  });

  describe('SUB_CATEGORIES', () => {
    it('should have entries for each category', () => {
      for (const cat of CATEGORIES) {
        expect(SUB_CATEGORIES[cat]).toBeDefined();
        expect(SUB_CATEGORIES[cat].length).toBeGreaterThan(0);
      }
    });

    it('transport should have 8 sub-categories', () => {
      expect(SUB_CATEGORIES.transport).toHaveLength(8);
    });

    it('energy should have 3 sub-categories', () => {
      expect(SUB_CATEGORIES.energy).toHaveLength(3);
    });

    it('food should have 7 sub-categories', () => {
      expect(SUB_CATEGORIES.food).toHaveLength(7);
    });

    it('shopping should have 3 sub-categories', () => {
      expect(SUB_CATEGORIES.shopping).toHaveLength(3);
    });
  });

  // ── loginSchema ───────────────────────────────────────────────────────────

  describe('loginSchema', () => {
    it('should accept valid input', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'mypassword123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing email', () => {
      const result = loginSchema.safeParse({ password: 'pass' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'notanemail',
        password: 'pass',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject email longer than 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@b.com';
      const result = loginSchema.safeParse({
        email: longEmail,
        password: 'pass',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const result = loginSchema.safeParse({ email: 'user@example.com' });
      expect(result.success).toBe(false);
    });
  });

  // ── registerSchema ────────────────────────────────────────────────────────

  describe('registerSchema', () => {
    const validInput = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Strong1pass',
      confirmPassword: 'Strong1pass',
    };

    it('should accept valid input', () => {
      const result = registerSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject password without uppercase letter', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        password: 'weakpass1',
        confirmPassword: 'weakpass1',
      });
      expect(result.success).toBe(false);
    });

    it('should reject password without a number', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        password: 'WeakPassword',
        confirmPassword: 'WeakPassword',
      });
      expect(result.success).toBe(false);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        password: 'Sh1',
        confirmPassword: 'Sh1',
      });
      expect(result.success).toBe(false);
    });

    it('should reject name with invalid characters (digits)', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        name: 'John123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject when passwords do not match', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        confirmPassword: 'Different1pass',
      });
      expect(result.success).toBe(false);
    });

    it('should reject name longer than 100 characters', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        name: 'A'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('should accept name with hyphens and apostrophes', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        name: "Mary-Jane O'Brien",
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing name', () => {
      const { name, ...rest } = validInput;
      const result = registerSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  // ── activitySchema ────────────────────────────────────────────────────────

  describe('activitySchema', () => {
    const validActivity = {
      category: 'transport' as const,
      subCategory: 'car_petrol',
      amount: 25,
      unit: 'km',
      date: new Date().toISOString(),
      notes: '',
    };

    it('should accept valid activity', () => {
      const result = activitySchema.safeParse(validActivity);
      expect(result.success).toBe(true);
    });

    it('should reject negative amount', () => {
      const result = activitySchema.safeParse({ ...validActivity, amount: -5 });
      expect(result.success).toBe(false);
    });

    it('should reject zero amount', () => {
      const result = activitySchema.safeParse({ ...validActivity, amount: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject amount greater than 100000', () => {
      const result = activitySchema.safeParse({ ...validActivity, amount: 100001 });
      expect(result.success).toBe(false);
    });

    it('should accept amount exactly 100000', () => {
      const result = activitySchema.safeParse({ ...validActivity, amount: 100000 });
      expect(result.success).toBe(true);
    });

    it('should reject missing category', () => {
      const { category, ...rest } = validActivity;
      const result = activitySchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject invalid category', () => {
      const result = activitySchema.safeParse({ ...validActivity, category: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should reject missing subCategory', () => {
      const result = activitySchema.safeParse({ ...validActivity, subCategory: '' });
      expect(result.success).toBe(false);
    });

    it('should coerce date string to Date', () => {
      const result = activitySchema.safeParse(validActivity);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date).toBeInstanceOf(Date);
      }
    });

    it('should reject notes longer than 500 characters', () => {
      const result = activitySchema.safeParse({
        ...validActivity,
        notes: 'x'.repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it('should accept activity without notes', () => {
      const { notes, ...rest } = validActivity;
      const result = activitySchema.safeParse(rest);
      expect(result.success).toBe(true);
    });

    it('should reject non-numeric amount', () => {
      const result = activitySchema.safeParse({ ...validActivity, amount: 'abc' });
      expect(result.success).toBe(false);
    });
  });

  // ── goalSchema ────────────────────────────────────────────────────────────

  describe('goalSchema', () => {
    const validGoal = {
      targetReduction: 20,
      baselineCo2: 500,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    };

    it('should accept valid goal', () => {
      const result = goalSchema.safeParse(validGoal);
      expect(result.success).toBe(true);
    });

    it('should reject end date before start date', () => {
      const result = goalSchema.safeParse({
        ...validGoal,
        endDate: '2024-01-01',
      });
      expect(result.success).toBe(false);
    });

    it('should reject end date equal to start date', () => {
      const result = goalSchema.safeParse({
        ...validGoal,
        startDate: '2025-06-01',
        endDate: '2025-06-01',
      });
      expect(result.success).toBe(false);
    });

    it('should reject reduction less than 1', () => {
      const result = goalSchema.safeParse({ ...validGoal, targetReduction: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject reduction greater than 100', () => {
      const result = goalSchema.safeParse({ ...validGoal, targetReduction: 101 });
      expect(result.success).toBe(false);
    });

    it('should accept reduction of exactly 1', () => {
      const result = goalSchema.safeParse({ ...validGoal, targetReduction: 1 });
      expect(result.success).toBe(true);
    });

    it('should accept reduction of exactly 100', () => {
      const result = goalSchema.safeParse({ ...validGoal, targetReduction: 100 });
      expect(result.success).toBe(true);
    });

    it('should reject negative baseline', () => {
      const result = goalSchema.safeParse({ ...validGoal, baselineCo2: -10 });
      expect(result.success).toBe(false);
    });

    it('should reject zero baseline', () => {
      const result = goalSchema.safeParse({ ...validGoal, baselineCo2: 0 });
      expect(result.success).toBe(false);
    });

    it('should coerce date strings to Date objects', () => {
      const result = goalSchema.safeParse(validGoal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startDate).toBeInstanceOf(Date);
        expect(result.data.endDate).toBeInstanceOf(Date);
      }
    });
  });
});
