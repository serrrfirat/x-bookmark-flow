import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { GalaxyTimeline } from '../popup/components/GalaxyTimeline';
import type { ClusterResult } from '../../../shared/src/types';
import '../popup/styles/globals.css';

function GalaxyPage() {
  const [clusters, setClusters] = useState<ClusterResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load clusters from chrome.storage
    chrome.storage.local.get(['galaxyData'], (result) => {
      if (result.galaxyData) {
        setClusters(result.galaxyData);
      } else {
        setError('No bookmark data found. Please scan bookmarks first.');
      }
    });
  }, []);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-2xl mb-4">🌌</div>
          <div className="text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!clusters) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto mb-4" />
          <div className="text-gray-400">Loading galaxy...</div>
        </div>
      </div>
    );
  }

  return (
    <GalaxyTimeline
      clusters={clusters}
      onClose={() => window.close()}
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GalaxyPage />
  </React.StrictMode>
);
