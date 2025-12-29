import { useMemo } from 'react';
import { Text, Line } from '@react-three/drei';
import { Vector3 } from 'three';
import { formatTimeLabel } from './utils';

interface TimeAxisProps {
  timeRange: {
    min: number;
    max: number;
  };
}

export function TimeAxis({ timeRange }: TimeAxisProps) {
  const { min, max } = timeRange;

  // Generate time labels
  const timeLabels = useMemo(() => {
    const labels: { time: number; position: number; label: string }[] = [];
    const range = max - min;

    // Create 5-7 evenly spaced labels
    const numLabels = 6;
    for (let i = 0; i < numLabels; i++) {
      const t = i / (numLabels - 1);
      const time = min + t * range;
      const position = t * 20 - 10; // Map to -10 to 10 Z range
      labels.push({
        time,
        position,
        label: formatTimeLabel(time),
      });
    }

    return labels;
  }, [min, max]);

  // Axis line points
  const axisPoints = useMemo(() => [
    new Vector3(-15, -15, -10),
    new Vector3(-15, -15, 10),
  ], []);

  return (
    <group>
      {/* Main axis line */}
      <Line
        points={axisPoints}
        color="#444444"
        lineWidth={2}
      />

      {/* Time labels and ticks */}
      {timeLabels.map((item, index) => (
        <group key={index} position={[-15, -15, item.position]}>
          {/* Tick mark */}
          <Line
            points={[
              new Vector3(0, 0, 0),
              new Vector3(0.5, 0, 0),
            ]}
            color="#666666"
            lineWidth={1}
          />

          {/* Label */}
          <Text
            position={[-1.5, 0, 0]}
            fontSize={0.5}
            color="#888888"
            anchorX="right"
            anchorY="middle"
          >
            {item.label}
          </Text>

          {/* Horizontal grid line (subtle) */}
          <Line
            points={[
              new Vector3(0, 0, 0),
              new Vector3(30, 30, 0),
            ]}
            color="#222222"
            lineWidth={0.5}
            transparent
            opacity={0.3}
          />
        </group>
      ))}

      {/* Axis labels */}
      <Text
        position={[-15, -15, 12]}
        fontSize={0.6}
        color="#666666"
        anchorX="center"
        anchorY="middle"
      >
        Recent ↑
      </Text>

      <Text
        position={[-15, -15, -12]}
        fontSize={0.6}
        color="#666666"
        anchorX="center"
        anchorY="middle"
      >
        ↓ Older
      </Text>
    </group>
  );
}
