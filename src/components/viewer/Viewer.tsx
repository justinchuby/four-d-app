import { Canvas } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { NDGeometry } from './NDGeometry';

export function Viewer() {
  return (
    <Canvas
      camera={{ position: [4, 3, 4], fov: 50 }}
      style={{ background: '#0a0a0a' }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      {/* The N-dimensional geometry */}
      <NDGeometry />
      
      {/* 3D navigation controls */}
      <OrbitControls 
        enableDamping 
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={20}
      />
      
      {/* Grid for reference */}
      <gridHelper args={[10, 10, '#333333', '#222222']} />
      
      {/* Axis indicator */}
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport axisColors={['#ff4444', '#44ff44', '#4444ff']} labelColor="white" />
      </GizmoHelper>
    </Canvas>
  );
}
