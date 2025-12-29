import { useState, lazy, Suspense, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { TopicCard } from './TopicCard';
import { ToneSelector } from './ToneSelector';
import type { ClusterResult } from '../../../../shared/src/types';

// Lazy load GalaxyTimeline to avoid Three.js initialization issues
const GalaxyTimeline = lazy(() => import('./GalaxyTimeline').then(m => ({ default: m.GalaxyTimeline })));

interface ReviewViewProps {
  onRegenerate: () => void;
}

export function ReviewView({ onRegenerate }: ReviewViewProps) {
  const data = useStore((s) => s.data);
  const [showGalaxy, setShowGalaxy] = useState(false);

  const openGalaxyInTab = useCallback(() => {
    if (!data) return;
    // Store clusters in chrome.storage for the galaxy page to read
    chrome.storage.local.set({ galaxyData: data.clusters }, () => {
      // Open galaxy page in new tab
      chrome.tabs.create({ url: chrome.runtime.getURL('galaxy/index.html') });
    });
  }, [data]);

  if (!data) return null;

  const { clusters, meta } = data;

  // Show Galaxy Timeline in full screen
  if (showGalaxy) {
    return (
      <Suspense fallback={
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-white">Loading 3D view...</div>
        </div>
      }>
        <GalaxyTimeline
          clusters={clusters}
          onClose={() => setShowGalaxy(false)}
        />
      </Suspense>
    );
  }

  return (
    <div className="animate-in">
      {/* Stats bar */}
      <div className="flex items-center justify-between text-xs text-x-text-secondary mb-4">
        <span>{meta.totalTweets} bookmarks analyzed</span>
        <span>{clusters.length} topics found</span>
      </div>

      {/* Galaxy View Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={openGalaxyInTab}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/30 rounded-xl flex items-center justify-center gap-2 text-indigo-300 hover:text-indigo-200 transition-all group"
        >
          <span className="text-lg group-hover:scale-110 transition-transform">🌌</span>
          <span className="font-medium">Open Galaxy</span>
          <span className="text-xs text-indigo-400/70">Full tab</span>
        </button>
        <button
          onClick={() => setShowGalaxy(true)}
          className="py-3 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl flex items-center justify-center gap-2 text-gray-300 hover:text-white transition-all"
          title="Preview in popup"
        >
          <span>👁️</span>
        </button>
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
