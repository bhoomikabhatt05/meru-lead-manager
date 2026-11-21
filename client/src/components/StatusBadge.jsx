export function StatusBadge({ status }) {
  const classMap = {
    'New': 'badge-New',
    'Contacted': 'badge-Contacted',
    'Qualified': 'badge-Qualified',
    'Proposal': 'badge-Proposal',
    'Negotiation': 'badge-Negotiation',
    'Closed Won': 'badge-ClosedWon',
    'Closed Lost': 'badge-ClosedLost',
  };

  return (
    <span className={`badge ${classMap[status] || 'badge-New'}`}>
      {status}
    </span>
  );
}
