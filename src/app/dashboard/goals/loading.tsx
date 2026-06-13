export default function GoalsLoading() {
  return (
    <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
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
      <div className="skeleton" style={{ height: '380px', borderRadius: '1rem' }} />
      <div className="skeleton" style={{ height: '380px', borderRadius: '1rem' }} />
    </div>
  );
}
