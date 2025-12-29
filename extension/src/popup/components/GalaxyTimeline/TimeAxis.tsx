import { useMemo } from 'react';
import { Line, Html } from '@react-three/drei';
import { Vector3 } from 'three';
import { CONTENT_TYPE_Z, ContentType } from './types';

const CONTENT_TYPE_LABELS: { type: ContentType; label: string; icon: string }[] = [
  { type: 'tool', label: 'Tools & Repos', icon: '🔧' },
  { type: 'article', label: 'Articles', icon: '📄' },
  { type: 'thread', label: 'Threads', icon: '🧵' },
  { type: 'tweet', label: 'Quick Tweets', icon: '💬' },
];

export function ContentTypeAxis() {
  // Axis line points
  const axisPoints = useMemo(() => [
    new Vector3(-18, -18, -10),
    new Vector3(-18, -18, 12),
  ], []);

  return (
    <group>
      {/* Main axis line */}
      <Line
        points={axisPoints}
        color="#444444"
        lineWidth={2}
      />

      {/* Content type labels */}
      {CONTENT_TYPE_LABELS.map(({ type, label, icon }) => {
        const z = CONTENT_TYPE_Z[type];
        return (
          <group key={type} position={[-18, -18, z]}>
            {/* Tick mark */}
            <Line
              points={[
                new Vector3(0, 0, 0),
                new Vector3(0.8, 0, 0),
              ]}
              color="#666666"
              lineWidth={1}
            />

            {/* Horizontal grid plane (subtle) */}
            <Line
              points={[
                new Vector3(0, 0, 0),
                new Vector3(35, 35, 0),
              ]}
              color="#333333"
              lineWidth={0.5}
              transparent
              opacity={0.2}
            />

            {/* Label using HTML overlay */}
            <Html
              position={[-2, 0, 0]}
              center
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              <div className="flex items-center gap-1 whitespace-nowrap">
                <span className="text-sm">{icon}</span>
                <span className="text-xs text-gray-400" style={{ textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>
                  {label}
                </span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

// Keep old export name for backwards compatibility
export { ContentTypeAxis as TimeAxis };
