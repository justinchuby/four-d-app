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
 * Compute intersection point of an edge with the W=sliceW hyperplane
 */
function computeSliceIntersection(v1: VectorND, v2: VectorND, sliceW: number): VectorND | null {
  const w1 = v1.get(3) ?? 0;
  const w2 = v2.get(3) ?? 0;
  
  // Check if the edge crosses the slice plane
  if ((w1 - sliceW) * (w2 - sliceW) > 0) {
    return null; // Both on same side, no intersection
  }
  
  // Compute interpolation parameter
  const t = (sliceW - w1) / (w2 - w1);
  if (t < 0 || t > 1) return null;
  
  // Interpolate all coordinates
  const coords = v1.components.map((c, i) => c + t * (v2.get(i) - c));
  coords[3] = sliceW; // Ensure exact W value
  return new VectorND(coords);
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
  const meshRef = useRef<THREE.BufferGeometry>(new THREE.BufferGeometry());
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
    const sliceMin = sliceW - sliceThickness;
    const sliceMax = sliceW + sliceThickness;

    // Check which vertices are in this slice
    const vertexW: number[] = [];
    const inSlice: boolean[] = [];
    
    for (const v of offsetVertices) {
      const w = v.get(3) ?? 0;
      vertexW.push(w);
      inSlice.push(w >= sliceMin && w <= sliceMax);
    }

    // Build geometry data
    const linePositions: number[] = [];
    const lineColors: number[] = [];
    const pointPositions: number[] = [];
    const pointColors: number[] = [];
    const facePositions: number[] = [];
    const faceColors: number[] = [];

    // Draw vertices that are in the slice
    for (let i = 0; i < offsetVertices.length; i++) {
      if (inSlice[i]) {
        const slicedCoords = [...offsetVertices[i].components];
        slicedCoords[3] = sliceW;
        const p = projectTo3D(new VectorND(slicedCoords), projConfig);
        
        pointPositions.push(p.get(0), p.get(1), p.get(2));
        
        const originalW = geometry.vertices[i].get(3) ?? 0;
        const hue = 0.6 - (originalW + 1.5) * 0.2;
        const color = new THREE.Color().setHSL(hue, 0.9, 0.6);
        pointColors.push(color.r, color.g, color.b);
      }
    }

    // Draw edges - clip to slice bounds
    for (const [i, j] of geometry.edges) {
      const w1 = vertexW[i];
      const w2 = vertexW[j];
      
      // Skip if both vertices are completely outside on the same side
      if ((w1 < sliceMin && w2 < sliceMin) || (w1 > sliceMax && w2 > sliceMax)) {
        continue;
      }

      // Get start and end points (possibly clipped)
      let start = offsetVertices[i];
      let end = offsetVertices[j];

      // Clip start point if outside
      if (w1 < sliceMin) {
        const intersection = computeSliceIntersection(offsetVertices[i], offsetVertices[j], sliceMin);
        if (intersection) start = intersection;
      } else if (w1 > sliceMax) {
        const intersection = computeSliceIntersection(offsetVertices[i], offsetVertices[j], sliceMax);
        if (intersection) start = intersection;
      }

      // Clip end point if outside
      if (w2 < sliceMin) {
        const intersection = computeSliceIntersection(offsetVertices[j], offsetVertices[i], sliceMin);
        if (intersection) end = intersection;
      } else if (w2 > sliceMax) {
        const intersection = computeSliceIntersection(offsetVertices[j], offsetVertices[i], sliceMax);
        if (intersection) end = intersection;
      }

      // Project clipped points
      const startSliced = [...start.components];
      startSliced[3] = sliceW;
      const endSliced = [...end.components];
      endSliced[3] = sliceW;
      
      const p1 = projectTo3D(new VectorND(startSliced), projConfig);
      const p2 = projectTo3D(new VectorND(endSliced), projConfig);
      
      linePositions.push(p1.get(0), p1.get(1), p1.get(2));
      linePositions.push(p2.get(0), p2.get(1), p2.get(2));

      const origW1 = geometry.vertices[i].get(3) ?? 0;
      const origW2 = geometry.vertices[j].get(3) ?? 0;
      const hue1 = 0.6 - (origW1 + 1.5) * 0.2;
      const hue2 = 0.6 - (origW2 + 1.5) * 0.2;
      const c1 = new THREE.Color().setHSL(hue1, 0.9, 0.6);
      const c2 = new THREE.Color().setHSL(hue2, 0.9, 0.6);
      
      lineColors.push(c1.r, c1.g, c1.b);
      lineColors.push(c2.r, c2.g, c2.b);
    }

    // Draw faces - only if all vertices are in slice
    if (geometry.faces) {
      for (const face of geometry.faces) {
        const faceInSlice = face.every(vi => inSlice[vi]);
        if (!faceInSlice) continue;

        // Project face vertices
        const projectedFace = face.map(vi => {
          const slicedCoords = [...offsetVertices[vi].components];
          slicedCoords[3] = sliceW;
          return projectTo3D(new VectorND(slicedCoords), projConfig);
        });

        // Triangulate (fan from first vertex)
        for (let k = 1; k < projectedFace.length - 1; k++) {
          const p0 = projectedFace[0];
          const p1 = projectedFace[k];
          const p2 = projectedFace[k + 1];
          
          facePositions.push(p0.get(0), p0.get(1), p0.get(2));
          facePositions.push(p1.get(0), p1.get(1), p1.get(2));
          facePositions.push(p2.get(0), p2.get(1), p2.get(2));

          // Color by average W
          const avgW = face.reduce((sum, vi) => sum + (geometry.vertices[vi].get(3) ?? 0), 0) / face.length;
          const hue = 0.6 - (avgW + 1.5) * 0.2;
          const color = new THREE.Color().setHSL(hue, 0.7, 0.5);
          
          for (let v = 0; v < 3; v++) {
            faceColors.push(color.r, color.g, color.b);
          }
        }
      }
    }

    // Update buffer geometries
    linesRef.current.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    linesRef.current.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
    pointsRef.current.setAttribute('position', new THREE.Float32BufferAttribute(pointPositions, 3));
    pointsRef.current.setAttribute('color', new THREE.Float32BufferAttribute(pointColors, 3));
    meshRef.current.setAttribute('position', new THREE.Float32BufferAttribute(facePositions, 3));
    meshRef.current.setAttribute('color', new THREE.Float32BufferAttribute(faceColors, 3));
  });

  return (
    <>
      <mesh geometry={meshRef.current}>
        <meshBasicMaterial vertexColors transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <lineSegments geometry={linesRef.current}>
        <lineBasicMaterial vertexColors />
      </lineSegments>
      <points geometry={pointsRef.current}>
        <pointsMaterial vertexColors size={0.12} sizeAttenuation />
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
  // Check if any edges cross through the slice (not just vertices)
  const hasContent = useMemo(() => {
    const sliceMin = sliceW - sliceThickness;
    const sliceMax = sliceW + sliceThickness;
    
    for (const [i, j] of geometry.edges) {
      const w1 = (geometry.vertices[i].get(3) ?? 0) + (objectPosition[3] ?? 0);
      const w2 = (geometry.vertices[j].get(3) ?? 0) + (objectPosition[3] ?? 0);
      
      // Edge intersects if one vertex is below and one above, or either is inside
      if ((w1 >= sliceMin && w1 <= sliceMax) || (w2 >= sliceMin && w2 <= sliceMax)) {
        return true;
      }
      if ((w1 < sliceMin && w2 > sliceMax) || (w1 > sliceMax && w2 < sliceMin)) {
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
