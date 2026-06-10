import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

/**
 * Application-level metadata for SEO and social sharing.
 */
export const metadata: Metadata = {
  title: {
    default: 'CarbonWise - AI-Powered Carbon Footprint Tracker',
    template: '%s | CarbonWise',
  },
  description:
    'Track, analyze, and reduce your carbon footprint with AI-powered insights, real-time energy data, and personalized recommendations.',
  keywords: [
    'carbon footprint',
    'sustainability',
    'AI',
    'carbon tracker',
    'emissions',
    'climate',
    'green energy',
  ],
  authors: [{ name: 'CarbonWise Team' }],
  openGraph: {
    title: 'CarbonWise - AI-Powered Carbon Footprint Tracker',
    description:
      'Track, analyze, and reduce your carbon footprint with AI-powered insights.',
    type: 'website',
    locale: 'en_US',
    siteName: 'CarbonWise',
  },
};

/**
 * Viewport configuration for responsive design.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1a2332',
};

/**
 * Root layout component.
 * Wraps the entire application with global providers, accessibility features,
 * and the base HTML structure.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
