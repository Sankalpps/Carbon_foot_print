import { z } from 'zod';

/** Login form validation schema */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password must be less than 128 characters'),
});

/** Registration form validation schema */
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address')
      .max(255, 'Email must be less than 255 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be less than 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/** Valid activity categories */
export const CATEGORIES = ['transport', 'energy', 'food', 'shopping'] as const;
export type Category = (typeof CATEGORIES)[number];

/** Valid sub-categories per category */
export const SUB_CATEGORIES: Record<Category, string[]> = {
  transport: [
    'car_petrol',
    'car_diesel',
    'car_electric',
    'bus',
    'train',
    'domestic_flight',
    'international_flight',
    'bicycle',
  ],
  energy: ['electricity', 'natural_gas', 'lpg'],
  food: ['beef', 'poultry', 'fish', 'dairy', 'vegetables', 'fruits', 'grains'],
  shopping: ['clothing', 'electronics', 'furniture'],
};

/** Activity form validation schema */
export const activitySchema = z.object({
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: 'Please select a valid category' }),
  }),
  subCategory: z.string().min(1, 'Please select a sub-category'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than zero')
    .max(100000, 'Amount seems unreasonably large'),
  unit: z.string().min(1, 'Unit is required'),
  date: z.coerce.date({
    errorMap: () => ({ message: 'Please enter a valid date' }),
  }),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .default(''),
});

/** Goal form validation schema */
export const goalSchema = z.object({
  targetReduction: z
    .number({ invalid_type_error: 'Target must be a number' })
    .min(1, 'Target must be at least 1%')
    .max(100, 'Target cannot exceed 100%'),
  baselineCo2: z
    .number({ invalid_type_error: 'Baseline must be a number' })
    .positive('Baseline must be greater than zero'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ActivityInput = z.infer<typeof activitySchema>;
export type GoalInput = z.infer<typeof goalSchema>;
