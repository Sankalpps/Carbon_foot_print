export default function DashboardLoading() {
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
      
      {/* 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        <div className="skeleton" style={{ height: '120px' }} />
        <div className="skeleton" style={{ height: '120px' }} />
        <div className="skeleton" style={{ height: '120px' }} />
        <div className="skeleton" style={{ height: '120px' }} />
      </div>

      {/* 2 Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div className="skeleton" style={{ height: '350px', borderRadius: '1rem' }} />
        <div className="skeleton" style={{ height: '350px', borderRadius: '1rem' }} />
      </div>

      {/* Activity Table skeleton */}
      <div className="skeleton" style={{ height: '250px', borderRadius: '1rem' }} />
    </div>
  );
}
