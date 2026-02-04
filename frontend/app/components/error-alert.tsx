type ErrorAlertProps = {
  /** Error message to display */
  message: string;
  /** Optional title (e.g. "Erreur") */
  title?: string;
  /** Optional callback to dismiss/clear the error */
  onDismiss?: () => void;
  /** Additional class names */
  className?: string;
};

export default function ErrorAlert({
  message,
  title,
  onDismiss,
  className = '',
}: ErrorAlertProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {title && (
            <p className="mb-0.5 font-medium text-red-300">{title}</p>
          )}
          <p className="text-sm">{message}</p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded p-1 text-red-400 transition hover:bg-red-500/20 hover:text-red-200 focus:outline-none focus:ring-2 focus:ring-red-400/50"
            aria-label="Fermer"
          >
            <span aria-hidden>×</span>
          </button>
        )}
      </div>
    </div>
  );
}
