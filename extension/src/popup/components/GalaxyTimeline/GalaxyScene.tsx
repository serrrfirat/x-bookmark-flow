import { Suspense, useState, useCallback, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import { BookmarkNodes } from './BookmarkNodes';
import { ClusterNebulae } from './ClusterNebulae';
import { ConnectionLines } from './ConnectionLines';
import { CameraController } from './CameraController';
import { transformToGalaxyData } from './utils';
import type { ClusterResult } from '../../../../../shared/src/types';
import type { BookmarkNode, GalaxyData } from './types';

interface GalaxySceneProps {
  clusters: ClusterResult[];
  searchQuery?: string;
  focusedNodeId?: string | null;
  onNodeSelect?: (node: BookmarkNode) => void;
  onSearchResults?: (results: BookmarkNode[]) => void;
}

interface SceneProps {
  data: GalaxyData;
  searchQuery?: string;
  focusedNodeId?: string | null;
  onNodeSelect?: (node: BookmarkNode) => void;
  onSearchResults?: (results: BookmarkNode[]) => void;
}

function Scene({ data, searchQuery, focusedNodeId, onNodeSelect, onSearchResults }: SceneProps) {
  const [hoveredNode, setHoveredNode] = useState<BookmarkNode | null>(null);
  const [rotationPaused, setRotationPaused] = useState(false);

  // Toggle rotation with space key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        setRotationPaused(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search filtering
  const { highlightedIds, searchResults } = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return { highlightedIds: new Set<string>(), searchResults: [] };
    }

    const query = searchQuery.toLowerCase().trim();
    const matches = data.nodes.filter(node => {
      const text = node.tweet.text.toLowerCase();
      const author = node.tweet.authorHandle.toLowerCase();
      const authorName = node.tweet.authorName.toLowerCase();
      const cluster = node.clusterLabel.toLowerCase();

      return (
        text.includes(query) ||
        author.includes(query) ||
        authorName.includes(query) ||
        cluster.includes(query)
      );
    });

    return {
      highlightedIds: new Set(matches.map(m => m.id)),
      searchResults: matches,
    };
  }, [searchQuery, data.nodes]);

  // Notify parent of search results
  useMemo(() => {
    onSearchResults?.(searchResults);
  }, [searchResults, onSearchResults]);

  // Find focused node position for camera
  const focusedNodePosition = useMemo(() => {
    if (!focusedNodeId) return null;
    const node = data.nodes.find(n => n.id === focusedNodeId);
    return node?.position || null;
  }, [focusedNodeId, data.nodes]);

  const handleNodeClick = useCallback((node: BookmarkNode) => {
    onNodeSelect?.(node);
  }, [onNodeSelect]);

  const isSearching = searchQuery && searchQuery.trim().length >= 2;

  return (
    <>
      {/* Camera - top-down view for 2D map */}
      <PerspectiveCamera makeDefault position={[0, 0, 40]} fov={60} />

      {/* Camera fly-to controller */}
      <CameraController target={focusedNodePosition} />

      {/* Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={100}
        autoRotate={!hoveredNode && !isSearching && !rotationPaused}
        autoRotateSpeed={0.3}
      />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#6366f1" />

      {/* Background - simple dark space */}

      {/* Cluster nebulae (background clouds) */}
      <ClusterNebulae clusters={data.clusters} />

      {/* Connection lines */}
      <ConnectionLines edges={data.edges} nodes={data.nodes} />

      {/* Bookmark nodes */}
      <BookmarkNodes
        nodes={data.nodes}
        highlightedIds={highlightedIds}
        focusedId={focusedNodeId}
        dimNonMatches={isSearching}
        onNodeClick={handleNodeClick}
        onNodeHover={setHoveredNode}
      />

    </>
  );
}

export function GalaxyScene({
  clusters,
  searchQuery,
  focusedNodeId,
  onNodeSelect,
  onSearchResults
}: GalaxySceneProps) {
  // Transform cluster data to galaxy visualization format
  const galaxyData = useMemo(() => transformToGalaxyData(clusters), [clusters]);

  return (
    <div className="w-full h-full bg-black">
      <Canvas>
        <Suspense fallback={null}>
          <Scene
            data={galaxyData}
            searchQuery={searchQuery}
            focusedNodeId={focusedNodeId}
            onNodeSelect={onNodeSelect}
            onSearchResults={onSearchResults}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
