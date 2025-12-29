import { useStore } from '../store/useStore';
import { AgentActivity } from './AgentActivity';

export function ProcessingView() {
  const progress = useStore((s) => s.progress);

  return (
    <div className="flex flex-col py-4 animate-in">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-semibold text-x-text mb-1">
          processing bookmarks
        </h2>
        <p className="text-sm text-x-text-secondary">
          {progress?.count || 0} bookmarks being analyzed
        </p>
      </div>

      {/* Agent Activity */}
      <AgentActivity />

      {/* Tip */}
      <p className="text-xs text-x-text-secondary mt-4 text-center">
        the agent is researching your bookmarks and creating posts
      </p>
    </div>
  );
}
