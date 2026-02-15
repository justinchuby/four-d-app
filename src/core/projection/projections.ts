import { VectorND } from '../math/VectorND';

/**
 * Projection types available for reducing dimensions
 */
export type ProjectionType = 'perspective' | 'orthographic' | 'stereographic';

/**
 * Configuration for projections
 */
export interface ProjectionConfig {
  type: ProjectionType;
  /** For perspective: distance of the viewpoint from origin in the higher dimension */
  viewDistance?: number;
  /** For stereographic: position of projection pole */
  poleDistance?: number;
}

/**
 * Project an N-dimensional point to (N-1) dimensions using perspective projection.
 * 
 * This mimics how we see 3D objects: points further away appear smaller.
 * In 4D→3D, points with larger W values are "further away" in the 4th dimension.
 * 
 * @param point - N-dimensional point to project
 * @param viewDistance - Distance of the viewpoint from origin along the last axis
 * @returns (N-1)-dimensional projected point
 */
export function perspectiveProject(point: VectorND, viewDistance = 2): VectorND {
  const n = point.dimension;
  if (n < 2) return point;
  
  const lastCoord = point.get(n - 1);
  const scale = viewDistance / (viewDistance - lastCoord);
  
  const result: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    result.push(point.get(i) * scale);
  }
  
  return new VectorND(result);
}

/**
 * Project an N-dimensional point to (N-1) dimensions using orthographic projection.
 * 
 * Simply drops the last coordinate. No depth effect.
 * Good for understanding the "true" shape without perspective distortion.
 * 
 * @param point - N-dimensional point to project
 * @returns (N-1)-dimensional projected point
 */
export function orthographicProject(point: VectorND): VectorND {
  return point.truncate(point.dimension - 1);
}

/**
 * Project an N-dimensional point to (N-1) dimensions using stereographic projection.
 * 
 * Projects from a "north pole" onto a hyperplane. This projection is conformal
 * (preserves angles) and maps circles to circles.
 * 
 * @param point - N-dimensional point (typically on or near a hypersphere)
 * @param poleDistance - Distance of the projection pole from origin
 * @returns (N-1)-dimensional projected point
 */
export function stereographicProject(point: VectorND, poleDistance = 1): VectorND {
  const n = point.dimension;
  if (n < 2) return point;
  
  const lastCoord = point.get(n - 1);
  const scale = poleDistance / (poleDistance - lastCoord);
  
  const result: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    result.push(point.get(i) * scale);
  }
  
  return new VectorND(result);
}

/**
 * Generic projection function based on config
 */
export function project(point: VectorND, config: ProjectionConfig): VectorND {
  switch (config.type) {
    case 'perspective':
      return perspectiveProject(point, config.viewDistance ?? 2);
    case 'orthographic':
      return orthographicProject(point);
    case 'stereographic':
      return stereographicProject(point, config.poleDistance ?? 1);
    default:
      return orthographicProject(point);
  }
}

/**
 * Project an N-dimensional point down to 3D through multiple projection steps.
 * 
 * Projects one dimension at a time: N → (N-1) → (N-2) → ... → 3
 * Each step uses the same projection type.
 * 
 * @param point - N-dimensional point to project
 * @param config - Projection configuration
 * @returns 3D point ready for Three.js rendering
 */
export function projectTo3D(point: VectorND, config: ProjectionConfig): VectorND {
  let current = point;
  
  while (current.dimension > 3) {
    current = project(current, config);
  }
  
  return current;
}

/**
 * Project multiple points to 3D
 */
export function projectPointsTo3D(points: VectorND[], config: ProjectionConfig): VectorND[] {
  return points.map(p => projectTo3D(p, config));
}

/**
 * Get depth value for coloring (how far in the higher dimensions)
 * Returns a value between 0 and 1 based on the last coordinate
 */
export function getDepthValue(point: VectorND, minVal = -1, maxVal = 1): number {
  const lastCoord = point.get(point.dimension - 1);
  return (lastCoord - minVal) / (maxVal - minVal);
}
