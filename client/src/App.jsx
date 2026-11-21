import { useState, useCallback, useEffect } from 'react';
import { useLeads } from './hooks/useLeads';
import { useToast } from './hooks/useToast';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LeadsTable } from './components/LeadsTable';
import { LeadForm } from './components/LeadForm';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Dashboard } from './components/Dashboard';
import { Pagination } from './components/Pagination';
import { ToastList } from './components/Toast';
import { SearchIcon, CloseIcon } from './components/Icons';
import { LEAD_STATUSES } from './utils';
import { leadsApi } from './api/leadsApi';

export default function App() {
  const {
    leads,
    pagination,
    loading,
    error,
    filters,
    updateFilter,
    setSort,
    createLead,
    updateLead,
    deleteLead,
    refresh,
  } = useLeads();

  const { toasts, addToast, removeToast } = useToast();

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'leads'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [deletingLead, setDeletingLead] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusCounts, setStatusCounts] = useState({});

  // Fetch status counts for sidebar and filters
  const fetchCounts = useCallback(async () => {
    try {
      const stats = await leadsApi.getStats();
      if (stats && stats.byStatus) {
        setStatusCounts(stats.byStatus);
      }
    } catch {
      // Ignore background stats fetch errors
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts, leads]);

  // Global keyboard shortcut: 'N' to open New Lead modal
  useEffect(() => {
    function handleKeyDown(e) {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if (e.key.toLowerCase() === 'n' && !isInput && !showForm && !deletingLead) {
        e.preventDefault();
        setEditingLead(null);
        setShowForm(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForm, deletingLead]);

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
        await updateLead(editingLead.id, data);
        addToast(`Lead "${data.name}" updated successfully`, 'success');
      } else {
        await createLead(data);
        addToast(`Lead "${data.name}" created successfully`, 'success');
      }
      fetchCounts();
    } finally {
      setFormLoading(false);
    }
  }, [editingLead, createLead, updateLead, addToast, fetchCounts]);

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setEditingLead(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingLead) return;
    setDeleteLoading(true);
    try {
      await deleteLead(deletingLead.id);
      addToast(`Lead "${deletingLead.name}" deleted`, 'success');
      setDeletingLead(null);
      fetchCounts();
    } catch (err) {
      addToast(err.message || 'Failed to delete lead', 'error');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingLead, deleteLead, addToast, fetchCounts]);

  // Quick filter from sidebar
  const handleStatusQuickFilter = useCallback((status) => {
    setActiveTab('leads');
    updateFilter('status', status);
  }, [updateFilter]);

  const handleClearFilters = useCallback(() => {
    updateFilter('search', '');
    updateFilter('status', '');
  }, [updateFilter]);

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
      />

      {/* Main Content Area */}
      <div className="crm-main-viewport">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onAddLead={handleAddClick}
          totalLeads={pagination.total}
        />

        {/* Scrollable Workspace Container */}
        <main className="crm-page-content">
          {activeTab === 'dashboard' ? (
            <Dashboard
              onNavigateToLeads={() => setActiveTab('leads')}
              onAddLead={handleAddClick}
              onEditLead={handleEditClick}
            />
          ) : (
            <div className="leads-view-wrapper">
              {/* Secondary Filter & Search Toolbar */}
              <div className="leads-action-toolbar">
                {/* Search Bar */}
                <div className="search-bar-wrap">
                  <SearchIcon size={16} className="search-input-icon" />
                  <input
                    type="text"
                    className="lead-search-input"
                    placeholder="Search by name, email, or company…"
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    aria-label="Search leads"
                  />
                  {filters.search && (
                    <button
                      className="search-clear-btn"
                      onClick={() => updateFilter('search', '')}
                      aria-label="Clear search"
                    >
                      <CloseIcon size={14} />
                    </button>
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

                {/* Clear all active filters */}
                {(filters.search || filters.status) && (
                  <button className="btn-clear-filters" onClick={handleClearFilters}>
                    <CloseIcon size={13} />
                    <span>Reset Filters</span>
                  </button>
                )}
              </div>

              {/* Data Table */}
              <LeadsTable
                leads={leads}
                loading={loading}
                error={error}
                filters={filters}
                onSort={setSort}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onClearFilters={handleClearFilters}
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
