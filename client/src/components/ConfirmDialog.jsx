import { CloseIcon, TrashIcon } from './Icons';

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Delete Lead',
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-blur" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="confirm-dialog-card" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header-row">
          <div className="dialog-warning-icon">
            <TrashIcon size={20} />
          </div>
          <button className="btn-modal-close" onClick={onCancel} disabled={loading} aria-label="Close">
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="dialog-body-content">
          <h3 className="dialog-title">{title}</h3>
          <p className="dialog-message">{message}</p>
        </div>

        <div className="dialog-actions-row">
          <button className="btn-modal-cancel" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="btn-danger-confirm" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <span className="btn-spinner" />
                <span>Deleting…</span>
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
