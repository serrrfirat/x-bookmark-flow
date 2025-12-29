import { useRef, useMemo, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { InstancedMesh, Object3D, Color } from 'three';
import { Html } from '@react-three/drei';
import type { BookmarkNode } from './types';

interface BookmarkNodesProps {
  nodes: BookmarkNode[];
  onNodeClick?: (node: BookmarkNode) => void;
  onNodeHover?: (node: BookmarkNode | null) => void;
}

const tempObject = new Object3D();
const tempColor = new Color();

export function BookmarkNodes({ nodes, onNodeClick, onNodeHover }: BookmarkNodesProps) {
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

    nodes.forEach((node, index) => {
      // Base position with subtle floating animation
      const floatOffset = Math.sin(time * 0.5 + index * 0.1) * 0.1;

      tempObject.position.set(
        node.position[0],
        node.position[1],
        node.position[2] + floatOffset
      );

      // Pulse effect for hovered node
      let scale = node.size;
      if (hoveredNode?.id === node.id) {
        scale *= 1.5 + Math.sin(time * 4) * 0.2;
      }

      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(index, tempObject.matrix);

      // Set color
      tempColor.set(node.color);
      if (hoveredNode?.id === node.id) {
        tempColor.multiplyScalar(1.5); // Brighten on hover
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
