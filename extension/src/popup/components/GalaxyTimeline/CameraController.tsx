import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';

interface CameraControllerProps {
  target: [number, number, number] | null;
  onArrived?: () => void;
}

export function CameraController({ target, onArrived }: CameraControllerProps) {
  const { camera } = useThree();
  const targetRef = useRef<Vector3 | null>(null);
  const arrivedRef = useRef(false);

  useEffect(() => {
    if (target) {
      // Set new target position (camera above node for 2D top-down view)
      targetRef.current = new Vector3(
        target[0],
        target[1],
        25 // Fixed height above the map
      );
      arrivedRef.current = false;
    } else {
      targetRef.current = null;
    }
  }, [target]);

  useFrame(() => {
    if (!targetRef.current || arrivedRef.current) return;

    // Smooth camera movement
    const current = new Vector3().copy(camera.position);
    const target = targetRef.current;

    // Lerp towards target
    camera.position.lerp(target, 0.05);

    // Check if arrived (close enough)
    const distance = current.distanceTo(target);
    if (distance < 0.5) {
      arrivedRef.current = true;
      onArrived?.();
    }
  });

  return null;
}
