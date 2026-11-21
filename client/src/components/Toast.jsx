import { useToast } from '../hooks/useToast';

export function ToastContainer() {
  const { toasts } = useToast._store ?? { toasts: [] };
  return null; // Toasts are rendered via ToastPortal
}

export function ToastList({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.type}`}
          onClick={() => onRemove(t.id)}
          style={{ cursor: 'pointer' }}
        >
          <span>
            {t.type === 'success' && '✓ '}
            {t.type === 'error' && '✕ '}
            {t.message}
          </span>
        </div>
      ))}
    </div>
  );
}
