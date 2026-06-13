import Link from 'next/link';

export default function DashboardNotFound() {
  return (
    <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--surface-primary)', borderRadius: '1rem', border: '1px solid var(--border-color)', margin: '2rem 0' }}>
      <h2 style={{ color: 'hsl(0, 0%, 95%)', marginBottom: '1rem', fontSize: '2rem', fontWeight: 800 }}>
        Page Not Found
      </h2>
      <p style={{ color: 'hsl(0, 0%, 70%)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem', fontSize: '1rem' }}>
        The dashboard section you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        style={{
          padding: '0.75rem 2rem',
          backgroundColor: 'hsl(152, 68%, 42%)',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: '600',
          textDecoration: 'none',
          transition: 'all 0.2s ease',
          display: 'inline-block',
        }}
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
