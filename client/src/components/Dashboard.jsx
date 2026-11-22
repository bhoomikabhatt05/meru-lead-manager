import { useState, useEffect } from 'react';
import { leadsApi } from '../api/leadsApi';
import { StatusBadge } from './StatusBadge';
import { ArrowUpRight, BuildingIcon, PlusIcon, ChevronRight } from './Icons';

const STATUS_CONFIG = {
  New: { label: 'New', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  Contacted: { label: 'Contacted', color: '#d97706', bg: '#fefce8', border: '#fef08a' },
  Qualified: { label: 'Qualified', color: '#059669', bg: '#ecfdf5', border: '#bbf7d0' },
  Lost: { label: 'Lost', color: '#e11d48', bg: '#fff1f2', border: '#fecaca' },
};

const SOURCE_COLORS = {
  Website: '#2563eb',
  Referral: '#0284c7',
  'Social Media': '#475569',
  'Email Campaign': '#0f766e',
  'Cold Call': '#d97706',
  Other: '#52525b',
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
        <p className="loading-text">Loading pipeline telemetry & deal flow…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error-banner">
        <span className="error-icon">⚠️</span>
        <div>
          <h4 className="error-title">Unable to load pipeline metrics</h4>
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
      {/* 1. Master Pipeline Flow & Health Banner */}
      <section className="pipeline-hero-banner" aria-label="Pipeline overview">
        {/* Left: Headline Metric & Velocity */}
        <div className="hero-metric-block">
          <div className="hero-kicker">
            <span className="hero-kicker-dot" />
            <span>SALES PIPELINE TELEMETRY</span>
          </div>
          <div className="hero-value-row">
            <span className="hero-large-number">{total}</span>
            <div className="hero-sub-stats">
              <span className="hero-stat-primary">{activePipelineCount} Active In Discussion</span>
              <span className="hero-conversion-badge">{qualifiedRate}% Conversion to Qualified</span>
            </div>
          </div>
          <button
            type="button"
            className="hero-view-all-btn"
            onClick={() => handleKpiClick('')}
          >
            <span>Open All Pipeline Leads</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        {/* Right: Flow Funnel Stepper (Interactive Direct Manipulation) */}
        <div className="pipeline-flow-funnel">
          <div className="funnel-header-label">DEAL PROGRESSION STAGES (CLICK TO FILTER)</div>
          <div className="funnel-steps-track">
            {/* Stage 1: New */}
            <div
              className="funnel-step-card stage-new"
              onClick={() => handleKpiClick('New')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleKpiClick('New')}
              role="button"
              tabIndex={0}
              aria-label={`New leads: ${newCount}. Click to filter.`}
              title="Click to view New leads"
            >
              <div className="step-indicator-row">
                <span className="step-dot" style={{ backgroundColor: '#2563eb' }} />
                <span className="step-name">New</span>
                <span className="step-share">{total > 0 ? Math.round((newCount / total) * 100) : 0}%</span>
              </div>
              <div className="step-count-val">{newCount}</div>
              <div className="step-desc">Awaiting first contact</div>
            </div>

            <span className="funnel-arrow">→</span>

            {/* Stage 2: Contacted */}
            <div
              className="funnel-step-card stage-contacted"
              onClick={() => handleKpiClick('Contacted')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleKpiClick('Contacted')}
              role="button"
              tabIndex={0}
              aria-label={`Contacted leads: ${contactedCount}. Click to filter.`}
              title="Click to view Contacted leads"
            >
              <div className="step-indicator-row">
                <span className="step-dot" style={{ backgroundColor: '#d97706' }} />
                <span className="step-name">Contacted</span>
                <span className="step-share">{total > 0 ? Math.round((contactedCount / total) * 100) : 0}%</span>
              </div>
              <div className="step-count-val">{contactedCount}</div>
              <div className="step-desc">Discovery in progress</div>
            </div>

            <span className="funnel-arrow">→</span>

            {/* Stage 3: Qualified */}
            <div
              className="funnel-step-card stage-qualified"
              onClick={() => handleKpiClick('Qualified')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleKpiClick('Qualified')}
              role="button"
              tabIndex={0}
              aria-label={`Qualified leads: ${qualifiedCount}. Click to filter.`}
              title="Click to view Qualified leads"
            >
              <div className="step-indicator-row">
                <span className="step-dot" style={{ backgroundColor: '#059669' }} />
                <span className="step-name">Qualified</span>
                <span className="step-share highlight">{qualifiedRate}%</span>
              </div>
              <div className="step-count-val text-forest">{qualifiedCount}</div>
              <div className="step-desc">Proposal & closing ready</div>
            </div>

            <span className="funnel-divider">|</span>

            {/* Stage 4: Lost */}
            <div
              className="funnel-step-card stage-lost"
              onClick={() => handleKpiClick('Lost')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleKpiClick('Lost')}
              role="button"
              tabIndex={0}
              aria-label={`Lost leads: ${lostCount}. Click to filter.`}
              title="Click to view Lost leads"
            >
              <div className="step-indicator-row">
                <span className="step-dot" style={{ backgroundColor: '#e11d48' }} />
                <span className="step-name">Lost</span>
                <span className="step-share">{total > 0 ? Math.round((lostCount / total) * 100) : 0}%</span>
              </div>
              <div className="step-count-val text-terracotta">{lostCount}</div>
              <div className="step-desc">Disqualified / churned</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Analytical Intelligence Row (Proportional & Visually Integrated) */}
      <section className="analytics-grid" aria-label="Pipeline charts">
        {/* Panel 1: Stage Volume & Proportions */}
        <div className="analytics-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Stage Distribution</h3>
              <p className="panel-subtitle">Current volume distribution across sales milestones</p>
            </div>
            <span className="panel-tag">{total} Records</span>
          </div>

          {total === 0 ? (
            <div className="panel-empty-box">
              <span className="empty-symbol">◎</span>
              <p className="empty-heading">No Deals in Pipeline</p>
              <p className="empty-caption">
                Add an inbound inquiry or import demonstration data to visualize stage distribution.
              </p>
              <button type="button" className="btn-warm-action" onClick={onAddLead}>
                <PlusIcon size={14} />
                <span>Create First Lead</span>
              </button>
            </div>
          ) : (
            <div className="donut-chart-layout">
              <div className="donut-visual-container">
                <svg className="donut-svg" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke="#e8e3d8"
                    strokeWidth="16"
                  />
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
                        strokeWidth={isHovered ? 22 : 16}
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

                <div
                  className="donut-center-info interactive-center"
                  onClick={() => handleKpiClick('')}
                  title="Click to view all leads"
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

        {/* Panel 2: Channel Acquisition Performance */}
        <div className="analytics-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Acquisition Channels</h3>
              <p className="panel-subtitle">Lead volume generated by acquisition channel</p>
            </div>
            <span className="panel-tag">{bySource.length} Active Channels</span>
          </div>

          {bySource.length === 0 ? (
            <div className="panel-empty-box">
              <span className="empty-symbol">☍</span>
              <p className="empty-heading">No Channel Data</p>
              <p className="empty-caption">
                Inbound channels will be tracked and benchmarked as leads enter the pipeline.
              </p>
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
                          backgroundColor: SOURCE_COLORS[source] || '#52525b',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 3. Pipeline Deal Ledger & Recent Activity */}
      <section className="recent-leads-section" aria-label="Recent lead activity">
        <div className="section-header-bar">
          <div>
            <h3 className="section-heading">Recent Deals Ledger</h3>
            <p className="section-subheading">Latest leads captured across your sales channels (Click row to inspect)</p>
          </div>
          <button type="button" className="btn-link" onClick={() => handleKpiClick('')}>
            <span>View Complete Ledger</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        {recentLeads.length === 0 ? (
          <div className="recent-leads-empty">
            <span className="empty-symbol">✎</span>
            <p className="empty-note">No recent lead activity recorded.</p>
            <button type="button" className="btn-warm-action" onClick={onAddLead}>
              <PlusIcon size={14} />
              <span>Add Your First Lead</span>
            </button>
          </div>
        ) : (
          <div className="recent-leads-table-wrap">
            <table className="recent-leads-table">
              <thead>
                <tr>
                  <th>Lead & Contact</th>
                  <th>Company</th>
                  <th>Acquisition Source</th>
                  <th>Status</th>
                  <th>Date Captured</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="recent-lead-row interactive-row"
                    onClick={() => (onSelectLead ? onSelectLead(lead) : handleKpiClick(''))}
                    title="Click to view details in drawer"
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
                        type="button"
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
      </section>
    </div>
  );
}
