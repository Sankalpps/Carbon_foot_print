'use server';

import { signIn } from '@/lib/auth';
import { createUser, getUserByEmail } from '@/lib/dal/users';
import { registerSchema, loginSchema } from '@/lib/validations';
import { AuthError } from 'next-auth';

export interface AuthResult {
  success: boolean;
  error?: string;
}

/**
 * Register a new user.
 */
export async function register(formData: FormData): Promise<AuthResult> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    // Check if user already exists
    const existing = await getUserByEmail(parsed.data.email);
    if (existing) {
      return { success: false, error: 'An account with this email already exists' };
    }

    // Create user
    await createUser({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });

    // Auto-login after registration
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}

/**
 * Login with credentials.
 */
export async function login(formData: FormData): Promise<AuthResult> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: 'Invalid email or password' };
    }
    throw error;
  }
}
