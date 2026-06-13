'use client';

import { type InputHTMLAttributes, type ReactNode, useId } from 'react';
import styles from './Input.module.css';

/** Props for the {@link Input} component. */
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Visible label text. */
  label: string;
  /** Input name attribute (also used for htmlFor). */
  name: string;
  /** Validation error message. When present the input enters an error state. */
  error?: string;
  /** Helper text shown below the input when there is no error. */
  helperText?: string;
  /** An optional leading icon rendered inside the input field. */
  icon?: ReactNode;
}

/**
 * Labeled text input with optional leading icon, error display, and helper text.
 * Automatically wires up `aria-describedby` and `aria-invalid` for accessibility.
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   name="email"
 *   type="email"
 *   required
 *   error={errors.email}
 *   placeholder="you@example.com"
 * />
 * ```
 */
export default function Input({
  label,
  name,
  error,
  helperText,
  icon,
  required,
  className,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = rest.id || `input-${name}-${generatedId}`;
  const errorId = `error-${name}-${generatedId}`;
  const helperId = `helper-${name}-${generatedId}`;

  const describedBy = [
    error ? errorId : null,
    helperText && !error ? helperId : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  const inputClassNames = [
    styles.input,
    icon ? styles.inputWithIcon : '',
    error ? styles.inputError : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrapper}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div className={styles.inputContainer}>
        {icon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          name={name}
          className={inputClassNames}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
      </div>

      {error && (
        <p id={errorId} className={styles.errorText} role="alert">
          <svg
            className={styles.errorIcon}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11" r="0.75" fill="currentColor" />
          </svg>
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={helperId} className={styles.helperText}>
          {helperText}
        </p>
      )}
    </div>
  );
}
