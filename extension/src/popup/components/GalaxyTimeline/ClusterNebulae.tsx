import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import { Mesh } from 'three';
import type { ClusterCloud } from './types';

interface ClusterNebulaeProps {
  clusters: ClusterCloud[];
}

function ClusterNebula({ cluster, index }: { cluster: ClusterCloud; index: number }) {
  const meshRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Gentle rotation
    if (meshRef.current) {
      meshRef.current.rotation.y = time * 0.1 + index;
      meshRef.current.rotation.x = Math.sin(time * 0.2 + index) * 0.1;
    }

    // Pulsing glow
    if (glowRef.current) {
      const scale = 1 + Math.sin(time * 0.5 + index * 0.5) * 0.1;
      glowRef.current.scale.setScalar(scale);
    }
  });

  const size = 2 + Math.log10(cluster.nodeCount + 1) * 1.5;

  return (
    <group position={cluster.center}>
      {/* Inner core */}
      <Sphere ref={meshRef} args={[size * 0.3, 32, 32]}>
        <meshStandardMaterial
          color={cluster.color}
          transparent
          opacity={0.6}
          emissive={cluster.color}
          emissiveIntensity={0.5}
        />
      </Sphere>

      {/* Outer glow */}
      <Sphere ref={glowRef} args={[size, 32, 32]}>
        <meshStandardMaterial
          color={cluster.color}
          transparent
          opacity={0.08}
          emissive={cluster.color}
          emissiveIntensity={0.3}
        />
      </Sphere>

      {/* Cluster label using HTML overlay */}
      <Html
        position={[0, size + 1.5, 0]}
        center
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div className="text-center whitespace-nowrap">
          <div className="text-white text-sm font-semibold drop-shadow-lg" style={{ textShadow: '0 0 8px rgba(0,0,0,0.8)' }}>
            {cluster.label}
          </div>
          <div className="text-gray-400 text-xs">
            {cluster.nodeCount} bookmarks
          </div>
        </div>
      </Html>
    </group>
  );
}

export function ClusterNebulae({ clusters }: ClusterNebulaeProps) {
  return (
    <group>
      {clusters.map((cluster, index) => (
        <ClusterNebula key={cluster.id} cluster={cluster} index={index} />
      ))}
    </group>
  );
}
