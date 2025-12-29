import { useStore } from '../store/useStore';

interface ScanningViewProps {
  onStop: () => void;
}

export function ScanningView({ onStop }: ScanningViewProps) {
  const progress = useStore((s) => s.progress);
  
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 animate-in">
      {/* Animated scanner */}
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-x-border" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-x-accent animate-spin" />
        <div className="absolute inset-2 rounded-full bg-x-bg-secondary flex items-center justify-center">
          <span className="text-2xl font-bold text-x-accent">
            {progress?.count || 0}
          </span>
        </div>
      </div>
      
      {/* Status */}
      <h2 className="text-lg font-semibold text-x-text mb-1">
        Scanning Bookmarks
      </h2>
      <p className="text-sm text-x-text-secondary mb-6">
        {progress?.count || 0} tweets found
      </p>
      
      {/* Progress bar */}
      <div className="w-full max-w-[280px] h-1 bg-x-border rounded-full overflow-hidden mb-6">
        <div 
          className="h-full bg-x-accent animate-pulse-slow"
          style={{ width: '60%' }}
        />
      </div>
      
      {/* Info */}
      <p className="text-xs text-x-text-secondary text-center max-w-[280px] mb-6">
        Scrolling through your bookmarks. This may take a moment for large collections.
      </p>
      
      {/* Stop button */}
      <button onClick={onStop} className="btn-secondary text-sm">
        Stop Scanning
      </button>
    </div>
  );
}

