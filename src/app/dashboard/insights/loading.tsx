export default function InsightsLoading() {
  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, hsl(220, 16%, 16%) 25%, hsl(220, 16%, 22%) 50%, hsl(220, 16%, 16%) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
          border-radius: 0.5rem;
        }
      `}</style>
      <div className="skeleton" style={{ height: '80px', borderRadius: '0.75rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div className="skeleton" style={{ height: '180px', borderRadius: '1rem' }} />
        <div className="skeleton" style={{ height: '180px', borderRadius: '1rem' }} />
        <div className="skeleton" style={{ height: '180px', borderRadius: '1rem' }} />
      </div>
      <div className="skeleton" style={{ height: '220px', borderRadius: '1rem' }} />
    </div>
  );
}
