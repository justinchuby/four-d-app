import { useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RotationND } from '../../core/math/RotationND';
import { createHypercube, createSimplex, create24Cell, type GeometryND } from '../../core/geometry';
import { projectTo3D, type ProjectionConfig } from '../../core/projection';

interface RotatedGeometryProps {
  geometry: GeometryND;
  rotationPlane: [number, number];
  rotationAngle: number;
  projectionType: 'perspective' | 'orthographic' | 'stereographic';
  color: string;
}

/**
 * Renders geometry with a specific 4D rotation applied
 */
function RotatedGeometry({ geometry, rotationPlane, rotationAngle, projectionType, color }: RotatedGeometryProps) {
  const linesRef = useMemo(() => new THREE.BufferGeometry(), []);
  const pointsRef = useMemo(() => new THREE.BufferGeometry(), []);

  useFrame(() => {
    // Apply rotation
    const rotation = new RotationND(4, rotationPlane[0], rotationPlane[1], rotationAngle);
    const rotatedVertices = geometry.vertices.map(v => rotation.apply(v));

    // Project to 3D
    const projConfig: ProjectionConfig = { type: projectionType, viewDistance: 3 };
    const projected = rotatedVertices.map(v => projectTo3D(v, projConfig));

    // Build lines
    const linePositions: number[] = [];
    const lineColors: number[] = [];
    const baseColor = new THREE.Color(color);

    for (const [i, j] of geometry.edges) {
      const p1 = projected[i];
      const p2 = projected[j];
      
      linePositions.push(p1.get(0), p1.get(1), p1.get(2));
      linePositions.push(p2.get(0), p2.get(1), p2.get(2));
      
      // Color by W depth
      const w1 = rotatedVertices[i].get(3) ?? 0;
      const w2 = rotatedVertices[j].get(3) ?? 0;
      const bright1 = 0.4 + (w1 + 1.5) * 0.2;
      const bright2 = 0.4 + (w2 + 1.5) * 0.2;
      
      lineColors.push(baseColor.r * bright1, baseColor.g * bright1, baseColor.b * bright1);
      lineColors.push(baseColor.r * bright2, baseColor.g * bright2, baseColor.b * bright2);
    }

    linesRef.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    linesRef.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));

    // Build points
    const pointPositions: number[] = [];
    const pointColors: number[] = [];

    for (let i = 0; i < projected.length; i++) {
      const p = projected[i];
      pointPositions.push(p.get(0), p.get(1), p.get(2));
      
      const w = rotatedVertices[i].get(3) ?? 0;
      const bright = 0.5 + (w + 1.5) * 0.25;
      pointColors.push(baseColor.r * bright, baseColor.g * bright, baseColor.b * bright);
    }

    pointsRef.setAttribute('position', new THREE.Float32BufferAttribute(pointPositions, 3));
    pointsRef.setAttribute('color', new THREE.Float32BufferAttribute(pointColors, 3));
  });

  return (
    <>
      <lineSegments geometry={linesRef}>
        <lineBasicMaterial vertexColors />
      </lineSegments>
      <points geometry={pointsRef}>
        <pointsMaterial vertexColors size={0.12} sizeAttenuation />
      </points>
    </>
  );
}

interface ProjectionViewProps {
  geometry: GeometryND;
  rotationPlane: [number, number];
  rotationAngle: number;
  projectionType: 'perspective' | 'orthographic' | 'stereographic';
  label: string;
  color: string;
}

function ProjectionView({ geometry, rotationPlane, rotationAngle, projectionType, label, color }: ProjectionViewProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="text-center text-sm font-bold py-1 bg-gray-800/50" style={{ color }}>
        {label}
      </div>
      <div className="flex-1 bg-gray-900 border border-gray-700">
        <Canvas camera={{ position: [3, 2, 3], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <gridHelper args={[4, 8, '#334444', '#223333']} />
          
          <RotatedGeometry
            geometry={geometry}
            rotationPlane={rotationPlane}
            rotationAngle={rotationAngle}
            projectionType={projectionType}
            color={color}
          />
          
          <OrbitControls enablePan={false} />
        </Canvas>
      </div>
    </div>
  );
}

interface ProjectionComparisonProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Shows the same 4D object from multiple rotation angles simultaneously
 */
export function ProjectionComparison({ isOpen, onClose }: ProjectionComparisonProps) {
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [animSpeed, setAnimSpeed] = useState(0.5);
  const [shapeType, setShapeType] = useState<'hypercube' | 'simplex' | '24-cell'>('hypercube');
  const [projectionType, setProjectionType] = useState<'perspective' | 'orthographic' | 'stereographic'>('perspective');

  // Animation
  useEffect(() => {
    if (!isAnimating || !isOpen) return;
    
    const interval = setInterval(() => {
      setRotationAngle(a => (a + animSpeed * 0.02) % (Math.PI * 2));
    }, 50);
    
    return () => clearInterval(interval);
  }, [isAnimating, animSpeed, isOpen]);

  const geometry = useMemo(() => {
    switch (shapeType) {
      case 'simplex': return createSimplex(4);
      case '24-cell': return create24Cell();
      default: return createHypercube(4);
    }
  }, [shapeType]);

  // Show 6 rotation planes for 4D
  const rotationViews = [
    { plane: [0, 1] as [number, number], label: 'XY Rotation', color: '#ff6b6b' },
    { plane: [0, 2] as [number, number], label: 'XZ Rotation', color: '#ffd93d' },
    { plane: [0, 3] as [number, number], label: 'XW Rotation', color: '#6bcb77' },
    { plane: [1, 2] as [number, number], label: 'YZ Rotation', color: '#4d96ff' },
    { plane: [1, 3] as [number, number], label: 'YW Rotation', color: '#9b59b6' },
    { plane: [2, 3] as [number, number], label: 'ZW Rotation', color: '#00d4ff' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">
            🔄 6 Rotation Planes of 4D
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            In 4D, there are 6 independent rotation planes. Each panel shows the same object rotating in a different plane.
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
        >
          Close
        </button>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-b border-gray-700 p-3 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Shape:</label>
          <select
            value={shapeType}
            onChange={(e) => setShapeType(e.target.value as typeof shapeType)}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="hypercube">Tesseract</option>
            <option value="simplex">5-cell</option>
            <option value="24-cell">24-cell</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Projection:</label>
          <select
            value={projectionType}
            onChange={(e) => setProjectionType(e.target.value as typeof projectionType)}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="perspective">Perspective</option>
            <option value="orthographic">Orthographic</option>
            <option value="stereographic">Stereographic</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Angle:</label>
          <input
            type="range"
            min="0"
            max={Math.PI * 2}
            step="0.05"
            value={rotationAngle}
            onChange={(e) => setRotationAngle(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-cyan-400 font-mono text-sm w-16">
            {(rotationAngle * 180 / Math.PI).toFixed(0)}°
          </span>
        </div>

        <button
          onClick={() => setIsAnimating(!isAnimating)}
          className={`px-3 py-1 rounded text-sm ${
            isAnimating ? 'bg-cyan-600' : 'bg-gray-700'
          }`}
        >
          {isAnimating ? '⏸ Pause' : '▶ Animate'}
        </button>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Speed:</label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={animSpeed}
            onChange={(e) => setAnimSpeed(Number(e.target.value))}
            className="w-20"
          />
        </div>
      </div>

      {/* 2x3 Grid of rotation views */}
      <div className="flex-1 p-4 grid grid-cols-3 grid-rows-2 gap-4">
        {rotationViews.map((view, i) => (
          <ProjectionView
            key={i}
            geometry={geometry}
            rotationPlane={view.plane}
            rotationAngle={rotationAngle}
            projectionType={projectionType}
            label={view.label}
            color={view.color}
          />
        ))}
      </div>

      {/* Educational Footer */}
      <div className="bg-gray-900 border-t border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-cyan-400 font-bold mb-2 text-center">💡 Understanding 4D Rotations</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <strong className="text-yellow-400">In 3D:</strong> Rotations happen <em>around an axis</em> (X, Y, or Z). 
              There are 3 rotation axes.
            </div>
            <div>
              <strong className="text-cyan-400">In 4D:</strong> Rotations happen <em>in a plane</em> (XY, XZ, XW, YZ, YW, ZW). 
              There are 6 rotation planes!
            </div>
          </div>
          <p className="text-center text-gray-400 text-xs mt-2">
            Formula: In N dimensions, there are N×(N-1)/2 rotation planes. For 4D: 4×3/2 = 6 planes.
          </p>
        </div>
      </div>
    </div>
  );
}
