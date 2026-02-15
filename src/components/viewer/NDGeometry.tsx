import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../stores/appStore';
import { MatrixND, RotationND, getRotationPlanes, getRotationPlaneNames } from '../../core/math';
import { projectTo3D, type ProjectionConfig } from '../../core/projection';
import { createHypercube, createSimplex, createOrthoplex, create24Cell, type GeometryND } from '../../core/geometry';

/**
 * Creates the N-dimensional geometry based on current settings
 */
function createGeometry(type: string, dimension: number): GeometryND {
  switch (type) {
    case 'hypercube':
      return createHypercube(dimension);
    case 'simplex':
      return createSimplex(dimension);
    case 'orthoplex':
      return createOrthoplex(dimension);
    case '24-cell':
      return create24Cell();
    default:
      return createHypercube(dimension);
  }
}

/**
 * Builds a rotation matrix from the current rotation angles
 */
function buildRotationMatrix(dimension: number, angles: Record<string, number>): MatrixND {
  const planes = getRotationPlanes(dimension);
  const planeNames = getRotationPlaneNames(dimension);
  
  let matrix = MatrixND.identity(dimension);
  
  for (let i = 0; i < planes.length; i++) {
    const angle = angles[planeNames[i]] ?? 0;
    if (Math.abs(angle) > 0.0001) {
      const rotation = new RotationND(dimension, planes[i][0], planes[i][1], angle);
      matrix = rotation.toMatrix().multiply(matrix);
    }
  }
  
  return matrix;
}

interface NDGeometryProps {
  lineWidth?: number;
}

/**
 * Renders an N-dimensional geometry projected to 3D
 */
export function NDGeometry({ lineWidth = 2 }: NDGeometryProps) {
  const { 
    geometryType, 
    dimension,
    customGeometry,
    projectionType, 
    viewDistance,
    isAnimating,
    animationSpeed,
    activeRotationPlanes,
  } = useAppStore();
  
  // Create the base geometry
  const baseGeometry = useMemo(() => {
    if (geometryType === 'custom' && customGeometry) {
      return customGeometry;
    }
    return createGeometry(geometryType, dimension);
  }, [geometryType, dimension, customGeometry]);
  
  // Create refs for the lines geometry
  const linesRef = useMemo(() => {
    return { current: new THREE.BufferGeometry() };
  }, []);
  
  // Create refs for vertex points
  const pointsRef = useMemo(() => {
    return { current: new THREE.BufferGeometry() };
  }, []);

  // Update geometry each frame
  useFrame((_, delta) => {
    // Update rotation angles for animation
    if (isAnimating) {
      const planes = getRotationPlaneNames(dimension);
      const newAngles = { ...useAppStore.getState().rotationAngles };
      
      for (const plane of activeRotationPlanes) {
        if (planes.includes(plane)) {
          newAngles[plane] = (newAngles[plane] ?? 0) + delta * animationSpeed;
        }
      }
      
      // Update store directly (avoid re-render cascade)
      useAppStore.setState({ rotationAngles: newAngles });
    }
    
    // Get current angles
    const currentAngles = useAppStore.getState().rotationAngles;
    
    // Build rotation matrix
    const rotationMatrix = buildRotationMatrix(dimension, currentAngles);
    
    // Transform vertices
    const transformedVertices = baseGeometry.vertices.map(v => 
      rotationMatrix.transform(v)
    );
    
    // Project to 3D
    const projectionConfig: ProjectionConfig = {
      type: projectionType,
      viewDistance,
    };
    
    const projectedVertices = transformedVertices.map(v => 
      projectTo3D(v, projectionConfig)
    );
    
    // Build line segments for edges
    const positions: number[] = [];
    const colors: number[] = [];
    
    for (const [i, j] of baseGeometry.edges) {
      const v1 = projectedVertices[i];
      const v2 = projectedVertices[j];
      
      // Add vertices
      positions.push(v1.get(0), v1.get(1), v1.get(2));
      positions.push(v2.get(0), v2.get(1), v2.get(2));
      
      // Color based on depth in higher dimension (W coordinate before projection)
      const w1 = transformedVertices[i].get(3) ?? 0;
      const w2 = transformedVertices[j].get(3) ?? 0;
      
      // Map W from [-1, 1] to hue [0.6 (blue) to 0 (red)]
      const hue1 = 0.6 - (w1 + 1) * 0.3;
      const hue2 = 0.6 - (w2 + 1) * 0.3;
      
      const color1 = new THREE.Color().setHSL(hue1, 0.8, 0.6);
      const color2 = new THREE.Color().setHSL(hue2, 0.8, 0.6);
      
      colors.push(color1.r, color1.g, color1.b);
      colors.push(color2.r, color2.g, color2.b);
    }
    
    // Update buffer geometry for lines
    linesRef.current.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    linesRef.current.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    );
    
    // Build vertex points
    const pointPositions: number[] = [];
    const pointColors: number[] = [];
    
    for (let i = 0; i < projectedVertices.length; i++) {
      const v = projectedVertices[i];
      pointPositions.push(v.get(0), v.get(1), v.get(2));
      
      const w = transformedVertices[i].get(3) ?? 0;
      const hue = 0.6 - (w + 1) * 0.3;
      const color = new THREE.Color().setHSL(hue, 0.9, 0.7);
      pointColors.push(color.r, color.g, color.b);
    }
    
    pointsRef.current.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(pointPositions, 3)
    );
    pointsRef.current.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(pointColors, 3)
    );
  });

  return (
    <group>
      <lineSegments geometry={linesRef.current}>
        <lineBasicMaterial vertexColors linewidth={lineWidth} />
      </lineSegments>
      <points geometry={pointsRef.current}>
        <pointsMaterial vertexColors size={0.08} sizeAttenuation />
      </points>
    </group>
  );
}
