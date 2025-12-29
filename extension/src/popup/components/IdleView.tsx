import type { ProcessingMode } from '../../../../shared/src/types';

interface IdleViewProps {
  onStartScan: () => void;
  onOpenHistory: () => void;
  onClearData: () => void;
  mode: ProcessingMode;
  onModeChange: (mode: ProcessingMode) => void;
  scrapeLimit: number;
  onScrapeLimitChange: (limit: number) => void;
}

export function IdleView({ onStartScan, onOpenHistory, onClearData, mode, onModeChange, scrapeLimit, onScrapeLimitChange }: IdleViewProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-8 animate-in">
      {/* Illustration */}
      <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-x-accent/20 to-blue-600/20 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-x-accent"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      </div>

      {/* Text */}
      <h2 className="text-xl font-bold text-x-text mb-2">
        transform your bookmarks
      </h2>
      <p className="text-x-text-secondary text-center max-w-[280px] mb-6">
        turn your saved tweets into structured insights and shareable content with ai
      </p>

      {/* Mode Selector */}
      <div className="flex gap-2 mb-6 p-1 bg-x-bg-secondary rounded-lg">
        <button
          onClick={() => onModeChange('twitter')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            mode === 'twitter'
              ? 'bg-x-accent text-white'
              : 'text-x-text-secondary hover:text-x-text'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            twitter posts
          </div>
        </button>
        <button
          onClick={() => onModeChange('research')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            mode === 'research'
              ? 'bg-x-accent text-white'
              : 'text-x-text-secondary hover:text-x-text'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            research doc
          </div>
        </button>
      </div>

      {/* Mode description */}
      <p className="text-xs text-x-text-secondary text-center max-w-[260px] mb-4">
        {mode === 'twitter'
          ? 'creates shareable twitter posts from your bookmarks'
          : 'creates a structured markdown doc about tools & resources'}
      </p>

      {/* Scrape limit */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm text-x-text-secondary">bookmarks to scan:</label>
        <input
          type="number"
          min="1"
          max="100"
          value={scrapeLimit}
          onChange={(e) => onScrapeLimitChange(Math.max(1, Math.min(100, parseInt(e.target.value) || 10)))}
          className="w-16 px-2 py-1 text-center text-sm bg-x-bg-secondary border border-x-border rounded-md text-x-text focus:outline-none focus:ring-1 focus:ring-x-accent"
        />
      </div>

      {/* CTA */}
      <button
        onClick={onStartScan}
        className="btn-primary text-base px-8 py-3 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        scan bookmarks
      </button>

      {/* Secondary buttons */}
      <div className="flex gap-4 mt-4">
        <button
          onClick={onOpenHistory}
          className="btn-ghost text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          history
        </button>
        <button
          onClick={onClearData}
          className="btn-ghost text-sm flex items-center gap-2 text-red-400 hover:text-red-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          reset data
        </button>
      </div>

      {/* Help text */}
      <p className="text-xs text-x-text-secondary mt-3">
        make sure you're on your x bookmarks page
      </p>
    </div>
  );
}
