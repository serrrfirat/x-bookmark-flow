import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { Vector3 } from 'three';
import type { BookmarkNode, ConnectionEdge } from './types';

interface ConnectionLinesProps {
  edges: ConnectionEdge[];
  nodes: BookmarkNode[];
}

function ConnectionLine({
  from,
  to,
  type,
  strength,
  index,
}: {
  from: BookmarkNode;
  to: BookmarkNode;
  type: ConnectionEdge['type'];
  strength: number;
  index: number;
}) {
  const lineRef = useRef<any>(null);

  // Different colors for different connection types
  const color = useMemo(() => {
    switch (type) {
      case 'author':
        return '#60A5FA'; // blue for same author
      case 'link':
        return '#FBBF24'; // amber for shared links
      case 'cluster':
        return '#34D399'; // emerald for same cluster
      default:
        return '#888888';
    }
  }, [type]);

  // Create curved line points
  const points = useMemo(() => {
    const start = new Vector3(...from.position);
    const end = new Vector3(...to.position);
    const mid = new Vector3().addVectors(start, end).multiplyScalar(0.5);

    // Add curve by offsetting midpoint
    const offset = new Vector3()
      .subVectors(end, start)
      .cross(new Vector3(0, 0, 1))
      .normalize()
      .multiplyScalar(1 + Math.random() * 0.5);

    mid.add(offset);

    // Create bezier curve points
    const curvePoints: Vector3[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const point = new Vector3();

      // Quadratic bezier
      point.x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * mid.x + t * t * end.x;
      point.y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * mid.y + t * t * end.y;
      point.z = (1 - t) * (1 - t) * start.z + 2 * (1 - t) * t * mid.z + t * t * end.z;

      curvePoints.push(point);
    }

    return curvePoints;
  }, [from, to]);

  useFrame((state) => {
    if (lineRef.current) {
      // Animate opacity based on time
      const time = state.clock.getElapsedTime();
      const pulse = 0.3 + Math.sin(time * 2 + index * 0.5) * 0.2;
      lineRef.current.material.opacity = pulse * strength;
    }
  });

  return (
    <Line
      ref={lineRef}
      points={points}
      color={color}
      lineWidth={1}
      transparent
      opacity={0.4 * strength}
    />
  );
}

export function ConnectionLines({ edges, nodes }: ConnectionLinesProps) {
  // Create a node lookup map
  const nodeMap = useMemo(() => {
    const map = new Map<string, BookmarkNode>();
    nodes.forEach(node => map.set(node.id, node));
    return map;
  }, [nodes]);

  // Filter valid edges (both nodes exist)
  const validEdges = useMemo(() => {
    return edges.filter(edge => {
      return nodeMap.has(edge.from) && nodeMap.has(edge.to);
    });
  }, [edges, nodeMap]);

  return (
    <group>
      {validEdges.map((edge, index) => {
        const fromNode = nodeMap.get(edge.from)!;
        const toNode = nodeMap.get(edge.to)!;

        return (
          <ConnectionLine
            key={edge.id}
            from={fromNode}
            to={toNode}
            type={edge.type}
            strength={edge.strength}
            index={index}
          />
        );
      })}
    </group>
  );
}
