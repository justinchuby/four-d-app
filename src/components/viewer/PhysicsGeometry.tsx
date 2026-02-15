import { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../stores/appStore';
import { PhysicsEngine } from '../../core/physics';
import { projectTo3D, type ProjectionConfig } from '../../core/projection';
import { 
  createHypercube, createSimplex, createOrthoplex, create24Cell,
  create600Cell, createCliffordTorus, createDuocylinder, createHypercone, createGrandAntiprism,
  type GeometryND 
} from '../../core/geometry';

function createGeometry(type: string, dimension: number): GeometryND {
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

interface PhysicsGeometryProps {
  lineWidth?: number;
}

export function PhysicsGeometry({ lineWidth = 2 }: PhysicsGeometryProps) {
  const {
    geometryType,
    dimension,
    customGeometry,
    renderMode,
    projectionType,
    viewDistance,
    physicsEnabled,
    gravityAxis,
    physicsResetKey,
  } = useAppStore();

  // Create base geometry
  const baseGeometry = useMemo(() => {
    if (geometryType === 'custom' && customGeometry) {
      return customGeometry;
    }
    return createGeometry(geometryType, dimension);
  }, [geometryType, dimension, customGeometry]);

  // Physics engine reference
  const physicsRef = useRef<PhysicsEngine | null>(null);

  // Initialize or reset physics when geometry changes or reset is triggered
  useEffect(() => {
    if (!physicsEnabled) {
      physicsRef.current = null;
      return;
    }

    const engine = new PhysicsEngine(dimension);
    engine.addGeometryParticles(baseGeometry.vertices);
    engine.setGravityAxis(gravityAxis);
    physicsRef.current = engine;
  }, [physicsEnabled, baseGeometry, dimension, gravityAxis, physicsResetKey]);

  // Update gravity when axis changes
  useEffect(() => {
    if (physicsRef.current) {
      physicsRef.current.setGravityAxis(gravityAxis);
    }
  }, [gravityAxis]);

  // Buffer geometries
  const linesRef = useMemo(() => ({ current: new THREE.BufferGeometry() }), []);
  const pointsRef = useMemo(() => ({ current: new THREE.BufferGeometry() }), []);
  const meshRef = useMemo(() => ({ current: new THREE.BufferGeometry() }), []);

  useFrame((_, delta) => {
    if (!physicsEnabled || !physicsRef.current) return;

    // Calculate average edge length for spring rest length
    let totalLength = 0;
    for (const [i, j] of baseGeometry.edges) {
      totalLength += baseGeometry.vertices[i].subtract(baseGeometry.vertices[j]).magnitude();
    }
    const avgLength = totalLength / baseGeometry.edges.length;

    // Step physics with clamped delta for stability
    physicsRef.current.step(delta, baseGeometry.edges);
    
    // Additional spring passes for structure stability
    physicsRef.current.applySpringForces(baseGeometry.edges, avgLength, 0.2);

    // Get simulated positions
    const positions = physicsRef.current.getPositions();

    // Project to 3D
    const projectionConfig: ProjectionConfig = {
      type: projectionType,
      viewDistance,
    };

    const projectedVertices = positions.map(v => projectTo3D(v, projectionConfig));

    // Build edges
    const linePositions: number[] = [];
    const lineColors: number[] = [];

    for (const [i, j] of baseGeometry.edges) {
      const v1 = projectedVertices[i];
      const v2 = projectedVertices[j];

      linePositions.push(v1.get(0), v1.get(1), v1.get(2));
      linePositions.push(v2.get(0), v2.get(1), v2.get(2));

      const w1 = positions[i].get(3) ?? 0;
      const w2 = positions[j].get(3) ?? 0;
      const hue1 = 0.6 - (w1 + 2.5) * 0.12;
      const hue2 = 0.6 - (w2 + 2.5) * 0.12;

      const color1 = new THREE.Color().setHSL(hue1, 0.8, 0.6);
      const color2 = new THREE.Color().setHSL(hue2, 0.8, 0.6);

      lineColors.push(color1.r, color1.g, color1.b);
      lineColors.push(color2.r, color2.g, color2.b);
    }

    linesRef.current.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    linesRef.current.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));

    // Build points
    const pointPositions: number[] = [];
    const pointColors: number[] = [];

    for (let i = 0; i < projectedVertices.length; i++) {
      const v = projectedVertices[i];
      pointPositions.push(v.get(0), v.get(1), v.get(2));

      const w = positions[i].get(3) ?? 0;
      const hue = 0.6 - (w + 2.5) * 0.12;
      const color = new THREE.Color().setHSL(hue, 0.9, 0.7);
      pointColors.push(color.r, color.g, color.b);
    }

    pointsRef.current.setAttribute('position', new THREE.Float32BufferAttribute(pointPositions, 3));
    pointsRef.current.setAttribute('color', new THREE.Float32BufferAttribute(pointColors, 3));

    // Build faces
    if (baseGeometry.faces && baseGeometry.faces.length > 0) {
      const facePositions: number[] = [];
      const faceColors: number[] = [];

      for (const face of baseGeometry.faces) {
        if (face.length === 3) {
          for (const idx of face) {
            const v = projectedVertices[idx];
            facePositions.push(v.get(0), v.get(1), v.get(2));

            const w = positions[idx].get(3) ?? 0;
            const hue = 0.6 - (w + 2.5) * 0.12;
            const color = new THREE.Color().setHSL(hue, 0.6, 0.5);
            faceColors.push(color.r, color.g, color.b);
          }
        } else if (face.length === 4) {
          const triangles = [[0, 1, 2], [0, 2, 3]];
          for (const tri of triangles) {
            for (const t of tri) {
              const idx = face[t];
              const v = projectedVertices[idx];
              facePositions.push(v.get(0), v.get(1), v.get(2));

              const w = positions[idx].get(3) ?? 0;
              const hue = 0.6 - (w + 2.5) * 0.12;
              const color = new THREE.Color().setHSL(hue, 0.6, 0.5);
              faceColors.push(color.r, color.g, color.b);
            }
          }
        }
      }

      meshRef.current.setAttribute('position', new THREE.Float32BufferAttribute(facePositions, 3));
      meshRef.current.setAttribute('color', new THREE.Float32BufferAttribute(faceColors, 3));
      meshRef.current.computeVertexNormals();
    }
  });

  if (!physicsEnabled) return null;

  const showWireframe = renderMode === 'wireframe' || renderMode === 'both';
  const showFaces = renderMode === 'solid' || renderMode === 'both';

  // Boundary box size (projected from physics bounds)
  const boxSize = 4;
  
  // Create gravity arrow geometry
  const gravityArrowsGeometry = useMemo(() => {
    const positions: number[] = [];
    const arrowLength = 0.5;
    const spacing = 1.2;
    
    // Create a grid of gravity arrows
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        const startX = x * spacing;
        const startY = 1.8;
        const startZ = z * spacing;
        
        let endX = startX;
        let endY = startY;
        let endZ = startZ;
        
        if (gravityAxis === 0) { // X
          endX -= arrowLength;
        } else if (gravityAxis === 1) { // Y
          endY -= arrowLength;
        } else if (gravityAxis === 2) { // Z
          endZ -= arrowLength;
        } else { // W or higher - show as diagonal down + inward
          endY -= arrowLength * 0.7;
          endX *= 0.8;
          endZ *= 0.8;
        }
        
        positions.push(startX, startY, startZ);
        positions.push(endX, endY, endZ);
      }
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [gravityAxis]);

  // Arrow head positions and rotations
  const arrowHeads = useMemo(() => {
    const heads: { position: [number, number, number]; rotation: [number, number, number] }[] = [];
    const arrowLength = 0.5;
    const spacing = 1.2;
    
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        let endX = x * spacing;
        let endY = 1.8;
        let endZ = z * spacing;
        let rotX = 0, rotY = 0, rotZ = 0;
        
        if (gravityAxis === 0) { // X
          endX -= arrowLength;
          rotZ = Math.PI / 2;
        } else if (gravityAxis === 1) { // Y
          endY -= arrowLength;
          rotX = Math.PI;
        } else if (gravityAxis === 2) { // Z
          endZ -= arrowLength;
          rotX = Math.PI / 2;
        } else { // W or higher
          endY -= arrowLength * 0.7;
          endX *= 0.8;
          endZ *= 0.8;
          rotX = Math.PI * 0.85;
        }
        
        heads.push({ position: [endX, endY, endZ], rotation: [rotX, rotY, rotZ] });
      }
    }
    return heads;
  }, [gravityAxis]);

  return (
    <group>
      {/* Gravity field arrows */}
      <group>
        <lineSegments geometry={gravityArrowsGeometry}>
          <lineBasicMaterial color="#ff6666" transparent opacity={0.7} />
        </lineSegments>
        {arrowHeads.map((head, i) => (
          <mesh key={i} position={head.position} rotation={head.rotation}>
            <coneGeometry args={[0.05, 0.12, 6]} />
            <meshBasicMaterial color="#ff6666" transparent opacity={0.8} />
          </mesh>
        ))}
      </group>

      {/* Boundary box to show the physics container */}
      <group>
        <mesh position={[0, -boxSize/2, 0]}>
          <planeGeometry args={[boxSize, boxSize]} />
          <meshBasicMaterial color="#331111" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(boxSize, boxSize, boxSize)]} />
          <lineBasicMaterial color="#663333" transparent opacity={0.4} />
        </lineSegments>
      </group>

      {/* The physics-simulated geometry */}
      {showFaces && baseGeometry.faces && baseGeometry.faces.length > 0 && (
        <mesh geometry={meshRef.current}>
          <meshBasicMaterial vertexColors transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
      {showWireframe && (
        <>
          <lineSegments geometry={linesRef.current}>
            <lineBasicMaterial vertexColors linewidth={lineWidth} />
          </lineSegments>
          <points geometry={pointsRef.current}>
            <pointsMaterial vertexColors size={0.15} sizeAttenuation />
          </points>
        </>
      )}
    </group>
  );
}
