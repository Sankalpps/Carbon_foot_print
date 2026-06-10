'use client';

import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import styles from './Modal.module.css';

/** Size presets for the modal panel. */
type ModalSize = 'sm' | 'md' | 'lg';

/** Props for the {@link Modal} component. */
interface ModalProps {
  /** Whether the modal is visible. */
  isOpen: boolean;
  /** Called when the modal should close (Escape, backdrop click, close button). */
  onClose: () => void;
  /** Title displayed in the header. */
  title: string;
  /** Modal body content. */
  children: ReactNode;
  /** Width preset. @default 'md' */
  size?: ModalSize;
}

/** Selectors for elements that can receive focus inside the modal. */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Accessible modal dialog with focus-trap, Escape-to-close, and animated
 * entrance/exit transitions.
 *
 * @example
 * ```tsx
 * <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Confirm">
 *   <p>Are you sure?</p>
 * </Modal>
 * ```
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  /* ── Open / close lifecycle ── */
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      setVisible(true);
      // Trigger animation on next frame so the initial opacity:0 renders first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true));
      });
    } else {
      setAnimate(false);
      const timer = setTimeout(() => {
        setVisible(false);
        previousFocusRef.current?.focus();
      }, 250); // match CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  /* ── Focus first element when opening ── */
  useEffect(() => {
    if (animate && panelRef.current) {
      const firstFocusable = panelRef.current.querySelector<HTMLElement>(
        FOCUSABLE_SELECTORS,
      );
      firstFocusable?.focus();
    }
  }, [animate]);

  /* ── Lock body scroll ── */
  useEffect(() => {
    if (visible) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [visible]);

  /* ── Keyboard handler (Escape + Tab trap) ── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusableElements = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [onClose],
  );

  /* ── Backdrop click ── */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  if (!visible) return null;

  const overlayClasses = [styles.overlay, animate ? styles.overlayOpen : '']
    .filter(Boolean)
    .join(' ');

  const panelClasses = [
    styles.panel,
    styles[size],
    animate ? styles.panelOpen : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={overlayClasses}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className={panelClasses} ref={panelRef}>
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg
              className={styles.closeIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
