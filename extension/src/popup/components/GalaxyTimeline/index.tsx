import { useState } from 'react';
import { GalaxyScene } from './GalaxyScene';
import type { ClusterResult } from '../../../../../shared/src/types';
import type { BookmarkNode } from './types';

interface GalaxyTimelineProps {
  clusters: ClusterResult[];
  onClose?: () => void;
}

export function GalaxyTimeline({ clusters, onClose }: GalaxyTimelineProps) {
  const [selectedNode, setSelectedNode] = useState<BookmarkNode | null>(null);

  const handleNodeSelect = (node: BookmarkNode) => {
    setSelectedNode(node);
  };

  const handleOpenTweet = () => {
    if (selectedNode) {
      window.open(selectedNode.tweet.url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900/80 backdrop-blur border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-xl">🌌</span>
          <div>
            <h2 className="text-white font-semibold">Galaxy Timeline</h2>
            <p className="text-gray-400 text-xs">
              {clusters.reduce((sum, c) => sum + c.tweets.length, 0)} bookmarks · {clusters.length} clusters
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 mr-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Same author
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Shared link
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <GalaxyScene clusters={clusters} onNodeSelect={handleNodeSelect} />

        {/* Controls hint */}
        <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-gray-900/60 px-3 py-2 rounded-lg backdrop-blur">
          <div>🖱️ Drag to rotate · Scroll to zoom · Click node for details</div>
        </div>

        {/* Selected node panel */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-80 bg-gray-900/95 backdrop-blur rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
            {/* Cluster badge */}
            <div
              className="px-4 py-2 text-xs font-medium"
              style={{ backgroundColor: selectedNode.color + '20', color: selectedNode.color }}
            >
              {selectedNode.clusterLabel}
            </div>

            <div className="p-4">
              {/* Author */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold">
                  {selectedNode.tweet.authorName[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{selectedNode.tweet.authorName}</div>
                  <div className="text-gray-400 text-xs">@{selectedNode.tweet.authorHandle}</div>
                </div>
              </div>

              {/* Tweet text */}
              <p className="text-gray-200 text-sm mb-3 leading-relaxed">
                {selectedNode.tweet.text}
              </p>

              {/* Metrics */}
              {selectedNode.tweet.metrics && (
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                  <span>❤️ {selectedNode.tweet.metrics.likes.toLocaleString()}</span>
                  <span>🔁 {selectedNode.tweet.metrics.retweets.toLocaleString()}</span>
                  <span>💬 {selectedNode.tweet.metrics.replies.toLocaleString()}</span>
                </div>
              )}

              {/* Link context */}
              {selectedNode.tweet.linkContext && (
                <div className="mb-3 p-2 bg-gray-800/50 rounded-lg text-xs">
                  <div className="text-gray-400 mb-1">🔗 Linked content</div>
                  <div className="text-blue-400 truncate">
                    {selectedNode.tweet.linkContext.title || selectedNode.tweet.linkContext.url}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-xs text-gray-500 mb-4">
                {new Date(selectedNode.tweet.timestamp).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleOpenTweet}
                  className="flex-1 py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  View on X
                </button>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export type { BookmarkNode, GalaxyData } from './types';
