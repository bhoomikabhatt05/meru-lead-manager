import { useState, useEffect } from 'react';
import { leadsApi } from '../api/leadsApi';
import { StatusBadge } from './StatusBadge';
import { ArrowUpRight, BuildingIcon, PlusIcon } from './Icons';

const STATUS_CONFIG = {
  New: { label: 'New', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  Contacted: { label: 'Contacted', color: '#f59e0b', border: '#fef08a' },
  Qualified: { label: 'Qualified', color: '#10b981', border: '#bbf7d0' },
  Lost: { label: 'Lost', color: '#ef4444', border: '#fecaca' },
};

const ORDERED_STATUSES = ['New', 'Contacted', 'Qualified', 'Lost'];

export function Dashboard({ onNavigateToLeads, onAddLead, onEditLead, onSelectLead }) {
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

  // Direct manipulation helper for KPI navigation
  const handleKpiClick = (statusFilter = '') => {
    if (onNavigateToLeads) {
      onNavigateToLeads({ status: statusFilter, source: '', search: '' });
    }
  };

  const handleSourceClick = (sourceFilter) => {
    if (onNavigateToLeads) {
      onNavigateToLeads({ source: sourceFilter, status: '', search: '' });
    }
  };

  return (
    <div className="dashboard-container">
      {/* KPI Highlight Cards - Fully Interactive per Apple HIG */}
      <div className="kpi-grid">
        {/* Card 1: Total Leads */}
        <div
          className="kpi-card highlight interactive"
          onClick={() => handleKpiClick('')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleKpiClick('')}
          role="button"
          tabIndex={0}
          aria-label={`Total leads: ${total}. Click to view all leads with filters cleared.`}
          title="Click to view all leads"
        >
          <div className="kpi-header">
            <span className="kpi-label">TOTAL LEADS</span>
            <span className="kpi-action-hint">View all →</span>
          </div>
          <div className="kpi-value-wrap">
            <span className="kpi-value">{total}</span>
            <span className="kpi-subtext">{activePipelineCount} active in pipeline</span>
          </div>
          <div className="kpi-progress-bar">
            <div className="kpi-progress-fill" style={{ width: `${Math.min(100, (total / 20) * 100)}%` }} />
          </div>
        </div>

        {/* Card 2: New Leads */}
        <div
          className="kpi-card interactive"
          onClick={() => handleKpiClick('New')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleKpiClick('New')}
          role="button"
          tabIndex={0}
          aria-label={`New leads: ${newCount}. Click to view new leads.`}
          title="Click to filter by New status"
        >
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

        {/* Card 3: Contacted */}
        <div
          className="kpi-card interactive"
          onClick={() => handleKpiClick('Contacted')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleKpiClick('Contacted')}
          role="button"
          tabIndex={0}
          aria-label={`Contacted leads: ${contactedCount}. Click to view contacted leads.`}
          title="Click to filter by Contacted status"
        >
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

        {/* Card 4: Qualified */}
        <div
          className="kpi-card interactive"
          onClick={() => handleKpiClick('Qualified')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleKpiClick('Qualified')}
          role="button"
          tabIndex={0}
          aria-label={`Qualified leads: ${qualifiedCount}. Click to view qualified leads.`}
          title="Click to filter by Qualified status"
        >
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

        {/* Card 5: Lost */}
        <div
          className="kpi-card interactive"
          onClick={() => handleKpiClick('Lost')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleKpiClick('Lost')}
          role="button"
          tabIndex={0}
          aria-label={`Lost leads: ${lostCount}. Click to view lost leads.`}
          title="Click to filter by Lost status"
        >
          <div className="kpi-header">
            <span className="kpi-label">LOST</span>
            <span className="status-pill-indicator lost">Lost</span>
          </div>
          <div className="kpi-value-wrap">
            <span className="kpi-value text-rose">{lostCount}</span>
            <span className="kpi-subtext">Disqualified / closed</span>
          </div>
          <div className="kpi-sub-meter">
            <span className="meter-label">Loss Rate</span>
            <span className="meter-value text-rose">{total > 0 ? Math.round((lostCount / total) * 100) : 0}%</span>
          </div>
        </div>
      </div>

      {/* Analytics Visualizations Grid */}
      <div className="analytics-grid">
        {/* Status Distribution Donut Chart - Clickable Segments & Legend */}
        <div className="analytics-card">
          <div className="card-top-bar">
            <div>
              <h3 className="card-title">Status Distribution</h3>
              <p className="card-subtitle">Click any segment or stage to filter the pipeline</p>
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

                  {/* Dynamic Arc Segments - Clickable */}
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
                        strokeWidth={isHovered ? 24 : 18}
                        strokeDasharray={seg.strokeDasharray}
                        strokeDashoffset={seg.strokeDashoffset}
                        strokeLinecap="butt"
                        className="donut-segment interactive-slice"
                        onClick={() => handleKpiClick(seg.statusKey)}
                        onMouseEnter={() => setActiveHoverSlice(seg)}
                        onMouseLeave={() => setActiveHoverSlice(null)}
                        role="button"
                        aria-label={`${seg.label}: ${seg.count} leads (${seg.percent}%). Click to filter.`}
                      />
                    );
                  })}
                </svg>

                {/* Donut Center Display */}
                <div
                  className="donut-center-info interactive-center"
                  onClick={() => handleKpiClick('')}
                  title="Click to view all leads"
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                >
                  {activeHoverSlice ? (
                    <>
                      <span className="donut-center-count" style={{ color: activeHoverSlice.color }}>
                        {activeHoverSlice.count}
                      </span>
                      <span className="donut-center-label">{activeHoverSlice.label}</span>
                      <span className="donut-center-percent">{activeHoverSlice.percent}% (Click)</span>
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

              {/* Status Legend List - Clickable */}
              <div className="donut-legend-list">
                {donutSegments.map((seg) => (
                  <div
                    key={seg.statusKey}
                    className={`legend-item interactive ${activeHoverSlice?.statusKey === seg.statusKey ? 'hovered' : ''}`}
                    onClick={() => handleKpiClick(seg.statusKey)}
                    onMouseEnter={() => setActiveHoverSlice(seg)}
                    onMouseLeave={() => setActiveHoverSlice(null)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleKpiClick(seg.statusKey)}
                    aria-label={`Filter by ${seg.label}: ${seg.count} leads`}
                    title={`Filter leads by ${seg.label}`}
                  >
                    <div className="legend-item-left">
                      <span className="legend-dot" style={{ backgroundColor: seg.color }} />
                      <span className="legend-name">{seg.label}</span>
                    </div>
                    <div className="legend-item-right">
                      <span className="legend-count">{seg.count}</span>
                      <span className="legend-percent">{seg.percent}%</span>
                      <span className="legend-arrow">→</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Acquisition Sources Bar Chart - Clickable Rows */}
        <div className="analytics-card">
          <div className="card-top-bar">
            <div>
              <h3 className="card-title">Acquisition Channels</h3>
              <p className="card-subtitle">Click any channel to view leads from that source</p>
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
                  <div
                    key={source}
                    className="source-bar-row interactive"
                    onClick={() => handleSourceClick(source)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSourceClick(source)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Channel: ${source}, ${count} leads (${percent}%). Click to filter.`}
                    title={`Click to filter leads by source: ${source}`}
                  >
                    <div className="source-bar-header">
                      <div className="source-name-wrap">
                        <span className="source-name">{source}</span>
                        <span className="source-filter-badge">Filter →</span>
                      </div>
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
          <button className="btn-link" onClick={() => handleKpiClick('')}>
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
                  <tr
                    key={lead.id}
                    className="recent-lead-row interactive-row"
                    onClick={() => (onSelectLead ? onSelectLead(lead) : handleKpiClick(''))}
                    title="Click to view details"
                  >
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
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-table-action"
                        onClick={() => onEditLead ? onEditLead(lead) : handleKpiClick('')}
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
