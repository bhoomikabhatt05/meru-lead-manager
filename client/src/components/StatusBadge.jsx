export function StatusBadge({ status }) {
  const configs = {
    New: { label: 'New', className: 'status-badge-new' },
    Contacted: { label: 'Contacted', className: 'status-badge-contacted' },
    Qualified: { label: 'Qualified', className: 'status-badge-qualified' },
    Lost: { label: 'Lost', className: 'status-badge-lost' },
  };

  const current = configs[status] || configs.New;

  return (
    <span className={`status-badge ${current.className}`}>
      <span className="status-badge-dot" />
      <span className="status-badge-text">{current.label}</span>
    </span>
  );
}
