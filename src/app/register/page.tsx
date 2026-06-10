'use client';

import { useState, useTransition, useMemo, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import styles from './page.module.css';

/**
 * Zod schema for registration form validation.
 */
const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be under 50 characters')
      .trim(),
    email: z.string().email('Please enter a valid email address').trim(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be under 100 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/** Represents the strength level of a password. */
type PasswordStrength = 'weak' | 'medium' | 'strong';

/**
 * Calculates password strength based on complexity criteria.
 * @param password - The password string to evaluate.
 * @returns A strength level: weak, medium, or strong.
 */
function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}

/** Map of strength levels to number of active segments in the strength bar. */
const strengthSegments: Record<PasswordStrength, number> = {
  weak: 1,
  medium: 2,
  strong: 3,
};

/** Map of strength levels to human-readable labels. */
const strengthLabels: Record<PasswordStrength, string> = {
  weak: 'Weak password',
  medium: 'Medium password',
  strong: 'Strong password',
};

/** Field-level error state type. */
interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * Register page component.
 * Client component that handles user registration with Zod validation,
 * password strength indicator, and server action for account creation.
 */
export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  /** Compute password strength reactively. */
  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password]
  );

  /**
   * Handles form submission: validates with Zod then posts to register API.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);
    setFieldErrors({});

    const result = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: result.data.name,
            email: result.data.email,
            password: result.data.password,
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { message?: string };
          setServerError(
            data.message ?? 'Registration failed. Please try again.'
          );
          return;
        }

        router.push('/login?registered=true');
      } catch {
        setServerError('An unexpected error occurred. Please try again later.');
      }
    });
  }

  /**
   * Returns the CSS class for a strength segment based on position and level.
   */
  function getSegmentClass(index: number): string {
    const activeCount = strengthSegments[passwordStrength];
    if (index >= activeCount || password.length === 0) {
      return styles.strengthSegment;
    }
    const strengthClass =
      passwordStrength === 'weak'
        ? styles.strengthWeak
        : passwordStrength === 'medium'
          ? styles.strengthMedium
          : styles.strengthStrong;
    return `${styles.strengthSegment} ${strengthClass}`;
  }

  /**
   * Returns the CSS class for the strength label text.
   */
  function getStrengthLabelClass(): string {
    const base = styles.strengthLabel;
    if (passwordStrength === 'weak') return `${base} ${styles.strengthLabelWeak}`;
    if (passwordStrength === 'medium') return `${base} ${styles.strengthLabelMedium}`;
    return `${base} ${styles.strengthLabelStrong}`;
  }

  return (
    <main id="main-content" className={styles.authPage}>
      <div className={styles.authCard}>
        {/* Logo */}
        <Link href="/" className={styles.logo} aria-label="CarbonWise home">
          <span className={styles.logoIcon} aria-hidden="true">
            🌱
          </span>
          <span className={styles.logoText}>
            Carbon<span className={styles.logoHighlight}>Wise</span>
          </span>
        </Link>

        {/* Header */}
        <h1 className={styles.authTitle}>Create Your Account</h1>
        <p className={styles.authSubtitle}>
          Start tracking your carbon footprint today
        </p>

        {/* Server error */}
        {serverError && (
          <div className={styles.errorMessage} role="alert">
            <span aria-hidden="true">⚠️</span>
            {serverError}
          </div>
        )}

        {/* Registration form */}
        <form
          className={styles.form}
          onSubmit={handleSubmit}
          noValidate
          aria-label="Registration form"
        >
          {/* Name */}
          <div className={styles.fieldGroup}>
            <label htmlFor="name" className={styles.label}>
              Full Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              className={`${styles.input} ${fieldErrors.name ? styles.inputError : ''}`}
              placeholder="Jane Doe"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-required="true"
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? 'name-error' : undefined}
            />
            {fieldErrors.name && (
              <span id="name-error" className={styles.fieldError} role="alert">
                {fieldErrors.name}
              </span>
            )}
          </div>

          {/* Email */}
          <div className={styles.fieldGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-required="true"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            />
            {fieldErrors.email && (
              <span id="email-error" className={styles.fieldError} role="alert">
                {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div className={styles.fieldGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-required="true"
              aria-invalid={!!fieldErrors.password}
              aria-describedby="password-strength password-error"
            />
            {fieldErrors.password && (
              <span
                id="password-error"
                className={styles.fieldError}
                role="alert"
              >
                {fieldErrors.password}
              </span>
            )}

            {/* Password strength indicator */}
            {password.length > 0 && (
              <div
                className={styles.passwordStrength}
                id="password-strength"
                aria-label={`Password strength: ${strengthLabels[passwordStrength]}`}
              >
                <div className={styles.strengthBar} aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={getSegmentClass(i)} />
                  ))}
                </div>
                <span className={getStrengthLabelClass()}>
                  {strengthLabels[passwordStrength]}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className={styles.fieldGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              className={`${styles.input} ${fieldErrors.confirmPassword ? styles.inputError : ''}`}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-required="true"
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={
                fieldErrors.confirmPassword
                  ? 'confirm-password-error'
                  : undefined
              }
            />
            {fieldErrors.confirmPassword && (
              <span
                id="confirm-password-error"
                className={styles.fieldError}
                role="alert"
              >
                {fieldErrors.confirmPassword}
              </span>
            )}
          </div>

          <button
            type="submit"
            className={`${styles.submitButton} ${isPending ? styles.submitButtonLoading : ''}`}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                Creating account…
                <span className={styles.spinner} aria-hidden="true" />
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className={styles.footer}>
          Already have an account?{' '}
          <Link href="/login" className={styles.footerLink}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
