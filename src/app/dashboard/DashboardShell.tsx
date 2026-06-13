'use client';

import { type ReactNode } from 'react';
import { signOut } from 'next-auth/react';
import Sidebar from '@/components/dashboard/Sidebar';
import LiveIntensityBanner from '@/components/dashboard/LiveIntensityBanner';
import { useRealTimeCarbon } from '@/hooks/useRealTimeCarbon';
import styles from './layout.module.css';

interface DashboardShellProps {
  children: ReactNode;
  userName: string;
  userEmail: string;
}

export function DashboardShell({
  children,
  userName,
  userEmail,
}: DashboardShellProps) {
  const { intensity, status, isConnected } = useRealTimeCarbon();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className={styles.dashboardLayout}>
      {/* Sidebar navigation */}
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        onLogout={handleLogout}
      />

      <div className={styles.mainArea}>
        {/* Real-time carbon grid banner */}
        <div className={styles.liveBannerWrapper}>
          <LiveIntensityBanner
            intensity={intensity}
            status={status}
            isConnected={isConnected}
          />
        </div>

        {/* Dynamic page content */}
        <main id="main-content" className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
