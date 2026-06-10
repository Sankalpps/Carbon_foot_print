'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import styles from './Sidebar.module.css';

/* ────────────────────── Navigation Data ────────────────────── */

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Track',
    href: '/dashboard/track',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10" />
        <path d="M18 20V4" />
        <path d="M6 20v-4" />
      </svg>
    ),
  },
  {
    label: 'Insights',
    href: '/dashboard/insights',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
  },
  {
    label: 'AI Predictions',
    href: '/dashboard/predictions',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 014 4c0 1.95-1.4 3.57-3.25 3.92" />
        <path d="M8.75 9.92A4.001 4.001 0 0112 2" />
        <path d="M9 22h6" />
        <path d="M10 18h4" />
        <path d="M12 14v4" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Live Grid',
    href: '/dashboard/live',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    label: 'Goals',
    href: '/dashboard/goals',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
];

/* ──────────────────────── Sidebar Props ─────────────────────── */

interface SidebarProps {
  /** Name of the logged-in user. */
  userName?: string;
  /** Email of the logged-in user. */
  userEmail?: string;
  /** Called when the user clicks the logout button. */
  onLogout?: () => void;
}

/**
 * Dashboard sidebar navigation with collapsible hamburger on mobile,
 * active-link highlighting, user information, and logout button.
 *
 * @example
 * ```tsx
 * <Sidebar
 *   userName="Jane Doe"
 *   userEmail="jane@example.com"
 *   onLogout={() => signOut()}
 * />
 * ```
 */
export default function Sidebar({
  userName = 'User',
  userEmail = '',
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  /** Close sidebar when navigating on mobile. */
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /** Close on Escape key. */
  useEffect(() => {
    if (!mobileOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mobileOpen]);

  /** Lock body scroll on mobile when sidebar is open. */
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  /** Check if a nav link is currently active. */
  const isActive = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  /** Generate initials from the user name. */
  const initials = userName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sidebarClasses = [
    styles.sidebar,
    mobileOpen ? styles.sidebarOpen : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {/* Mobile hamburger toggle */}
      <button
        type="button"
        className={styles.mobileToggle}
        onClick={toggleMobile}
        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileOpen}
      >
        <svg
          className={styles.hamburgerIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {mobileOpen ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <>
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </>
          )}
        </svg>
      </button>

      {/* Backdrop overlay for mobile */}
      {mobileOpen && (
        <div
          className={styles.overlay}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside className={sidebarClasses}>
        {/* Brand */}
        <Link href="/dashboard" className={styles.brand}>
          <svg
            className={styles.logo}
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="16" cy="16" r="14" stroke="hsl(152,68%,42%)" strokeWidth="2" />
            <path
              d="M10 20c1-4 3-8 6-10s5 2 6 6"
              stroke="hsl(152,68%,42%)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="16" cy="12" r="2" fill="hsl(200,85%,55%)" />
          </svg>
          <h1 className={styles.brandName}>
            Carbon<span className={styles.brandAccent}>Wise</span>
          </h1>
        </Link>

        {/* Navigation links */}
        <nav className={styles.nav} aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  styles.navLink,
                  active ? styles.navLinkActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-current={active ? 'page' : undefined}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className={styles.userSection}>
          <div className={styles.avatar} aria-hidden="true">
            {initials}
          </div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{userName}</p>
            {userEmail && <p className={styles.userEmail}>{userEmail}</p>}
          </div>
          {onLogout && (
            <button
              type="button"
              className={styles.logoutButton}
              onClick={onLogout}
              aria-label="Log out"
            >
              <svg
                className={styles.logoutIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
