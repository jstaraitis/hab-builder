import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function Model({ modelUrl }: { modelUrl: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  let scene: THREE.Scene | undefined;
  
  try {
    const gltf = useGLTF(modelUrl);
    scene = gltf.scene;
  } catch (err) {
    console.error('Error loading GLB:', err);
    setHasError(true);
  }

  // Auto-rotate
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  // Setup model on mount
  useEffect(() => {
    if (!scene || !groupRef.current) return;

    try {
      // Clear previous content
      groupRef.current.clear();

      // Clone and position the model
      const cloned = scene.clone();
      const box = new THREE.Box3().setFromObject(cloned);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 8 / maxDim;

      cloned.scale.multiplyScalar(scale);
      const center = box.getCenter(new THREE.Vector3());
      cloned.position.copy(center).multiplyScalar(-scale);

      groupRef.current.add(cloned);
      setIsLoading(false);
    } catch (err) {
      console.error('Error setting up model:', err);
      setHasError(true);
      setIsLoading(false);
    }
  }, [scene]);

  if (hasError) {
    return (
      <group>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#888888" />
        </mesh>
      </group>
    );
  }

  return <group ref={groupRef} />;
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 15, 10]} intensity={0.9} castShadow />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />
      <pointLight position={[0, 10, 10]} intensity={0.4} />
    </>
  );
}

export function CanvasRenderer({ modelUrl }: { modelUrl: string }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 15], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={['#f3f4f6']} />
      <Lights />
      <Model modelUrl={modelUrl} />
      <OrbitControls
        autoRotate
        autoRotateSpeed={3}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
      />
    </Canvas>
  );
}
