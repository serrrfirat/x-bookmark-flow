import { useRef, useMemo, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { InstancedMesh, Object3D, Color } from 'three';
import { Html } from '@react-three/drei';
import type { BookmarkNode } from './types';

interface BookmarkNodesProps {
  nodes: BookmarkNode[];
  highlightedIds?: Set<string>;
  focusedId?: string | null;
  dimNonMatches?: boolean;
  onNodeClick?: (node: BookmarkNode) => void;
  onNodeHover?: (node: BookmarkNode | null) => void;
}

const tempObject = new Object3D();
const tempColor = new Color();
const HIGHLIGHT_COLOR = new Color('#FFD700'); // Gold for search matches
const DIM_OPACITY = 0.15;

export function BookmarkNodes({
  nodes,
  highlightedIds,
  focusedId,
  dimNonMatches = false,
  onNodeClick,
  onNodeHover
}: BookmarkNodesProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const [hoveredNode, setHoveredNode] = useState<BookmarkNode | null>(null);

  // Create a map for quick node lookup by index
  const nodeMap = useMemo(() => {
    const map = new Map<number, BookmarkNode>();
    nodes.forEach((node, index) => {
      map.set(index, node);
    });
    return map;
  }, [nodes]);

  // Initialize and animate instances
  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    const hasHighlights = highlightedIds && highlightedIds.size > 0;

    nodes.forEach((node, index) => {
      const isHighlighted = highlightedIds?.has(node.id);
      const isFocused = focusedId === node.id;
      const isHovered = hoveredNode?.id === node.id;

      // Base position with subtle floating animation
      const floatOffset = Math.sin(time * 0.5 + index * 0.1) * 0.1;

      tempObject.position.set(
        node.position[0],
        node.position[1],
        node.position[2] + floatOffset
      );

      // Scale: pulse effect for hovered/focused/highlighted nodes
      let scale = node.size;
      if (isFocused) {
        // Focused node (current search selection) - largest pulse
        scale *= 2.5 + Math.sin(time * 6) * 0.3;
      } else if (isHighlighted) {
        // Highlighted search result - medium pulse
        scale *= 1.8 + Math.sin(time * 4) * 0.2;
      } else if (isHovered) {
        // Hovered node
        scale *= 1.5 + Math.sin(time * 4) * 0.2;
      } else if (hasHighlights && dimNonMatches) {
        // Dim non-matching nodes when searching
        scale *= 0.6;
      }

      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(index, tempObject.matrix);

      // Set color based on state
      if (isFocused) {
        // Focused: bright gold
        tempColor.copy(HIGHLIGHT_COLOR);
        tempColor.multiplyScalar(2);
      } else if (isHighlighted) {
        // Highlighted: gold tint
        tempColor.copy(HIGHLIGHT_COLOR);
      } else if (isHovered) {
        // Hovered: brighter original color
        tempColor.set(node.color);
        tempColor.multiplyScalar(1.5);
      } else if (hasHighlights && dimNonMatches) {
        // Dim non-matches
        tempColor.set(node.color);
        tempColor.multiplyScalar(DIM_OPACITY);
      } else {
        // Default color
        tempColor.set(node.color);
      }

      meshRef.current!.setColorAt(index, tempColor);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const instanceId = e.instanceId;
    if (instanceId !== undefined) {
      const node = nodeMap.get(instanceId);
      if (node) {
        setHoveredNode(node);
        onNodeHover?.(node);
        document.body.style.cursor = 'pointer';
      }
    }
  };

  const handlePointerOut = () => {
    setHoveredNode(null);
    onNodeHover?.(null);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const instanceId = e.instanceId;
    if (instanceId !== undefined) {
      const node = nodeMap.get(instanceId);
      if (node) {
        onNodeClick?.(node);
      }
    }
  };

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, nodes.length]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          roughness={0.3}
          metalness={0.8}
          emissive="#ffffff"
          emissiveIntensity={0.2}
        />
      </instancedMesh>

      {/* Tooltip for hovered node */}
      {hoveredNode && (
        <Html
          position={[
            hoveredNode.position[0],
            hoveredNode.position[1],
            hoveredNode.position[2] + 1
          ]}
          center
          style={{
            pointerEvents: 'none',
            transform: 'translateY(-100%)',
          }}
        >
          <div className="bg-gray-900/95 text-white px-3 py-2 rounded-lg shadow-xl max-w-[250px] text-xs backdrop-blur-sm border border-gray-700">
            <div className="font-semibold text-[10px] text-gray-400 mb-1">
              @{hoveredNode.tweet.authorHandle} · {hoveredNode.clusterLabel}
            </div>
            <div className="line-clamp-3">
              {hoveredNode.tweet.text}
            </div>
            {hoveredNode.tweet.metrics && (
              <div className="mt-1 text-[10px] text-gray-500">
                ❤️ {hoveredNode.tweet.metrics.likes} · 🔁 {hoveredNode.tweet.metrics.retweets}
              </div>
            )}
          </div>
        </Html>
      )}
    </>
  );
}
