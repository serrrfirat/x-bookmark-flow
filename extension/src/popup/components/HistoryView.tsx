import { useState, useEffect } from 'react';
import { clsx } from 'clsx';

interface Session {
  id: string;
  createdAt: string;
  totalBookmarks: number;
  clustersCount: number;
}

interface HistoryViewProps {
  onSelectSession: (sessionId: string) => void;
  onBack: () => void;
}

export function HistoryView({ onSelectSession, onBack }: HistoryViewProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:9999/api/sessions');
      const data = await response.json();

      if (data.success) {
        setSessions(data.data);
      } else {
        setError(data.error?.message || 'failed to load sessions');
      }
    } catch (err) {
      setError('could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // Less than 1 hour ago
    if (diff < 60 * 60 * 1000) {
      const mins = Math.floor(diff / (60 * 1000));
      return `${mins}m ago`;
    }

    // Less than 24 hours ago
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}h ago`;
    }

    // Less than 7 days ago
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days}d ago`;
    }

    // Older
    return date.toLocaleDateString();
  };

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-1 hover:bg-x-bg-secondary rounded"
        >
          <svg
            className="w-5 h-5 text-x-text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-x-text">history</h2>
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-x-accent border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-x-error text-sm mb-4">{error}</p>
          <button
            onClick={fetchSessions}
            className="btn-secondary text-sm"
          >
            retry
          </button>
        </div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-x-text-secondary">no saved sessions yet</p>
          <p className="text-xs text-x-text-secondary mt-2">
            scan some bookmarks to get started
          </p>
        </div>
      )}

      {!loading && !error && sessions.length > 0 && (
        <div className="space-y-2">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={clsx(
                'w-full card p-3 text-left',
                'hover:bg-x-bg-hover transition-colors'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-x-text">
                  {session.clustersCount} topics
                </span>
                <span className="text-xs text-x-text-secondary">
                  {formatDate(session.createdAt)}
                </span>
              </div>
              <p className="text-xs text-x-text-secondary">
                {session.totalBookmarks} bookmarks analyzed
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
