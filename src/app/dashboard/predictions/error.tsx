'use client';

export default function PredictionsError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--surface-primary)', borderRadius: '1rem', border: '1px solid var(--border-color)', margin: '2rem 0' }}>
      <h2 style={{ color: 'hsl(0, 0%, 95%)', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>
        Error loading predictions
      </h2>
      <p style={{ color: 'hsl(0, 0%, 70%)', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>
        An error occurred during TensorFlow.js model initialization or forecasting.
      </p>
      <button
        onClick={reset}
        style={{
          padding: '0.75rem 2rem',
          backgroundColor: 'hsl(152, 68%, 42%)',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: '600',
          transition: 'all 0.2s ease',
        }}
      >
        Try Again
      </button>
    </div>
  );
}
