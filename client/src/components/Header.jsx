import { MenuIcon, PlusIcon } from './Icons';

export function Header({
  activeTab,
  onOpenSidebar,
  onAddLead,
  totalLeads = 0,
}) {
  const titles = {
    dashboard: {
      title: 'Sales Dashboard',
      subtitle: 'Real-time performance metrics and pipeline conversion analysis',
    },
    leads: {
      title: 'Lead Management',
      subtitle: `${totalLeads} total records in pipeline • Filter, search, and update accounts`,
    },
  };

  const current = titles[activeTab] || titles.dashboard;

  return (
    <header className="app-top-header">
      <div className="header-left">
        <button className="mobile-menu-toggle" onClick={onOpenSidebar} aria-label="Open sidebar">
          <MenuIcon size={20} />
        </button>
        <div className="header-titles">
          <h1 className="header-page-title">{current.title}</h1>
          <p className="header-page-subtitle">{current.subtitle}</p>
        </div>
      </div>

      <div className="header-right">
        <button className="btn-primary-lead" onClick={onAddLead}>
          <PlusIcon size={16} />
          <span>New Lead</span>
          <kbd className="header-kbd">N</kbd>
        </button>
      </div>
    </header>
  );
}
