import { StatusBadge } from './StatusBadge';
import { EditIcon, TrashIcon, BuildingIcon, MailIcon, PhoneIcon, SortIcon, SearchIcon, PlusIcon } from './Icons';

const COLUMNS = [
  { key: 'name', label: 'Lead & Contact', sortable: true },
  { key: 'company', label: 'Company', sortable: true },
  { key: 'source', label: 'Acquisition Source', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'created_at', label: 'Created Date', sortable: true },
];

export function LeadsTable({
  leads,
  loading,
  error,
  filters,
  onSort,
  onEdit,
  onDelete,
  onClearFilters,
  onAddLead,
}) {
  if (error) {
    return (
      <div className="table-card-container">
        <div className="table-state-box error">
          <span className="state-icon">⚠️</span>
          <h3 className="state-title">Failed to load leads</h3>
          <p className="state-message">{error}</p>
          <button className="btn-secondary-sm" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading && leads.length === 0) {
    return (
      <div className="table-card-container">
        <div className="table-skeleton-wrap">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-row">
              <div className="skeleton-cell w-30" />
              <div className="skeleton-cell w-20" />
              <div className="skeleton-cell w-15" />
              <div className="skeleton-cell w-15" />
              <div className="skeleton-cell w-10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!loading && leads.length === 0) {
    const isFiltered = Boolean(filters.search || filters.status);
    return (
      <div className="table-card-container">
        <div className="table-state-box empty">
          <div className="state-icon-circle">
            {isFiltered ? <SearchIcon size={24} /> : <PlusIcon size={24} />}
          </div>
          <h3 className="state-title">
            {isFiltered ? 'No matching leads found' : 'No leads in your pipeline yet'}
          </h3>
          <p className="state-message">
            {isFiltered
              ? `No records match "${filters.search || filters.status}". Try adjusting your search term or filter.`
              : 'Start building your sales pipeline by adding your first lead or importing demonstration data.'}
          </p>
          {isFiltered ? (
            <button className="btn-secondary-sm" onClick={onClearFilters}>
              Clear Search & Filter
            </button>
          ) : (
            <button className="btn-primary-lead" onClick={onAddLead}>
              <PlusIcon size={15} />
              <span>Add First Lead</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="table-card-container">
      <div className="table-scroll-container">
        <table className="leads-data-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => {
                const isActiveSort = filters.sortBy === col.key;
                return (
                  <th
                    key={col.key}
                    className={`table-header-cell ${col.sortable ? 'sortable' : ''} ${isActiveSort ? 'active-sort' : ''}`}
                    onClick={() => col.sortable && onSort(col.key)}
                  >
                    <div className="header-cell-content">
                      <span>{col.label}</span>
                      {col.sortable && (
                        <span className={`sort-caret ${isActiveSort ? filters.sortOrder : ''}`}>
                          <SortIcon size={13} />
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
              <th className="table-header-cell text-right" style={{ width: 100 }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="lead-table-row">
                {/* Lead Name & Email */}
                <td>
                  <div className="lead-name-cell">
                    <div className="lead-avatar-circle">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="lead-identity-text">
                      <span className="lead-fullname">{lead.name}</span>
                      <div className="lead-contact-line">
                        <span className="contact-item">
                          <MailIcon size={12} className="contact-icon" />
                          <span className="contact-text">{lead.email}</span>
                        </span>
                        {lead.phone && (
                          <span className="contact-item phone">
                            <PhoneIcon size={12} className="contact-icon" />
                            <span className="contact-text">{lead.phone}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Company */}
                <td>
                  <div className="company-cell-badge">
                    <BuildingIcon size={14} className="company-icon" />
                    <span className="company-name">{lead.company}</span>
                  </div>
                </td>

                {/* Source */}
                <td>
                  <span className="source-pill">{lead.source}</span>
                </td>

                {/* Status */}
                <td>
                  <StatusBadge status={lead.status} />
                </td>

                {/* Date */}
                <td>
                  <span className="created-date-text">
                    {new Date(lead.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </td>

                {/* Actions */}
                <td className="text-right">
                  <div className="row-action-buttons">
                    <button
                      className="btn-action-icon edit"
                      onClick={() => onEdit(lead)}
                      title="Edit Lead"
                      aria-label={`Edit ${lead.name}`}
                    >
                      <EditIcon size={14} />
                    </button>
                    <button
                      className="btn-action-icon delete"
                      onClick={() => onDelete(lead)}
                      title="Delete Lead"
                      aria-label={`Delete ${lead.name}`}
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
