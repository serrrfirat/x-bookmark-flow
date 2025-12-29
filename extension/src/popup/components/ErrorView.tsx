import { useStore } from '../store/useStore';

interface ErrorViewProps {
  onRetry: () => void;
  onDismiss: () => void;
}

export function ErrorView({ onRetry, onDismiss }: ErrorViewProps) {
  const error = useStore((s) => s.error);

  return (
    <div className="flex flex-col items-center justify-center h-full py-12 animate-in">
      {/* Error icon */}
      <div className="w-16 h-16 mb-4 rounded-full bg-x-error/10 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-x-error"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      
      {/* Message */}
      <h2 className="text-lg font-semibold text-x-text mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-x-text-secondary text-center max-w-[280px] mb-6">
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </p>
      
      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onRetry} className="btn-primary">
          Try Again
        </button>
        <button onClick={onDismiss} className="btn-secondary">
          Dismiss
        </button>
      </div>
    </div>
  );
}

