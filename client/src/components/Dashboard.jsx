import { useState, useEffect } from 'react';
import { leadsApi } from '../api/leadsApi';

const STATUS_ORDER = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

const STATUS_ICONS = {
  'New': '🔵',
  'Contacted': '🟡',
  'Qualified': '🟢',
  'Proposal': '🟣',
  'Negotiation': '🟠',
  'Closed Won': '✅',
  'Closed Lost': '🔴',
};

export function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    leadsApi.getStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="state-container">
        <div className="spinner" />
        <div className="state-desc">Loading dashboard…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-banner">⚠️ {error}</div>
    );
  }

  const total = stats?.total ?? 0;
  const byStatus = stats?.byStatus ?? {};
  const bySource = stats?.bySource ?? [];

  const wonCount = byStatus['Closed Won'] || 0;
  const lostCount = byStatus['Closed Lost'] || 0;
  const activeCount = total - wonCount - lostCount;
  const winRate = wonCount + lostCount > 0
    ? Math.round((wonCount / (wonCount + lostCount)) * 100)
    : 0;

  return (
    <div>
      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-card-value">{total}</div>
          <div className="stat-card-label">Total Leads</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{activeCount}</div>
          <div className="stat-card-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: 'var(--color-success)' }}>{wonCount}</div>
          <div className="stat-card-label">Closed Won</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: 'var(--color-danger)' }}>{lostCount}</div>
          <div className="stat-card-label">Closed Lost</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: winRate > 50 ? 'var(--color-success)' : 'var(--color-warning)' }}>
            {winRate}%
          </div>
          <div className="stat-card-label">Win Rate</div>
        </div>
      </div>

      {/* Pipeline + Sources */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Pipeline by Status */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 20, boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 16 }}>
            Pipeline by Status
          </h3>
          {total === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No leads yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {STATUS_ORDER.map((status) => {
                const count = byStatus[status] || 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 4 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{STATUS_ICONS[status]}</span>
                        <span>{status}</span>
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {count}
                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: 4 }}>
                          ({pct}%)
                        </span>
                      </span>
                    </div>
                    <div style={{ background: 'var(--color-bg)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'var(--color-accent)',
                        borderRadius: 100,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Leads by Source */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 20, boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 16 }}>
            Leads by Source
          </h3>
          {bySource.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No leads yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bySource.map(({ source, count }) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={source}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 4 }}>
                      <span>{source}</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {count}
                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: 4 }}>
                          ({pct}%)
                        </span>
                      </span>
                    </div>
                    <div style={{ background: 'var(--color-bg)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: '#7c3aed',
                        borderRadius: 100,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
