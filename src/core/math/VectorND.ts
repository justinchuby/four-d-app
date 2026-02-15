/**
 * N-dimensional vector class for arbitrary dimension operations.
 * Supports basic vector math operations needed for higher-dimensional geometry.
 */
export class VectorND {
  readonly components: number[];
  readonly dimension: number;

  constructor(components: number[]) {
    this.components = [...components];
    this.dimension = components.length;
  }

  static zero(dimension: number): VectorND {
    return new VectorND(new Array(dimension).fill(0));
  }

  static basis(dimension: number, axis: number): VectorND {
    const components = new Array(dimension).fill(0);
    components[axis] = 1;
    return new VectorND(components);
  }

  get(index: number): number {
    return this.components[index] ?? 0;
  }

  add(other: VectorND): VectorND {
    const maxDim = Math.max(this.dimension, other.dimension);
    const result = new Array(maxDim);
    for (let i = 0; i < maxDim; i++) {
      result[i] = this.get(i) + other.get(i);
    }
    return new VectorND(result);
  }

  subtract(other: VectorND): VectorND {
    const maxDim = Math.max(this.dimension, other.dimension);
    const result = new Array(maxDim);
    for (let i = 0; i < maxDim; i++) {
      result[i] = this.get(i) - other.get(i);
    }
    return new VectorND(result);
  }

  scale(scalar: number): VectorND {
    return new VectorND(this.components.map(c => c * scalar));
  }

  dot(other: VectorND): number {
    const minDim = Math.min(this.dimension, other.dimension);
    let sum = 0;
    for (let i = 0; i < minDim; i++) {
      sum += this.components[i] * other.components[i];
    }
    return sum;
  }

  magnitudeSquared(): number {
    return this.dot(this);
  }

  magnitude(): number {
    return Math.sqrt(this.magnitudeSquared());
  }

  normalize(): VectorND {
    const mag = this.magnitude();
    if (mag === 0) return VectorND.zero(this.dimension);
    return this.scale(1 / mag);
  }

  /**
   * Project this vector onto another vector
   */
  projectOnto(other: VectorND): VectorND {
    const otherMagSq = other.magnitudeSquared();
    if (otherMagSq === 0) return VectorND.zero(this.dimension);
    return other.scale(this.dot(other) / otherMagSq);
  }

  /**
   * Returns the first n components as a new vector (for dimension reduction)
   */
  truncate(newDimension: number): VectorND {
    return new VectorND(this.components.slice(0, newDimension));
  }

  /**
   * Extend to higher dimension by padding with zeros
   */
  extend(newDimension: number): VectorND {
    if (newDimension <= this.dimension) return this;
    const result = [...this.components];
    while (result.length < newDimension) {
      result.push(0);
    }
    return new VectorND(result);
  }

  /**
   * Create a copy of this vector
   */
  clone(): VectorND {
    return new VectorND([...this.components]);
  }

  /**
   * Check equality with tolerance
   */
  equals(other: VectorND, epsilon = 1e-10): boolean {
    if (this.dimension !== other.dimension) return false;
    for (let i = 0; i < this.dimension; i++) {
      if (Math.abs(this.components[i] - other.components[i]) > epsilon) {
        return false;
      }
    }
    return true;
  }

  /**
   * Convert to array (for Three.js compatibility when 3D)
   */
  toArray(): number[] {
    return [...this.components];
  }

  toString(): string {
    return `(${this.components.map(c => c.toFixed(3)).join(', ')})`;
  }
}
