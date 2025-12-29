import { clsx } from 'clsx';

interface HeaderProps {
  onReset?: () => void;
}

export function Header({ onReset }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-x-border">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-x-accent to-blue-600 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </div>
        <div>
          <h1 className="font-bold text-x-text text-sm">X Bookmarks</h1>
          <p className="text-xs text-x-text-secondary">Intelligence</p>
        </div>
      </div>
      
      {onReset && (
        <button
          onClick={onReset}
          className={clsx(
            'p-2 rounded-full transition-colors',
            'hover:bg-x-bg-secondary text-x-text-secondary hover:text-x-text',
          )}
          title="Start over"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      )}
    </header>
  );
}

