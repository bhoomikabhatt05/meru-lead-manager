import { useState, useEffect } from 'react';
import { leadsApi } from '../api/leadsApi';
import { StatusBadge } from './StatusBadge';
import { ArrowUpRight, BuildingIcon, PlusIcon } from './Icons';

const STATUS_CONFIG = {
  New: { label: 'New', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  Contacted: { label: 'Contacted', color: '#f59e0b', bg: '#fefce8', border: '#fef08a' },
  Qualified: { label: 'Qualified', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
  Lost: { label: 'Lost', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
};

const ORDERED_STATUSES = ['New', 'Contacted', 'Qualified', 'Lost'];

export function Dashboard({ onNavigateToLeads, onAddLead, onEditLead }) {
  const [stats, setStats] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeHoverSlice, setActiveHoverSlice] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      leadsApi.getStats(),
      leadsApi.getAll({ limit: 5, sortBy: 'created_at', sortOrder: 'desc' }),
    ])
      .then(([statsData, recentData]) => {
        if (!isMounted) return;
        setStats(statsData);
        setRecentLeads(recentData?.data || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load dashboard data');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading-state">
        <div className="dashboard-spinner" />
        <p className="loading-text">Loading sales analytics & pipeline metrics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error-banner">
        <span className="error-icon">⚠️</span>
        <div>
          <h4 className="error-title">Unable to load dashboard</h4>
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  const total = stats?.total ?? 0;
  const byStatus = stats?.byStatus ?? {};
  const bySource = stats?.bySource ?? [];

  const newCount = byStatus['New'] || 0;
  const contactedCount = byStatus['Contacted'] || 0;
  const qualifiedCount = byStatus['Qualified'] || 0;
  const lostCount = byStatus['Lost'] || 0;

  const qualifiedRate = total > 0 ? Math.round((qualifiedCount / total) * 100) : 0;
  const activePipelineCount = newCount + contactedCount;

  // Build Donut segments using SVG stroke-dasharray
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const donutSegments = ORDERED_STATUSES.map((statusKey) => {
    const count = byStatus[statusKey] || 0;
    const percent = total > 0 ? count / total : 0;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -(accumulatedPercent * circumference);
    accumulatedPercent += percent;

    return {
      statusKey,
      count,
      percent: Math.round(percent * 100),
      strokeDasharray,
      strokeDashoffset,
      color: STATUS_CONFIG[statusKey].color,
      label: STATUS_CONFIG[statusKey].label,
    };
  });

  return (
    <div className="dashboard-container">
      {/* KPI Highlight Cards */}
      <div className="kpi-grid">
        <div className="kpi-card highlight">
          <div className="kpi-header">
            <span className="kpi-label">TOTAL LEADS</span>
            <span className="kpi-trend neutral">All Time</span>
          </div>
          <div className="kpi-value-wrap">
            <span className="kpi-value">{total}</span>
            <span className="kpi-subtext">{activePipelineCount} active in pipeline</span>
          </div>
          <div className="kpi-progress-bar">
            <div className="kpi-progress-fill" style={{ width: `${Math.min(100, (total / 20) * 100)}%` }} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">NEW LEADS</span>
            <span className="status-pill-indicator new">New</span>
          </div>
          <div className="kpi-value-wrap">
            <span className="kpi-value text-blue">{newCount}</span>
            <span className="kpi-subtext">Needs initial review</span>
          </div>
          <div className="kpi-sub-meter">
            <span className="meter-label">Share of pipeline</span>
            <span className="meter-value">{total > 0 ? Math.round((newCount / total) * 100) : 0}%</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">CONTACTED</span>
            <span className="status-pill-indicator contacted">Contacted</span>
          </div>
          <div className="kpi-value-wrap">
            <span className="kpi-value text-amber">{contactedCount}</span>
            <span className="kpi-subtext">Discovery ongoing</span>
          </div>
          <div className="kpi-sub-meter">
            <span className="meter-label">Share of pipeline</span>
            <span className="meter-value">{total > 0 ? Math.round((contactedCount / total) * 100) : 0}%</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">QUALIFIED</span>
            <span className="status-pill-indicator qualified">Qualified</span>
          </div>
          <div className="kpi-value-wrap">
            <span className="kpi-value text-emerald">{qualifiedCount}</span>
            <span className="kpi-subtext">Ready for proposal</span>
          </div>
          <div className="kpi-sub-meter">
            <span className="meter-label">Conversion Rate</span>
            <span className="meter-value text-emerald">{qualifiedRate}%</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">LOST</span>
            <span className="status-pill-indicator lost">Lost</span>
          </div>
          <div className="kpi-value-wrap">
            <span className="kpi-value text-rose">{lostCount}</span>
            <span className="kpi-subtext">Disqualified or churned</span>
          </div>
          <div className="kpi-sub-meter">
            <span className="meter-label">Loss Rate</span>
            <span className="meter-value text-rose">{total > 0 ? Math.round((lostCount / total) * 100) : 0}%</span>
          </div>
        </div>
      </div>

      {/* Analytics Visualizations Grid */}
      <div className="analytics-grid">
        {/* Status Distribution Donut Chart */}
        <div className="analytics-card">
          <div className="card-top-bar">
            <div>
              <h3 className="card-title">Status Distribution</h3>
              <p className="card-subtitle">Breakdown of leads by current pipeline stage</p>
            </div>
            <span className="card-badge">{total} Leads</span>
          </div>

          {total === 0 ? (
            <div className="chart-empty-state">
              <span className="empty-icon">📊</span>
              <p className="empty-text">No leads in pipeline yet</p>
              <button className="btn-secondary-sm" onClick={onAddLead}>
                + Add First Lead
              </button>
            </div>
          ) : (
            <div className="donut-chart-layout">
              {/* SVG Donut Visual */}
              <div className="donut-visual-container">
                <svg className="donut-svg" viewBox="0 0 160 160">
                  {/* Background Track */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="18"
                  />

                  {/* Dynamic Arc Segments */}
                  {donutSegments.map((seg) => {
                    if (seg.count === 0) return null;
                    const isHovered = activeHoverSlice?.statusKey === seg.statusKey;
                    return (
                      <circle
                        key={seg.statusKey}
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth={isHovered ? 22 : 18}
                        strokeDasharray={seg.strokeDasharray}
                        strokeDashoffset={seg.strokeDashoffset}
                        strokeLinecap="butt"
                        className="donut-segment"
                        onMouseEnter={() => setActiveHoverSlice(seg)}
                        onMouseLeave={() => setActiveHoverSlice(null)}
                      />
                    );
                  })}
                </svg>

                {/* Donut Center Display */}
                <div className="donut-center-info">
                  {activeHoverSlice ? (
                    <>
                      <span className="donut-center-count" style={{ color: activeHoverSlice.color }}>
                        {activeHoverSlice.count}
                      </span>
                      <span className="donut-center-label">{activeHoverSlice.label}</span>
                      <span className="donut-center-percent">{activeHoverSlice.percent}%</span>
                    </>
                  ) : (
                    <>
                      <span className="donut-center-count">{total}</span>
                      <span className="donut-center-label">Total Leads</span>
                      <span className="donut-center-percent">{qualifiedRate}% Qualified</span>
                    </>
                  )}
                </div>
              </div>

              {/* Status Legend List */}
              <div className="donut-legend-list">
                {donutSegments.map((seg) => (
                  <div
                    key={seg.statusKey}
                    className={`legend-item ${activeHoverSlice?.statusKey === seg.statusKey ? 'hovered' : ''}`}
                    onMouseEnter={() => setActiveHoverSlice(seg)}
                    onMouseLeave={() => setActiveHoverSlice(null)}
                  >
                    <div className="legend-item-left">
                      <span className="legend-dot" style={{ backgroundColor: seg.color }} />
                      <span className="legend-name">{seg.label}</span>
                    </div>
                    <div className="legend-item-right">
                      <span className="legend-count">{seg.count}</span>
                      <span className="legend-percent">{seg.percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Acquisition Sources Bar Chart */}
        <div className="analytics-card">
          <div className="card-top-bar">
            <div>
              <h3 className="card-title">Acquisition Channels</h3>
              <p className="card-subtitle">Lead volume generated by acquisition source</p>
            </div>
            <span className="card-badge">{bySource.length} Sources</span>
          </div>

          {bySource.length === 0 ? (
            <div className="chart-empty-state">
              <span className="empty-icon">🌐</span>
              <p className="empty-text">No acquisition data available</p>
            </div>
          ) : (
            <div className="source-bars-container">
              {bySource.map(({ source, count }) => {
                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={source} className="source-bar-row">
                    <div className="source-bar-header">
                      <span className="source-name">{source}</span>
                      <div className="source-metrics">
                        <span className="source-count">{count} {count === 1 ? 'lead' : 'leads'}</span>
                        <span className="source-percent-pill">{percent}%</span>
                      </div>
                    </div>
                    <div className="source-progress-track">
                      <div
                        className="source-progress-fill"
                        style={{
                          width: `${percent}%`,
                          backgroundColor:
                            source === 'Website' ? '#4f46e5' :
                            source === 'Referral' ? '#0ea5e9' :
                            source === 'Social Media' ? '#8b5cf6' :
                            source === 'Email Campaign' ? '#06b6d4' :
                            source === 'Cold Call' ? '#f59e0b' : '#64748b'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Leads Activity Section */}
      <div className="recent-leads-section">
        <div className="section-header-bar">
          <div>
            <h3 className="section-heading">Recent Leads</h3>
            <p className="section-subheading">Latest leads captured across your sales channels</p>
          </div>
          <button className="btn-link" onClick={onNavigateToLeads}>
            <span>View All Leads</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {recentLeads.length === 0 ? (
          <div className="recent-leads-empty">
            <p className="empty-note">No recent lead activity yet.</p>
            <button className="btn-secondary-sm" onClick={onAddLead}>
              <PlusIcon size={14} />
              <span>Add Your First Lead</span>
            </button>
          </div>
        ) : (
          <div className="recent-leads-table-wrap">
            <table className="recent-leads-table">
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Company</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Date Added</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="recent-lead-row">
                    <td>
                      <div className="lead-identity">
                        <div className="lead-avatar-sm">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="lead-name-text">{lead.name}</div>
                          <div className="lead-email-sub">{lead.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="company-badge-wrap">
                        <BuildingIcon size={13} className="text-muted" />
                        <span>{lead.company}</span>
                      </div>
                    </td>
                    <td>
                      <span className="source-tag">{lead.source}</span>
                    </td>
                    <td>
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="date-cell">
                      {new Date(lead.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="text-right">
                      <button
                        className="btn-table-action"
                        onClick={() => onEditLead ? onEditLead(lead) : onNavigateToLeads()}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
