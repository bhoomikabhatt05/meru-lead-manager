import { CheckIcon, CloseIcon } from './Icons';

export function ToastList({ toasts, onRemove }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-viewport-portal" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`saas-toast-card ${toast.type}`}>
          <div className="toast-icon-wrap">
            {toast.type === 'success' ? (
              <CheckIcon size={14} className="toast-svg-icon" />
            ) : (
              <span className="toast-alert-mark">!</span>
            )}
          </div>
          <span className="toast-message-body">{toast.message}</span>
          <button
            className="toast-dismiss-button"
            onClick={() => onRemove(toast.id)}
            aria-label="Dismiss notification"
          >
            <CloseIcon size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
