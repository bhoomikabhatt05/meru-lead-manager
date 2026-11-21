import { ChevronRight } from './Icons';

export function Pagination({ pagination, onPageChange }) {
  const { total, page, limit, totalPages } = pagination;
  if (total === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  function getPages() {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (page <= 4) {
      pages.push(1, 2, 3, 4, 5, '…', totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '…', page - 1, page, page + 1, '…', totalPages);
    }
    return pages;
  }

  return (
    <div className="pagination-bar-wrapper">
      <div className="pagination-record-summary">
        Showing <span className="highlight-text">{start}–{end}</span> of <span className="highlight-text">{total}</span> leads
      </div>

      <div className="pagination-nav-group">
        <button
          className="btn-page-nav"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <span style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>
            <ChevronRight size={14} />
          </span>
          <span>Previous</span>
        </button>

        <div className="page-numbers-cluster">
          {getPages().map((p, idx) =>
            p === '…' ? (
              <span key={`ellipsis-${idx}`} className="page-ellipsis">
                …
              </span>
            ) : (
              <button
                key={p}
                className={`page-num-pill ${p === page ? 'current' : ''}`}
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          className="btn-page-nav"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
