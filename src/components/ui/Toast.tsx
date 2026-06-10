'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import styles from './Toast.module.css';

/* ─────────────────────────── Types ─────────────────────────── */

/** Supported toast notification types. */
type ToastType = 'success' | 'error' | 'warning' | 'info';

/** A single toast notification record. */
interface Toast {
  /** Unique identifier. */
  id: string;
  /** Visual type / severity. */
  type: ToastType;
  /** Bold title line. */
  title: string;
  /** Optional descriptive body text. */
  message?: string;
  /** Whether the toast is animating out. */
  exiting?: boolean;
}

/** Options accepted when creating a toast. */
interface ToastOptions {
  type: ToastType;
  title: string;
  message?: string;
}

/** Shape of the toast context value. */
interface ToastContextValue {
  /** Add a new toast to the stack. */
  addToast: (options: ToastOptions) => void;
  /** Dismiss a toast by its ID. */
  removeToast: (id: string) => void;
}

/* ───────────────────────── Context ─────────────────────────── */

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Hook to access the toast notification system.
 *
 * @example
 * ```tsx
 * const { addToast } = useToast();
 * addToast({ type: 'success', title: 'Saved!', message: 'Your entry was logged.' });
 * ```
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return context;
}

/* ────────────────────── SVG icon map ───────────────────────── */

const ICONS: Record<ToastType, ReactNode> = {
  success: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.5 10.5l2 2 5-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7 7l6 6M13 7l-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2l8.66 15H1.34L10 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M10 8v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="10" cy="14" r="0.75" fill="currentColor" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 9v5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="10" cy="6.5" r="0.75" fill="currentColor" />
    </svg>
  ),
};

/* ──────────────────── Title labels map ─────────────────────── */

const TYPE_LABELS: Record<ToastType, string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

/* ────────────────────── Toast Provider ─────────────────────── */

/** Auto-dismiss delay in milliseconds. */
const AUTO_DISMISS_MS = 5000;
/** Exit animation duration in milliseconds. */
const EXIT_ANIMATION_MS = 150;

/**
 * Provides the toast notification system. Wrap your app or layout with this
 * provider to enable {@link useToast} throughout the tree.
 *
 * @example
 * ```tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * ```
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  /** Start the exit animation, then fully remove after the animation completes. */
  const dismiss = useCallback((id: string) => {
    // Clear the auto-dismiss timer if it exists
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    // Mark as exiting for the slide-out animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );

    // Remove from DOM after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_ANIMATION_MS);
  }, []);

  const addToast = useCallback(
    (options: ToastOptions) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const toast: Toast = { id, ...options };

      setToasts((prev) => [...prev, toast]);

      // Schedule auto-dismiss
      const timer = setTimeout(() => {
        dismiss(id);
      }, AUTO_DISMISS_MS);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const removeToast = useCallback(
    (id: string) => {
      dismiss(id);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}

      {/* Toast container – rendered at the root of the provider */}
      <div className={styles.container} aria-live="polite" role="log">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={[
              styles.toast,
              styles[toast.type],
              toast.exiting ? styles.toastExiting : '',
            ]
              .filter(Boolean)
              .join(' ')}
            role="alert"
          >
            <span className={styles.icon}>{ICONS[toast.type]}</span>

            <div className={styles.content}>
              <p className={styles.toastTitle}>
                {toast.title || TYPE_LABELS[toast.type]}
              </p>
              {toast.message && (
                <p className={styles.message}>{toast.message}</p>
              )}
            </div>

            <button
              type="button"
              className={styles.dismiss}
              onClick={() => removeToast(toast.id)}
              aria-label={`Dismiss ${toast.type} notification`}
            >
              <svg
                className={styles.dismissIcon}
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 4L4 12M4 4l8 8" />
              </svg>
            </button>

            {/* Auto-dismiss progress bar */}
            {!toast.exiting && <div className={styles.progress} />}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
