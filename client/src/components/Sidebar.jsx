import { DashboardIcon, LeadsIcon, CloseIcon, LogOutIcon } from './Icons';

export function Sidebar({
  activeTab,
  onTabChange,
  statusCounts = {},
  totalLeads = 0,
  isOpen = false,
  onClose,
  onStatusQuickFilter,
  user,
  onLogout,
}) {
  const statuses = [
    { key: 'New', label: 'New', color: 'var(--status-new-dot)', bg: 'var(--status-new-subtle)' },
    { key: 'Contacted', label: 'Contacted', color: 'var(--status-contacted-dot)', bg: 'var(--status-contacted-subtle)' },
    { key: 'Qualified', label: 'Qualified', color: 'var(--status-qualified-dot)', bg: 'var(--status-qualified-subtle)' },
    { key: 'Lost', label: 'Lost', color: 'var(--status-lost-dot)', bg: 'var(--status-lost-subtle)' },
  ];

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />
      )}

      <aside className={`app-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Brand / Logo */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">M</div>
            <div className="brand-text-wrap">
              <span className="brand-title">Meru CRM</span>
              <span className="brand-subtitle">Lead Pipeline</span>
            </div>
          </div>
          {onClose && (
            <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
              <CloseIcon size={18} />
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <div className="sidebar-content">
          <div className="nav-group">
            <div className="nav-group-label">OVERVIEW</div>
            <nav className="nav-list">
              <button
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => {
                  onTabChange('dashboard');
                  if (onClose) onClose();
                }}
              >
                <DashboardIcon className="nav-icon" size={17} />
                <span className="nav-label">Dashboard</span>
              </button>

              <button
                className={`nav-item ${activeTab === 'leads' ? 'active' : ''}`}
                onClick={() => {
                  onTabChange('leads');
                  if (onClose) onClose();
                }}
              >
                <LeadsIcon className="nav-icon" size={17} />
                <span className="nav-label">All Leads</span>
                {totalLeads > 0 && (
                  <span className="nav-badge">{totalLeads}</span>
                )}
              </button>
            </nav>
          </div>

          {/* Quick Status Filters */}
          <div className="nav-group">
            <div className="nav-group-label">PIPELINE STAGES</div>
            <div className="stage-quick-filters">
              {statuses.map(({ key, label, color }) => {
                const count = statusCounts[key] || 0;
                return (
                  <button
                    key={key}
                    className="stage-filter-item"
                    onClick={() => {
                      if (onStatusQuickFilter) onStatusQuickFilter(key);
                      if (onClose) onClose();
                    }}
                  >
                    <span className="stage-dot" style={{ backgroundColor: color }} />
                    <span className="stage-name">{label}</span>
                    <span className="stage-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer / User Profile & Database Status */}
        <div className="sidebar-footer">
          {user ? (
            <div className="sidebar-user-card">
              <div className="user-profile-badge">
                <div className="user-avatar">{initials}</div>
                <div className="user-details">
                  <span className="user-name">{user.name}</span>
                  <span className="workspace-name">{user.email}</span>
                </div>
              </div>
              <button
                className="btn-sidebar-logout"
                onClick={onLogout}
                title="Log out"
                aria-label="Log out"
              >
                <LogOutIcon size={14} />
              </button>
            </div>
          ) : (
            <div className="user-profile-badge">
              <div className="user-avatar">M</div>
              <div className="user-details">
                <span className="user-name">Meru CRM</span>
                <span className="workspace-name">Sales Team</span>
              </div>
            </div>
          )}

          <div className="db-status-pill" title="Persistent SQLite database via node:sqlite">
            <span className="db-status-dot" />
            <span>SQLite Active</span>
          </div>
        </div>
      </aside>
    </>
  );
}
