import { StatusBadge } from './StatusBadge';
import { LEAD_STATUSES } from '../utils';

const SORT_COLUMNS = [
  { key: 'name', label: 'Name / Email' },
  { key: 'company', label: 'Company' },
  { key: 'source', label: 'Source' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Created' },
];

function SortIcon({ active, order }) {
  if (!active) return <span className="sort-indicator">↕</span>;
  return <span className="sort-indicator">{order === 'asc' ? '↑' : '↓'}</span>;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function LeadsTable({ leads, loading, error, filters, onSort, onEdit, onDelete }) {
  if (error) {
    return (
      <div className="table-wrapper">
        <div className="state-container">
          <div className="state-icon">⚠️</div>
          <div className="state-title">Failed to load leads</div>
          <div className="state-desc">{error}</div>
        </div>
      </div>
    );
  }

  if (loading && leads.length === 0) {
    return (
      <div className="table-wrapper">
        <div className="state-container">
          <div className="spinner" />
          <div className="state-desc">Loading leads…</div>
        </div>
      </div>
    );
  }

  if (!loading && leads.length === 0) {
    const isFiltered = filters.search || filters.status;
    return (
      <div className="table-wrapper">
        <div className="state-container">
          <div className="state-icon">{isFiltered ? '🔍' : '📋'}</div>
          <div className="state-title">
            {isFiltered ? 'No leads match your filters' : 'No leads yet'}
          </div>
          <div className="state-desc">
            {isFiltered
              ? 'Try adjusting your search or filter.'
              : 'Add your first lead to get started.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrapper" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
      <table className="table">
        <thead>
          <tr>
            {SORT_COLUMNS.map(({ key, label }) => {
              const isActive = filters.sortBy === key;
              return (
                <th
                  key={key}
                  className={`sortable ${isActive ? 'sorted' : ''}`}
                  onClick={() => onSort(key)}
                  title={`Sort by ${label}`}
                >
                  {label}
                  <SortIcon active={isActive} order={filters.sortOrder} />
                </th>
              );
            })}
            <th style={{ width: 90 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td>
                <div className="cell-name">{lead.name}</div>
                <div className="cell-email">{lead.email}</div>
                {lead.phone && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 1 }}>
                    {lead.phone}
                  </div>
                )}
              </td>
              <td>{lead.company}</td>
              <td className="text-secondary">{lead.source}</td>
              <td>
                <StatusBadge status={lead.status} />
              </td>
              <td className="text-secondary" style={{ fontSize: '0.83rem' }}>
                {formatDate(lead.created_at)}
              </td>
              <td>
                <div className="cell-actions">
                  <button
                    className="btn-icon edit"
                    onClick={() => onEdit(lead)}
                    title="Edit lead"
                    aria-label={`Edit ${lead.name}`}
                  >
                    ✎
                  </button>
                  <button
                    className="btn-icon delete"
                    onClick={() => onDelete(lead)}
                    title="Delete lead"
                    aria-label={`Delete ${lead.name}`}
                  >
                    ✕
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
