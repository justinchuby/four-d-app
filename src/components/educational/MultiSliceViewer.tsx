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
 * A single 3D slice view of the 4D space
 */
function SliceView({ geometry, sliceW, sliceThickness, objectPosition, label, projectionType }: SliceViewProps) {
  // Transform geometry by object position and filter to slice
  const slicedGeometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const linePositions: number[] = [];
    const lineColors: number[] = [];

    // Offset all vertices by object position
    const offsetVertices = geometry.vertices.map(v => {
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
      
      // Create a modified vertex at the slice position for projection
      if (isIn) {
        const slicedCoords = [...v.components];
        slicedCoords[3] = sliceW; // Project onto the slice plane
        projected.push(projectTo3D(new VectorND(slicedCoords), projConfig));
      } else {
        projected.push(projectTo3D(v, projConfig));
      }
    }

    // Draw vertices that are in the slice
    for (let i = 0; i < offsetVertices.length; i++) {
      if (inSlice[i]) {
        const p = projected[i];
        positions.push(p.get(0), p.get(1), p.get(2));
        
        // Color based on original W coordinate (before offset)
        const originalW = geometry.vertices[i].get(3) ?? 0;
        const hue = 0.6 - (originalW + 1.5) * 0.2;
        const color = new THREE.Color().setHSL(hue, 0.9, 0.6);
        colors.push(color.r, color.g, color.b);
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

    return { positions, colors, linePositions, lineColors };
  }, [geometry, sliceW, sliceThickness, objectPosition, projectionType]);

  const pointsGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(slicedGeometry.positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(slicedGeometry.colors, 3));
    return geo;
  }, [slicedGeometry]);

  const linesGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(slicedGeometry.linePositions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(slicedGeometry.lineColors, 3));
    return geo;
  }, [slicedGeometry]);

  const hasContent = slicedGeometry.positions.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="text-center text-sm font-bold text-cyan-400 py-1 bg-gray-800/50">
        {label}
      </div>
      <div className="flex-1 bg-gray-900 border border-gray-700 relative">
        <Canvas camera={{ position: [3, 2, 3], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          
          {/* Slice plane indicator */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[4, 4]} />
            <meshBasicMaterial color="#113333" transparent opacity={0.2} side={THREE.DoubleSide} />
          </mesh>
          
          {/* Grid for reference */}
          <gridHelper args={[4, 8, '#334444', '#223333']} />
          
          {hasContent ? (
            <>
              <lineSegments geometry={linesGeometry}>
                <lineBasicMaterial vertexColors />
              </lineSegments>
              <points geometry={pointsGeometry}>
                <pointsMaterial vertexColors size={0.15} sizeAttenuation />
              </points>
            </>
          ) : (
            <mesh>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshBasicMaterial color="#333333" transparent opacity={0.3} />
            </mesh>
          )}
          
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

interface MultiSliceViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Multi-slice viewer showing multiple 3D slices of 4D space simultaneously
 */
export function MultiSliceViewer({ isOpen, onClose }: MultiSliceViewerProps) {
  const [objectW, setObjectW] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [animSpeed, setAnimSpeed] = useState(0.5);
  const [shapeType, setShapeType] = useState<'hypercube' | 'simplex' | '24-cell'>('hypercube');
  const [dimension, setDimension] = useState(4);

  // Animation
  useEffect(() => {
    if (!isAnimating || !isOpen) return;
    
    const interval = setInterval(() => {
      setObjectW(w => {
        const newW = w + animSpeed * 0.05;
        return newW > 2 ? -2 : newW;
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, [isAnimating, animSpeed, isOpen]);

  const geometry = useMemo(() => {
    switch (shapeType) {
      case 'simplex': return createSimplex(dimension);
      case '24-cell': return create24Cell();
      default: return createHypercube(dimension);
    }
  }, [shapeType, dimension]);

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
      // 3x3 grid: rows are V values, columns are W values
      const configs = [];
      for (const v of [-1, 0, 1]) {
        for (const w of [-1, 0, 1]) {
          configs.push({ 
            w, 
            v, 
            label: `V=${v}, W=${w}` 
          });
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
            onChange={(e) => setShapeType(e.target.value as typeof shapeType)}
            className="bg-gray-700 rounded px-2 py-1 text-sm text-white"
          >
            <option value="hypercube">Hypercube</option>
            <option value="simplex">Simplex</option>
            {dimension === 4 && <option value="24-cell">24-cell</option>}
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

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Object W:</label>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={objectW}
            onChange={(e) => setObjectW(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-cyan-400 font-mono text-sm w-12">{objectW.toFixed(1)}</span>
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

      {/* Slice Grid */}
      <div className={`flex-1 p-4 grid gap-4 ${
        dimension === 5 ? 'grid-cols-3 grid-rows-3' : 'grid-cols-5'
      }`}>
        {sliceConfigs.map((config, i) => (
          <SliceView
            key={i}
            geometry={geometry}
            sliceW={config.w}
            sliceThickness={0.6}
            objectPosition={[0, 0, 0, objectW, 0]}
            label={config.label}
            projectionType="perspective"
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
