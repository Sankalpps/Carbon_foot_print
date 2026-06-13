export default function TrackLoading() {
  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
      <div className="skeleton" style={{ height: '400px', borderRadius: '1rem' }} />
      <div className="skeleton" style={{ height: '300px', borderRadius: '1rem' }} />
    </div>
  );
}
