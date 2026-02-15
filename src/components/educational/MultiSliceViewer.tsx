import { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { VectorND } from '../../core/math/VectorND';
import { RotationND } from '../../core/math/RotationND';
import { 
  createHypercube, createSimplex, createOrthoplex, create24Cell,
  create600Cell, createCliffordTorus, createDuocylinder, createHypercone, createGrandAntiprism,
  type GeometryND 
} from '../../core/geometry';
import { projectTo3D, type ProjectionConfig } from '../../core/projection';

type ShapeType = 'hypercube' | 'simplex' | 'orthoplex' | '24-cell' | '600-cell' | 
                 'clifford-torus' | 'duocylinder' | 'hypercone' | 'grand-antiprism';

interface SliceViewProps {
  geometry: GeometryND;
  sliceW: number;
  sliceThickness: number;
  objectPosition: number[];
  rotationAngles: Record<string, number>;
  label: string;
  projectionType: 'perspective' | 'orthographic';
  isAnimatingRotation: boolean;
  rotationSpeed: number;
}

/**
 * Animated slice geometry component using useFrame for smooth animation
 */
function SliceGeometry({ 
  geometry, 
  sliceW, 
  sliceThickness, 
  objectPosition, 
  rotationAngles,
  projectionType,
  isAnimatingRotation,
  rotationSpeed 
}: Omit<SliceViewProps, 'label'>) {
  const linesRef = useRef<THREE.BufferGeometry>(new THREE.BufferGeometry());
  const pointsRef = useRef<THREE.BufferGeometry>(new THREE.BufferGeometry());
  const rotationRef = useRef(0);

  useFrame((_, delta) => {
    // Update rotation animation
    if (isAnimatingRotation) {
      rotationRef.current += delta * rotationSpeed;
    }

    // Apply rotations to geometry
    let rotatedVertices = geometry.vertices;
    
    // Apply XW rotation (most visible for 4D)
    if (rotationRef.current !== 0 || rotationAngles['XW']) {
      const angle = (rotationAngles['XW'] ?? 0) + rotationRef.current;
      const rotation = new RotationND(geometry.dimension, 0, 3, angle);
      rotatedVertices = rotatedVertices.map(v => rotation.apply(v));
    }
    
    // Apply YW rotation
    if (rotationAngles['YW']) {
      const rotation = new RotationND(geometry.dimension, 1, 3, rotationAngles['YW']);
      rotatedVertices = rotatedVertices.map(v => rotation.apply(v));
    }

    // Offset by object position
    const offsetVertices = rotatedVertices.map(v => {
      const coords = v.components.map((c, i) => c + (objectPosition[i] ?? 0));
      return new VectorND(coords);
    });

    const projConfig: ProjectionConfig = { type: projectionType, viewDistance: 3 };

    // Check which vertices are in this slice
    const inSlice: boolean[] = [];
    const projected: VectorND[] = [];
    
    for (const v of offsetVertices) {
      const w = v.get(3) ?? 0;
      const isIn = Math.abs(w - sliceW) <= sliceThickness;
      inSlice.push(isIn);
      
      if (isIn) {
        const slicedCoords = [...v.components];
        slicedCoords[3] = sliceW;
        projected.push(projectTo3D(new VectorND(slicedCoords), projConfig));
      } else {
        projected.push(projectTo3D(v, projConfig));
      }
    }

    // Build geometry data
    const linePositions: number[] = [];
    const lineColors: number[] = [];
    const pointPositions: number[] = [];
    const pointColors: number[] = [];

    // Draw vertices that are in the slice
    for (let i = 0; i < offsetVertices.length; i++) {
      if (inSlice[i]) {
        const p = projected[i];
        pointPositions.push(p.get(0), p.get(1), p.get(2));
        
        const originalW = geometry.vertices[i].get(3) ?? 0;
        const hue = 0.6 - (originalW + 1.5) * 0.2;
        const color = new THREE.Color().setHSL(hue, 0.9, 0.6);
        pointColors.push(color.r, color.g, color.b);
      }
    }

    // Draw edges where both vertices are in slice
    for (const [i, j] of geometry.edges) {
      if (inSlice[i] && inSlice[j]) {
        const p1 = projected[i];
        const p2 = projected[j];
        
        linePositions.push(p1.get(0), p1.get(1), p1.get(2));
        linePositions.push(p2.get(0), p2.get(1), p2.get(2));

        const w1 = geometry.vertices[i].get(3) ?? 0;
        const w2 = geometry.vertices[j].get(3) ?? 0;
        const hue1 = 0.6 - (w1 + 1.5) * 0.2;
        const hue2 = 0.6 - (w2 + 1.5) * 0.2;
        const c1 = new THREE.Color().setHSL(hue1, 0.9, 0.6);
        const c2 = new THREE.Color().setHSL(hue2, 0.9, 0.6);
        
        lineColors.push(c1.r, c1.g, c1.b);
        lineColors.push(c2.r, c2.g, c2.b);
      }
    }

    // Update buffer geometries
    linesRef.current.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    linesRef.current.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
    pointsRef.current.setAttribute('position', new THREE.Float32BufferAttribute(pointPositions, 3));
    pointsRef.current.setAttribute('color', new THREE.Float32BufferAttribute(pointColors, 3));
  });

  return (
    <>
      <lineSegments geometry={linesRef.current}>
        <lineBasicMaterial vertexColors />
      </lineSegments>
      <points geometry={pointsRef.current}>
        <pointsMaterial vertexColors size={0.15} sizeAttenuation />
      </points>
    </>
  );
}

/**
 * A single 3D slice view of the 4D space
 */
function SliceView({ 
  geometry, sliceW, sliceThickness, objectPosition, rotationAngles, label, 
  projectionType, isAnimatingRotation, rotationSpeed 
}: SliceViewProps) {
  // Check if any vertices would be in the slice (for "no intersection" message)
  const hasContent = useMemo(() => {
    for (const v of geometry.vertices) {
      const w = v.get(3) ?? 0;
      const offsetW = w + (objectPosition[3] ?? 0);
      if (Math.abs(offsetW - sliceW) <= sliceThickness) {
        return true;
      }
    }
    return false;
  }, [geometry, objectPosition, sliceW, sliceThickness]);

  return (
    <div className="flex flex-col h-full">
      <div className="text-center text-sm font-bold text-cyan-400 py-1 bg-gray-800/50">
        {label}
      </div>
      <div className="flex-1 bg-gray-900 border border-gray-700 relative min-h-0">
        <Canvas camera={{ position: [3, 2, 3], fov: 50 }}>
          <ambientLight intensity={0.5} />
          
          {/* Slice plane indicator */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[4, 4]} />
            <meshBasicMaterial color="#113333" transparent opacity={0.2} side={THREE.DoubleSide} />
          </mesh>
          
          {/* Grid for reference */}
          <gridHelper args={[4, 8, '#334444', '#223333']} />
          
          <SliceGeometry
            geometry={geometry}
            sliceW={sliceW}
            sliceThickness={sliceThickness}
            objectPosition={objectPosition}
            rotationAngles={rotationAngles}
            projectionType={projectionType}
            isAnimatingRotation={isAnimatingRotation}
            rotationSpeed={rotationSpeed}
          />
          
          <OrbitControls enablePan={false} />
        </Canvas>
        
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-500 text-xs">No intersection</span>
          </div>
        )}
      </div>
    </div>
  );
}

function createGeometry(type: ShapeType, dimension: number): GeometryND {
  switch (type) {
    case 'hypercube': return createHypercube(dimension);
    case 'simplex': return createSimplex(dimension);
    case 'orthoplex': return createOrthoplex(dimension);
    case '24-cell': return create24Cell();
    case '600-cell': return create600Cell();
    case 'clifford-torus': return createCliffordTorus();
    case 'duocylinder': return createDuocylinder();
    case 'hypercone': return createHypercone();
    case 'grand-antiprism': return createGrandAntiprism();
    default: return createHypercube(dimension);
  }
}

interface MultiSliceViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Multi-slice viewer showing multiple 3D slices of 4D space simultaneously
 */
export function MultiSliceViewer({ isOpen, onClose }: MultiSliceViewerProps) {
  const [objectW, setObjectW] = useState(0);
  const [isAnimatingW, setIsAnimatingW] = useState(true);
  const [isAnimatingRotation, setIsAnimatingRotation] = useState(true);
  const [animSpeed, setAnimSpeed] = useState(0.3);
  const [rotationSpeed, setRotationSpeed] = useState(0.5);
  const [shapeType, setShapeType] = useState<ShapeType>('hypercube');
  const [dimension, setDimension] = useState(4);
  const [rotationAngles] = useState<Record<string, number>>({});
  const objectWRef = useRef(0);

  // Smooth animation using requestAnimationFrame
  useEffect(() => {
    if (!isAnimatingW || !isOpen) return;
    
    let animationId: number;
    let lastTime = performance.now();
    
    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      objectWRef.current += animSpeed * delta;
      if (objectWRef.current > 2) objectWRef.current = -2;
      
      setObjectW(objectWRef.current);
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isAnimatingW, animSpeed, isOpen]);

  const geometry = useMemo(() => createGeometry(shapeType, dimension), [shapeType, dimension]);

  // For 4D: show 5 slices at different W values
  // For 5D: show a 3x3 grid of slices at different V and W values
  const sliceConfigs = useMemo(() => {
    if (dimension === 4) {
      return [
        { w: -1.5, label: 'W = -1.5' },
        { w: -0.75, label: 'W = -0.75' },
        { w: 0, label: 'W = 0 (center)' },
        { w: 0.75, label: 'W = +0.75' },
        { w: 1.5, label: 'W = +1.5' },
      ];
    } else if (dimension === 5) {
      const configs = [];
      for (const v of [-1, 0, 1]) {
        for (const w of [-1, 0, 1]) {
          configs.push({ w, v, label: `V=${v}, W=${w}` });
        }
      }
      return configs;
    }
    return [{ w: 0, label: 'W = 0' }];
  }, [dimension]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">
            🎓 Multi-Slice {dimension}D Visualization
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {dimension === 4 
              ? "Each panel shows a 3D slice at a different W-coordinate. Watch the object appear and disappear!"
              : "Each panel shows a 3D slice at different 4th (W) and 5th (V) coordinates."
            }
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
            onChange={(e) => setShapeType(e.target.value as ShapeType)}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="hypercube">Hypercube (Tesseract)</option>
            <option value="simplex">Simplex (5-cell)</option>
            <option value="orthoplex">Orthoplex (16-cell)</option>
            {dimension === 4 && <option value="24-cell">24-cell</option>}
            {dimension === 4 && <option value="600-cell">600-cell</option>}
            {dimension === 4 && <option value="clifford-torus">Clifford Torus</option>}
            {dimension === 4 && <option value="duocylinder">Duocylinder</option>}
            {dimension === 4 && <option value="hypercone">Hypercone</option>}
            {dimension === 4 && <option value="grand-antiprism">Grand Antiprism</option>}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Dimension:</label>
          <select
            value={dimension}
            onChange={(e) => setDimension(Number(e.target.value))}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value={4}>4D</option>
            <option value={5}>5D</option>
          </select>
        </div>

        <div className="border-l border-gray-600 pl-4 flex items-center gap-2">
          <label className="text-sm text-gray-400">W Position:</label>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.01"
            value={objectW}
            onChange={(e) => { setObjectW(Number(e.target.value)); objectWRef.current = Number(e.target.value); }}
            className="w-24"
          />
          <span className="text-cyan-400 font-mono text-sm w-12">{objectW.toFixed(2)}</span>
        </div>

        <button
          onClick={() => setIsAnimatingW(!isAnimatingW)}
          className={`px-3 py-1 rounded text-sm ${
            isAnimatingW ? 'bg-cyan-600' : 'bg-gray-700'
          }`}
        >
          {isAnimatingW ? '⏸ W' : '▶ W'}
        </button>

        <button
          onClick={() => setIsAnimatingRotation(!isAnimatingRotation)}
          className={`px-3 py-1 rounded text-sm ${
            isAnimatingRotation ? 'bg-green-600' : 'bg-gray-700'
          }`}
        >
          {isAnimatingRotation ? '⏸ Rotate' : '▶ Rotate'}
        </button>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">W Speed:</label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={animSpeed}
            onChange={(e) => setAnimSpeed(Number(e.target.value))}
            className="w-16"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Rotation:</label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={rotationSpeed}
            onChange={(e) => setRotationSpeed(Number(e.target.value))}
            className="w-16"
          />
        </div>
      </div>

      {/* Slice Grid */}
      <div className={`flex-1 p-4 grid gap-2 min-h-0 ${
        dimension === 5 ? 'grid-cols-3 grid-rows-3' : 'grid-cols-5'
      }`}>
        {sliceConfigs.map((config, i) => (
          <SliceView
            key={i}
            geometry={geometry}
            sliceW={config.w}
            sliceThickness={0.6}
            objectPosition={[0, 0, 0, objectW, 0]}
            rotationAngles={rotationAngles}
            label={config.label}
            projectionType="perspective"
            isAnimatingRotation={isAnimatingRotation}
            rotationSpeed={rotationSpeed}
          />
        ))}
      </div>

      {/* Educational Footer */}
      <div className="bg-gray-900 border-t border-gray-700 p-4">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-cyan-400 font-bold mb-2">💡 What You're Seeing</h3>
          <p className="text-gray-300 text-sm">
            {dimension === 4 ? (
              <>
                Imagine you're a 3D being trying to understand 4D. Each panel is like a different "room" 
                in 4D space, located at different W-coordinates. As the object moves through W (the 4th dimension), 
                it appears in some rooms and disappears from others. Just like a 3D ball passing through a 2D plane 
                appears as a growing and shrinking circle, a 4D object passing through 3D space appears, grows, 
                shrinks, and vanishes!
              </>
            ) : (
              <>
                Now you're seeing 5D! The grid shows different combinations of the 4th (W) and 5th (V) coordinates.
                Each panel is a 3D slice of the 5D space. As the object moves through higher dimensions, it 
                appears in different 3D "rooms" simultaneously. This is how a 5D being would perceive 
                lower-dimensional slices of their world!
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
