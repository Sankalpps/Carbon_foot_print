'use client';

import { useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions/auth';
import styles from './page.module.css';

/**
 * Login page component.
 * Client component that handles email/password authentication
 * via the NextAuth signIn flow.
 */
export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles form submission for credential-based login.
   * Calls the login server action.
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set('email', email.trim());
      formData.set('password', password);

      const result = await login(formData);
      if (!result.success) {
        setError(result.error || 'Login failed. Please try again.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    });
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
        <h1 className={styles.authTitle}>Welcome Back</h1>
        <p className={styles.authSubtitle}>
          Sign in to continue tracking your carbon footprint
        </p>

        {/* Error message */}
        {error && (
          <div className={styles.errorMessage} role="alert">
            <span aria-hidden="true">⚠️</span>
            {error}
          </div>
        )}

        {/* Login form */}
        <form
          className={styles.form}
          onSubmit={handleSubmit}
          noValidate
          aria-label="Sign in form"
        >
          <div className={styles.fieldGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              className={styles.input}
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-required="true"
              aria-invalid={!!error}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              className={styles.input}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-required="true"
              aria-invalid={!!error}
            />
          </div>

          <button
            type="submit"
            className={`${styles.submitButton} ${isPending ? styles.submitButtonLoading : ''}`}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                Signing in…
                <span className={styles.spinner} aria-hidden="true" />
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer link */}
        <p className={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className={styles.footerLink}>
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
