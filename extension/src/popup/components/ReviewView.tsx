import { useStore } from '../store/useStore';
import { TopicCard } from './TopicCard';
import { ToneSelector } from './ToneSelector';
import type { ClusterResult } from '../../../../shared/src/types';

interface ReviewViewProps {
  onRegenerate: () => void;
}

export function ReviewView({ onRegenerate }: ReviewViewProps) {
  const data = useStore((s) => s.data);
  
  if (!data) return null;
  
  const { clusters, meta } = data;

  return (
    <div className="animate-in">
      {/* Stats bar */}
      <div className="flex items-center justify-between text-xs text-x-text-secondary mb-4">
        <span>{meta.totalTweets} bookmarks analyzed</span>
        <span>{clusters.length} topics found</span>
      </div>
      
      {/* Tone selector */}
      <div className="mb-4">
        <ToneSelector />
      </div>
      
      {/* Clusters with their threads */}
      <div className="space-y-3">
        {clusters.map((cluster: ClusterResult, index: number) => (
          <TopicCard 
            key={cluster.id} 
            cluster={cluster}
            delay={index * 0.05}
          />
        ))}
      </div>
      
      <button 
        onClick={onRegenerate}
        className="btn-secondary w-full text-sm mt-4"
      >
        Regenerate All Threads
      </button>
    </div>
  );
}
