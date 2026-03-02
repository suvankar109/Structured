export default function TimelineLoading() {
    return (
        <div className="page-container page-enter">
            <div style={{ marginBottom: 24 }}>
                <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: 120, height: 16 }} />
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ width: 48, height: 60 }} />
                ))}
            </div>
            <div className="stats-grid">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 80 }} />
                ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 80 }} />
                ))}
            </div>
        </div>
    );
}
