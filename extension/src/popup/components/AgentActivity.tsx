import { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';

interface AgentEvent {
  type: 'status' | 'thinking' | 'tool_use' | 'tool_result' | 'text' | 'complete' | 'error' | 'connected';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export function AgentActivity() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Connect to SSE endpoint
    const eventSource = new EventSource('http://localhost:9999/api/events');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (e) => {
      try {
        const event: AgentEvent = JSON.parse(e.data);
        setEvents(prev => {
          // Keep last 50 events to avoid memory issues
          const newEvents = [...prev, event].slice(-50);
          return newEvents;
        });
      } catch (err) {
        console.error('Failed to parse event:', err);
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events]);

  const getEventIcon = (type: AgentEvent['type']) => {
    switch (type) {
      case 'status':
        return '○';
      case 'tool_use':
        return '→';
      case 'tool_result':
        return '←';
      case 'text':
        return '·';
      case 'complete':
        return '✓';
      case 'error':
        return '✕';
      default:
        return '·';
    }
  };

  const getEventColor = (type: AgentEvent['type']) => {
    switch (type) {
      case 'status':
        return 'text-blue-400';
      case 'tool_use':
        return 'text-yellow-400';
      case 'tool_result':
        return 'text-green-400';
      case 'text':
        return 'text-x-text-secondary';
      case 'complete':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-x-text-secondary';
    }
  };

  return (
    <div className="card bg-x-bg-secondary border border-x-border">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-x-border">
        <div
          className={clsx(
            'w-2 h-2 rounded-full',
            connected ? 'bg-green-500' : 'bg-red-500'
          )}
        />
        <span className="text-xs text-x-text-secondary font-mono">
          agent activity
        </span>
      </div>

      {/* Events */}
      <div
        ref={containerRef}
        className="h-48 overflow-y-auto p-2 font-mono text-xs space-y-1"
      >
        {events.length === 0 && (
          <div className="text-x-text-secondary text-center py-4">
            waiting for agent...
          </div>
        )}

        {events.map((event, i) => (
          <div
            key={i}
            className={clsx(
              'flex gap-2 items-start',
              getEventColor(event.type)
            )}
          >
            <span className="flex-shrink-0 w-4 text-center">
              {getEventIcon(event.type)}
            </span>
            <span className="break-words flex-1">
              {event.type === 'tool_use' && event.metadata?.tool ? (
                <span className="text-yellow-400">[{String(event.metadata.tool)}] </span>
              ) : null}
              {event.content}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
