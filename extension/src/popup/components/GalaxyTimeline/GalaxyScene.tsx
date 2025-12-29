import { Suspense, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

import { BookmarkNodes } from './BookmarkNodes';
import { ClusterNebulae } from './ClusterNebulae';
import { ConnectionLines } from './ConnectionLines';
import { TimeAxis } from './TimeAxis';
import { transformToGalaxyData } from './utils';
import type { ClusterResult } from '../../../../../shared/src/types';
import type { BookmarkNode, GalaxyData } from './types';

interface GalaxySceneProps {
  clusters: ClusterResult[];
  onNodeSelect?: (node: BookmarkNode) => void;
}

function Scene({ data, onNodeSelect }: { data: GalaxyData; onNodeSelect?: (node: BookmarkNode) => void }) {
  const [hoveredNode, setHoveredNode] = useState<BookmarkNode | null>(null);

  const handleNodeClick = useCallback((node: BookmarkNode) => {
    onNodeSelect?.(node);
  }, [onNodeSelect]);

  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, -30, 15]} fov={60} />

      {/* Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={100}
        autoRotate={!hoveredNode}
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

export function GalaxyScene({ clusters, onNodeSelect }: GalaxySceneProps) {
  // Transform cluster data to galaxy visualization format
  const galaxyData = transformToGalaxyData(clusters);

  return (
    <div className="w-full h-full bg-black">
      <Canvas>
        <Suspense fallback={null}>
          <Scene data={galaxyData} onNodeSelect={onNodeSelect} />
        </Suspense>
      </Canvas>
    </div>
  );
}
