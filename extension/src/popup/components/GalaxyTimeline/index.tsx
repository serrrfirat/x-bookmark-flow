import { useState, useCallback, useRef, useEffect } from 'react';
import { GalaxyScene } from './GalaxyScene';
import type { ClusterResult } from '../../../../../shared/src/types';
import type { BookmarkNode } from './types';

interface GalaxyTimelineProps {
  clusters: ClusterResult[];
  onClose?: () => void;
}

export function GalaxyTimeline({ clusters, onClose }: GalaxyTimelineProps) {
  const [selectedNode, setSelectedNode] = useState<BookmarkNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BookmarkNode[]>([]);
  const [focusedResultIndex, setFocusedResultIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const focusedNodeId = searchResults.length > 0 ? searchResults[focusedResultIndex]?.id : null;

  const handleNodeSelect = (node: BookmarkNode) => {
    setSelectedNode(node);
    setShowResults(false);
  };

  const handleOpenTweet = () => {
    if (selectedNode) {
      window.open(selectedNode.tweet.url, '_blank');
    }
  };

  const handleSearchResults = useCallback((results: BookmarkNode[]) => {
    setSearchResults(results);
    setFocusedResultIndex(0);
    setShowResults(results.length > 0);
  }, []);

  const handleResultClick = (node: BookmarkNode, index: number) => {
    setFocusedResultIndex(index);
    setSelectedNode(node);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setFocusedResultIndex(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + F to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Only handle navigation when search is active
      if (!showResults || searchResults.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedResultIndex(i => Math.min(i + 1, searchResults.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedResultIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (searchResults[focusedResultIndex]) {
            setSelectedNode(searchResults[focusedResultIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (searchQuery) {
            clearSearch();
          } else {
            searchInputRef.current?.blur();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResults, searchResults, focusedResultIndex, searchQuery]);

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

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookmarks... (⌘F)"
              className="w-64 px-3 py-1.5 pl-9 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Close button */}
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
        <GalaxyScene
          clusters={clusters}
          searchQuery={searchQuery}
          focusedNodeId={focusedNodeId}
          onNodeSelect={handleNodeSelect}
          onSearchResults={handleSearchResults}
        />

        {/* Search Results Panel */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-4 left-4 w-80 max-h-[60vh] bg-gray-900/95 backdrop-blur rounded-xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between">
              <span className="text-sm text-gray-300">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-gray-500">
                ↑↓ navigate · Enter select
              </span>
            </div>
            <div className="overflow-y-auto flex-1">
              {searchResults.map((node, index) => (
                <button
                  key={node.id}
                  onClick={() => handleResultClick(node, index)}
                  className={`w-full px-4 py-3 text-left border-b border-gray-800/50 transition-colors ${
                    index === focusedResultIndex
                      ? 'bg-indigo-500/20 border-l-2 border-l-indigo-500'
                      : 'hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: node.color }}
                    />
                    <span className="text-xs text-gray-400">@{node.tweet.authorHandle}</span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-gray-500">{node.clusterLabel}</span>
                  </div>
                  <p className="text-sm text-gray-200 line-clamp-2">
                    {node.tweet.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

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
