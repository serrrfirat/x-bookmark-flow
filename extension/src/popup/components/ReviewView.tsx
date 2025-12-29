import { useState } from 'react';
import { useStore } from '../store/useStore';
import { TopicCard } from './TopicCard';
import { ToneSelector } from './ToneSelector';
import { GalaxyTimeline } from './GalaxyTimeline';
import type { ClusterResult } from '../../../../shared/src/types';

interface ReviewViewProps {
  onRegenerate: () => void;
}

export function ReviewView({ onRegenerate }: ReviewViewProps) {
  const data = useStore((s) => s.data);
  const [showGalaxy, setShowGalaxy] = useState(false);

  if (!data) return null;

  const { clusters, meta } = data;

  // Show Galaxy Timeline in full screen
  if (showGalaxy) {
    return (
      <GalaxyTimeline
        clusters={clusters}
        onClose={() => setShowGalaxy(false)}
      />
    );
  }

  return (
    <div className="animate-in">
      {/* Stats bar */}
      <div className="flex items-center justify-between text-xs text-x-text-secondary mb-4">
        <span>{meta.totalTweets} bookmarks analyzed</span>
        <span>{clusters.length} topics found</span>
      </div>

      {/* Galaxy View Button */}
      <button
        onClick={() => setShowGalaxy(true)}
        className="w-full mb-4 py-3 px-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/30 rounded-xl flex items-center justify-center gap-2 text-indigo-300 hover:text-indigo-200 transition-all group"
      >
        <span className="text-lg group-hover:scale-110 transition-transform">🌌</span>
        <span className="font-medium">Explore Galaxy Timeline</span>
        <span className="text-xs text-indigo-400/70">3D visualization</span>
      </button>
      
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
