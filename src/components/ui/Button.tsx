'use client';

import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './Button.module.css';

/** Supported button visual variants. */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/** Supported button sizes. */
type ButtonSize = 'sm' | 'md' | 'lg';

/** Props for the {@link Button} component. */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button. @default 'primary' */
  variant?: ButtonVariant;
  /** Size preset for padding and font. @default 'md' */
  size?: ButtonSize;
  /** When true, shows a loading spinner and disables interaction. */
  loading?: boolean;
  /** Stretch the button to fill its parent width. */
  fullWidth?: boolean;
  /** Button content. */
  children: ReactNode;
}

/**
 * Reusable button component with multiple visual variants, size presets,
 * a built-in loading spinner, and full keyboard + screen-reader support.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="lg" loading={isSubmitting}>
 *   Submit
 * </Button>
 * ```
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled = false,
  children,
  className,
  ...rest
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    loading ? styles.loading : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classNames}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {loading && (
        <span className={styles.spinner} aria-hidden="true">
          <span className={styles.spinnerIcon} />
        </span>
      )}
      <span className={loading ? styles.loadingContent : undefined}>
        {children}
      </span>
    </button>
  );
}
