import { MatrixND } from './MatrixND';
import { VectorND } from './VectorND';

/**
 * Represents a rotation in N-dimensional space.
 * 
 * Key insight: In N dimensions, rotations happen in 2D PLANES, not around axes.
 * A 4D rotation is defined by specifying a plane (pair of axes) and an angle.
 * 
 * For example, in 4D there are 6 fundamental rotation planes:
 * - XY, XZ, XW (rotations involving X)
 * - YZ, YW (rotations involving Y but not X)
 * - ZW (rotation involving Z and W only)
 * 
 * In general, N-dimensional space has N(N-1)/2 rotation planes.
 */
export class RotationND {
  readonly dimension: number;
  readonly axis1: number;
  readonly axis2: number;
  readonly angle: number;

  constructor(dimension: number, axis1: number, axis2: number, angle: number) {
    if (axis1 === axis2) {
      throw new Error('Rotation plane must be defined by two different axes');
    }
    if (axis1 >= dimension || axis2 >= dimension) {
      throw new Error(`Axes ${axis1}, ${axis2} out of bounds for dimension ${dimension}`);
    }
    
    this.dimension = dimension;
    this.axis1 = Math.min(axis1, axis2);
    this.axis2 = Math.max(axis1, axis2);
    this.angle = angle;
  }

  /**
   * Get the rotation matrix for this rotation
   */
  toMatrix(): MatrixND {
    return MatrixND.rotation(this.dimension, this.axis1, this.axis2, this.angle);
  }

  /**
   * Apply this rotation to a vector
   */
  apply(vector: VectorND): VectorND {
    if (vector.dimension !== this.dimension) {
      throw new Error(`Vector dimension ${vector.dimension} doesn't match rotation dimension ${this.dimension}`);
    }
    return this.toMatrix().transform(vector);
  }

  /**
   * Compose multiple rotations into a single transformation matrix.
   * Rotations are applied in order: first rotation first.
   */
  static compose(rotations: RotationND[]): MatrixND {
    if (rotations.length === 0) {
      throw new Error('Cannot compose empty rotation list');
    }
    
    const dimension = rotations[0].dimension;
    let result = MatrixND.identity(dimension);
    
    for (const rotation of rotations) {
      if (rotation.dimension !== dimension) {
        throw new Error('All rotations must have the same dimension');
      }
      result = rotation.toMatrix().multiply(result);
    }
    
    return result;
  }

  /**
   * Create a string representation of the rotation plane
   */
  getPlaneName(): string {
    const axisNames = ['X', 'Y', 'Z', 'W', 'V', 'U'];
    const name1 = axisNames[this.axis1] ?? `A${this.axis1}`;
    const name2 = axisNames[this.axis2] ?? `A${this.axis2}`;
    return `${name1}${name2}`;
  }

  toString(): string {
    const degrees = (this.angle * 180 / Math.PI).toFixed(1);
    return `Rotation(${this.getPlaneName()}, ${degrees}°)`;
  }
}

/**
 * Helper to get all rotation planes for a given dimension.
 * Returns pairs of axis indices.
 */
export function getRotationPlanes(dimension: number): [number, number][] {
  const planes: [number, number][] = [];
  for (let i = 0; i < dimension; i++) {
    for (let j = i + 1; j < dimension; j++) {
      planes.push([i, j]);
    }
  }
  return planes;
}

/**
 * Get human-readable names for rotation planes
 */
export function getRotationPlaneNames(dimension: number): string[] {
  const axisNames = ['X', 'Y', 'Z', 'W', 'V', 'U'];
  return getRotationPlanes(dimension).map(([i, j]) => {
    const name1 = axisNames[i] ?? `A${i}`;
    const name2 = axisNames[j] ?? `A${j}`;
    return `${name1}${name2}`;
  });
}
