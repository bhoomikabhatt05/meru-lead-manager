import { MenuIcon, PlusIcon, LogOutIcon } from './Icons';

export function Header({
  activeTab,
  onOpenSidebar,
  onAddLead,
  totalLeads = 0,
  user,
  onLogout,
}) {
  const titles = {
    dashboard: {
      category: 'Pipeline Intelligence',
      title: 'Deal Flow Telemetry',
      subtitle: 'Real-time performance metrics and stage progression velocity',
    },
    leads: {
      category: 'Sales Workbench',
      title: 'Lead Management Ledger',
      subtitle: `${totalLeads} total records in pipeline • Filter, search, and advance stage accounts`,
    },
  };

  const current = titles[activeTab] || titles.dashboard;
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className="app-top-header">
      <div className="header-left">
        <button className="mobile-menu-toggle" onClick={onOpenSidebar} aria-label="Open sidebar">
          <MenuIcon size={20} />
        </button>
        <div className="header-titles">
          <div className="header-breadcrumb">
            <span className="breadcrumb-category">{current.category}</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{current.title}</span>
          </div>
          <p className="header-page-subtitle">{current.subtitle}</p>
        </div>
      </div>

      <div className="header-right">
        <button type="button" className="btn-primary-lead" onClick={onAddLead}>
          <PlusIcon size={15} />
          <span>New Lead</span>
          <kbd className="header-kbd">N</kbd>
        </button>

        {user && (
          <div className="header-user-menu">
            <div className="header-avatar-circle" title={`Logged in as ${user.name} (${user.email})`}>
              {initials}
            </div>
            <button
              type="button"
              className="btn-header-logout"
              onClick={onLogout}
              title="Sign out of Meru CRM"
              aria-label="Log out"
            >
              <LogOutIcon size={13} />
              <span className="logout-text">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
