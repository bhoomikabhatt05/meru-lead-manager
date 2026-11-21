import { useState, useCallback } from 'react';
import { useLeads } from './hooks/useLeads';
import { useToast } from './hooks/useToast';
import { LeadsTable } from './components/LeadsTable';
import { LeadForm } from './components/LeadForm';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Dashboard } from './components/Dashboard';
import { Pagination } from './components/Pagination';
import { ToastList } from './components/Toast';
import { LEAD_STATUSES } from './utils';

export default function App() {
  const { leads, pagination, loading, error, filters, updateFilter, setSort, createLead, updateLead, deleteLead } = useLeads();
  const { toasts, addToast, removeToast } = useToast();

  const [activeTab, setActiveTab] = useState('leads'); // 'leads' | 'dashboard'
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [deletingLead, setDeletingLead] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
        addToast(`"${data.name}" updated successfully`, 'success');
      } else {
        await createLead(data);
        addToast(`"${data.name}" added successfully`, 'success');
      }
    } finally {
      setFormLoading(false);
    }
  }, [editingLead, createLead, updateLead, addToast]);

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setEditingLead(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingLead) return;
    setDeleteLoading(true);
    try {
      await deleteLead(deletingLead.id);
      addToast(`"${deletingLead.name}" deleted`, 'success');
      setDeletingLead(null);
    } catch (err) {
      addToast(err.message || 'Failed to delete lead', 'error');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingLead, deleteLead, addToast]);

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="app-header-brand">
          <div className="app-header-logo">M</div>
          <div>
            <div className="app-header-title">Meru Lead Manager</div>
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          Meru Technosoft
        </div>
      </header>

      {/* Main */}
      <main className="app-main">
        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
            onClick={() => setActiveTab('leads')}
          >
            Leads
          </button>
          <button
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' ? (
          <Dashboard />
        ) : (
          <>
            {/* Toolbar */}
            <div className="toolbar">
              <div className="toolbar-left">
                {/* Search */}
                <input
                  type="text"
                  className="input input-search"
                  placeholder="Search by name, email or company…"
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  aria-label="Search leads"
                />

                {/* Status Filter */}
                <select
                  className="select"
                  value={filters.status}
                  onChange={(e) => updateFilter('status', e.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="">All Statuses</option>
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                {/* Per-page selector */}
                <select
                  className="select"
                  value={filters.limit}
                  onChange={(e) => updateFilter('limit', Number(e.target.value))}
                  aria-label="Leads per page"
                  style={{ minWidth: 110 }}
                >
                  {[10, 25, 50].map((n) => (
                    <option key={n} value={n}>{n} per page</option>
                  ))}
                </select>

                {/* Clear filters */}
                {(filters.search || filters.status) && (
                  <button
                    className="btn btn-ghost"
                    onClick={() => { updateFilter('search', ''); updateFilter('status', ''); }}
                    title="Clear filters"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>

              <button className="btn btn-primary" onClick={handleAddClick}>
                + Add Lead
              </button>
            </div>

            {/* Table */}
            <LeadsTable
              leads={leads}
              loading={loading}
              error={error}
              filters={filters}
              onSort={setSort}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />

            {/* Pagination */}
            {pagination.total > 0 && (
              <Pagination
                pagination={pagination}
                onPageChange={(p) => updateFilter('page', p)}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {showForm && (
        <LeadForm
          lead={editingLead}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
          loading={formLoading}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deletingLead)}
        title="Delete Lead"
        message={
          <>
            Are you sure you want to delete{' '}
            <strong>{deletingLead?.name}</strong>?{' '}
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete Lead"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingLead(null)}
        loading={deleteLoading}
      />

      {/* Toasts */}
      <ToastList toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
