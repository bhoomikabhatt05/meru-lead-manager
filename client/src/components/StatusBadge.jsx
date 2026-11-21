export function StatusBadge({ status }) {
  const classMap = {
    'New': 'badge-New',
    'Contacted': 'badge-Contacted',
    'Qualified': 'badge-Qualified',
    'Lost': 'badge-Lost',
  };

  return (
    <span className={`badge ${classMap[status] || 'badge-New'}`}>
      {status}
    </span>
  );
}
