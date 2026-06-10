import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DashboardShell } from './DashboardShell';

/**
 * Dashboard layout (Server Component).
 * Checks authentication and redirects to /login if no session exists.
 * Renders the DashboardShell client component with user info and children.
 */
export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <DashboardShell
      userName={session.user.name ?? 'User'}
      userEmail={session.user.email ?? ''}
    >
      {children}
    </DashboardShell>
  );
}
