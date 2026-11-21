import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import { useLeads } from './hooks/useLeads';
import { useToast } from './hooks/useToast';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LeadsTable } from './components/LeadsTable';
import { LeadForm } from './components/LeadForm';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Dashboard } from './components/Dashboard';
import { Pagination } from './components/Pagination';
import { ToastList } from './components/Toast';
import { LeadDetailDrawer } from './components/LeadDetailDrawer';
import { SearchIcon, CloseIcon } from './components/Icons';
import { LEAD_STATUSES, LEAD_SOURCES } from './utils';
import { leadsApi } from './api/leadsApi';

export default function App() {
  const { user, loading: authLoading, login, signup, logout } = useAuth();
  const { toasts, addToast, removeToast } = useToast();

  const {
    leads,
    pagination,
    loading,
    error,
    filters,
    updateFilter,
    setFilterBatch,
    resetFilters,
    setSort,
    createLead,
    updateLead,
    deleteLead,
    refresh,
  } = useLeads();

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'leads'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [deletingLead, setDeletingLead] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusCounts, setStatusCounts] = useState({});

  const searchInputRef = useRef(null);

  // Fetch status counts for sidebar and filters (only when authenticated)
  const fetchCounts = useCallback(async () => {
    if (!user) return;
    try {
      const stats = await leadsApi.getStats();
      if (stats && stats.byStatus) {
        setStatusCounts(stats.byStatus);
      }
    } catch {
      // Ignore background stats fetch errors
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCounts();
    }
  }, [fetchCounts, leads, user]);

  // Global keyboard shortcuts: 'N' for New Lead, '/' or 'Cmd+K' to focus search
  useEffect(() => {
    function handleKeyDown(e) {
      if (!user) return;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if (isInput) return;

      // 'N' for new lead
      if (e.key.toLowerCase() === 'n' && !showForm && !deletingLead && !selectedLead) {
        e.preventDefault();
        setEditingLead(null);
        setShowForm(true);
        return;
      }

      // '/' or 'Cmd+K' / 'Ctrl+K' to focus search
      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setActiveTab('leads');
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user, showForm, deletingLead, selectedLead]);

  // ---- Handlers ----
  const handleAddClick = useCallback(() => {
    setEditingLead(null);
    setShowForm(true);
  }, []);

  const handleEditClick = useCallback((lead) => {
    setEditingLead(lead);
    setShowForm(true);
  }, []);

  const handleDeleteClick = useCallback((lead) => {
    setDeletingLead(lead);
  }, []);

  const handleFormSubmit = useCallback(async (data) => {
    setFormLoading(true);
    try {
      if (editingLead) {
        const updated = await updateLead(editingLead.id, data);
        if (selectedLead && selectedLead.id === editingLead.id) {
          setSelectedLead(updated);
        }
        addToast(`Lead "${data.name}" updated successfully`, 'success');
      } else {
        await createLead(data);
        addToast(`Lead "${data.name}" created successfully`, 'success');
      }
      fetchCounts();
    } finally {
      setFormLoading(false);
    }
  }, [editingLead, selectedLead, createLead, updateLead, addToast, fetchCounts]);

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setEditingLead(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingLead) return;
    setDeleteLoading(true);
    try {
      await deleteLead(deletingLead.id);
      if (selectedLead && selectedLead.id === deletingLead.id) {
        setSelectedLead(null);
      }
      addToast(`Lead "${deletingLead.name}" deleted`, 'success');
      setDeletingLead(null);
      fetchCounts();
    } catch (err) {
      addToast(err.message || 'Failed to delete lead', 'error');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingLead, selectedLead, deleteLead, addToast, fetchCounts]);

  // Quick status update directly from the Progressive Disclosure drawer
  const handleQuickStatusChange = useCallback(async (id, newStatus) => {
    try {
      const updated = await updateLead(id, { status: newStatus });
      if (selectedLead && selectedLead.id === id) {
        setSelectedLead(updated);
      }
      addToast(`Status updated to "${newStatus}"`, 'success');
      fetchCounts();
    } catch (err) {
      addToast(err.message || 'Failed to update lead status', 'error');
    }
  }, [updateLead, selectedLead, addToast, fetchCounts]);

  // Direct navigation from Dashboard elements (KPI cards, donut, acquisition bars)
  const handleDashboardNavigate = useCallback((filterOverrides = {}) => {
    setActiveTab('leads');
    setFilterBatch(filterOverrides);
  }, [setFilterBatch]);

  // Quick filter from sidebar
  const handleStatusQuickFilter = useCallback((status) => {
    setActiveTab('leads');
    setFilterBatch({ status, source: '', search: '' });
  }, [setFilterBatch]);

  const handleLogout = useCallback(async () => {
    await logout();
    addToast('Signed out of Meru CRM', 'info');
  }, [logout, addToast]);

  // Splash loading screen while checking auth cookie
  if (authLoading) {
    return (
      <div className="auth-splash-screen">
        <div className="dashboard-spinner" />
        <p className="loading-text">Connecting to secure Meru CRM workspace…</p>
      </div>
    );
  }

  // Not authenticated: render clean login/signup screen
  if (!user) {
    return (
      <>
        <AuthScreen
          onLogin={async (email, pass) => {
            await login(email, pass);
            addToast('Welcome back to Meru CRM', 'success');
            refresh();
          }}
          onSignup={async (signupData) => {
            await signup(signupData);
            addToast('Account created successfully', 'success');
            refresh();
          }}
        />
        <ToastList toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  const statusTabItems = ['All', ...LEAD_STATUSES];

  return (
    <div className="crm-app-shell">
      {/* Refined Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        statusCounts={statusCounts}
        totalLeads={pagination.total}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onStatusQuickFilter={handleStatusQuickFilter}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="crm-main-viewport">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onAddLead={handleAddClick}
          totalLeads={pagination.total}
          user={user}
          onLogout={handleLogout}
        />

        {/* Scrollable Workspace Container */}
        <main className="crm-page-content">
          {activeTab === 'dashboard' ? (
            <Dashboard
              onNavigateToLeads={handleDashboardNavigate}
              onAddLead={handleAddClick}
              onEditLead={handleEditClick}
              onSelectLead={(lead) => setSelectedLead(lead)}
            />
          ) : (
            <div className="leads-view-wrapper">
              {/* Secondary Filter & Search Toolbar */}
              <div className="leads-action-toolbar">
                {/* Search Bar with Keyboard Hint */}
                <div className="search-bar-wrap">
                  <SearchIcon size={16} className="search-input-icon" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="lead-search-input"
                    placeholder="Search name, email, company, or phone…"
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    aria-label="Search leads"
                  />
                  {filters.search ? (
                    <button
                      className="search-clear-btn"
                      onClick={() => updateFilter('search', '')}
                      aria-label="Clear search"
                    >
                      <CloseIcon size={14} />
                    </button>
                  ) : (
                    <span className="search-shortcut-hint" title="Press / or ⌘K to search">/</span>
                  )}
                </div>

                {/* Status Segmented Pill Group */}
                <div className="status-pill-group" role="tablist" aria-label="Filter by status">
                  {statusTabItems.map((st) => {
                    const isAll = st === 'All';
                    const isSelected = isAll ? !filters.status : filters.status === st;
                    const count = isAll ? pagination.total : (statusCounts[st] || 0);

                    return (
                      <button
                        key={st}
                        className={`status-pill-tab ${isSelected ? 'active' : ''}`}
                        onClick={() => updateFilter('status', isAll ? '' : st)}
                        role="tab"
                        aria-selected={isSelected}
                      >
                        <span className="pill-text">{st}</span>
                        {count > 0 && <span className="pill-badge">{count}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Source Filter Dropdown */}
                <div className="source-filter-wrap">
                  <select
                    className={`select-source-filter ${filters.source ? 'active-filter' : ''}`}
                    value={filters.source || ''}
                    onChange={(e) => updateFilter('source', e.target.value)}
                    aria-label="Filter by acquisition source"
                  >
                    <option value="">All Acquisition Channels</option>
                    {LEAD_SOURCES.map((src) => (
                      <option key={src} value={src}>{src}</option>
                    ))}
                  </select>
                </div>

                {/* Per-Page Selector */}
                <div className="pagination-limit-wrap">
                  <span className="limit-label">Show:</span>
                  <select
                    className="select-page-size"
                    value={filters.limit}
                    onChange={(e) => updateFilter('limit', Number(e.target.value))}
                    aria-label="Records per page"
                  >
                    {[10, 25, 50].map((n) => (
                      <option key={n} value={n}>{n} rows</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Filter Tags with Single-Click Clear */}
              {(filters.search || filters.status || filters.source) && (
                <div className="active-filters-bar">
                  <span className="active-filters-label">Active Filters:</span>
                  {filters.status && (
                    <span className="active-filter-tag">
                      Status: <strong>{filters.status}</strong>
                      <button
                        className="btn-remove-tag"
                        onClick={() => updateFilter('status', '')}
                        aria-label={`Remove ${filters.status} status filter`}
                      >
                        <CloseIcon size={11} />
                      </button>
                    </span>
                  )}
                  {filters.source && (
                    <span className="active-filter-tag">
                      Source: <strong>{filters.source}</strong>
                      <button
                        className="btn-remove-tag"
                        onClick={() => updateFilter('source', '')}
                        aria-label={`Remove ${filters.source} source filter`}
                      >
                        <CloseIcon size={11} />
                      </button>
                    </span>
                  )}
                  {filters.search && (
                    <span className="active-filter-tag">
                      Search: "<strong>{filters.search}</strong>"
                      <button
                        className="btn-remove-tag"
                        onClick={() => updateFilter('search', '')}
                        aria-label="Remove search query"
                      >
                        <CloseIcon size={11} />
                      </button>
                    </span>
                  )}
                  <button className="btn-clear-all-tags" onClick={resetFilters}>
                    Clear All
                  </button>
                </div>
              )}

              {/* Data Table */}
              <LeadsTable
                leads={leads}
                loading={loading}
                error={error}
                filters={filters}
                onSort={setSort}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onSelectLead={(lead) => setSelectedLead(lead)}
                onClearFilters={resetFilters}
                onAddLead={handleAddClick}
              />

              {/* Pagination Controls */}
              {pagination.total > 0 && (
                <Pagination
                  pagination={pagination}
                  onPageChange={(p) => updateFilter('page', p)}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Progressive Disclosure: Lead Details Drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        isOpen={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onStatusChange={handleQuickStatusChange}
      />

      {/* Slide-over / Modal Lead Form */}
      {showForm && (
        <LeadForm
          lead={editingLead}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
          loading={formLoading}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingLead)}
        title="Delete Lead Record"
        message={
          <>
            Are you sure you want to permanently delete <strong>{deletingLead?.name}</strong> from <strong>{deletingLead?.company}</strong>? All associated contact logs and history will be removed.
          </>
        }
        confirmLabel="Delete Permanently"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingLead(null)}
        loading={deleteLoading}
      />

      {/* Floating Notifications */}
      <ToastList toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
