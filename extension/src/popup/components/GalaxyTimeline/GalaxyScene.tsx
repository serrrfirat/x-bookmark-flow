import { Suspense, useState, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

import { BookmarkNodes } from './BookmarkNodes';
import { ClusterNebulae } from './ClusterNebulae';
import { ConnectionLines } from './ConnectionLines';
import { TimeAxis } from './TimeAxis';
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
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, -30, 15]} fov={60} />

      {/* Camera fly-to controller */}
      <CameraController target={focusedNodePosition} />

      {/* Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={100}
        autoRotate={!hoveredNode && !isSearching}
        autoRotateSpeed={0.3}
      />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#6366f1" />

      {/* Background stars */}
      <Stars radius={100} depth={50} count={3000} factor={4} fade speed={0.5} />

      {/* Time axis */}
      <TimeAxis timeRange={data.timeRange} />

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

      {/* Post-processing effects */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={0.8}
        />
      </EffectComposer>
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
