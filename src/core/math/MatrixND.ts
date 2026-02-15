import { VectorND } from './VectorND';

/**
 * N×N matrix for arbitrary dimension transformations.
 * Used primarily for rotations in N-dimensional space.
 */
export class MatrixND {
  readonly data: number[][];
  readonly size: number;

  constructor(data: number[][]) {
    this.data = data.map(row => [...row]);
    this.size = data.length;
  }

  /**
   * Create an N×N identity matrix
   */
  static identity(size: number): MatrixND {
    const data: number[][] = [];
    for (let i = 0; i < size; i++) {
      const row = new Array(size).fill(0);
      row[i] = 1;
      data.push(row);
    }
    return new MatrixND(data);
  }

  /**
   * Create a zero matrix
   */
  static zero(size: number): MatrixND {
    const data: number[][] = [];
    for (let i = 0; i < size; i++) {
      data.push(new Array(size).fill(0));
    }
    return new MatrixND(data);
  }

  /**
   * Create a rotation matrix in a specific plane (defined by two axes).
   * In N dimensions, rotations happen in 2D planes, not around axes.
   * 
   * @param size - Dimension of the matrix
   * @param axis1 - First axis of the rotation plane (0-indexed)
   * @param axis2 - Second axis of the rotation plane (0-indexed)
   * @param angle - Rotation angle in radians
   */
  static rotation(size: number, axis1: number, axis2: number, angle: number): MatrixND {
    const matrix = MatrixND.identity(size);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    matrix.data[axis1][axis1] = cos;
    matrix.data[axis1][axis2] = -sin;
    matrix.data[axis2][axis1] = sin;
    matrix.data[axis2][axis2] = cos;
    
    return matrix;
  }

  /**
   * Get element at position (row, col)
   */
  get(row: number, col: number): number {
    return this.data[row]?.[col] ?? 0;
  }

  /**
   * Set element at position (row, col)
   */
  set(row: number, col: number, value: number): void {
    if (this.data[row]) {
      this.data[row][col] = value;
    }
  }

  /**
   * Multiply this matrix by another matrix: this × other
   */
  multiply(other: MatrixND): MatrixND {
    if (this.size !== other.size) {
      throw new Error(`Matrix size mismatch: ${this.size} vs ${other.size}`);
    }
    
    const result = MatrixND.zero(this.size);
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        let sum = 0;
        for (let k = 0; k < this.size; k++) {
          sum += this.data[i][k] * other.data[k][j];
        }
        result.data[i][j] = sum;
      }
    }
    return result;
  }

  /**
   * Transform a vector by this matrix
   */
  transform(vector: VectorND): VectorND {
    if (vector.dimension !== this.size) {
      throw new Error(`Vector dimension ${vector.dimension} doesn't match matrix size ${this.size}`);
    }
    
    const result = new Array(this.size).fill(0);
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        result[i] += this.data[i][j] * vector.get(j);
      }
    }
    return new VectorND(result);
  }

  /**
   * Get the transpose of this matrix
   */
  transpose(): MatrixND {
    const result = MatrixND.zero(this.size);
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        result.data[i][j] = this.data[j][i];
      }
    }
    return result;
  }

  /**
   * Create a copy of this matrix
   */
  clone(): MatrixND {
    return new MatrixND(this.data.map(row => [...row]));
  }

  /**
   * Scale all elements by a scalar
   */
  scale(scalar: number): MatrixND {
    return new MatrixND(this.data.map(row => row.map(val => val * scalar)));
  }

  toString(): string {
    return this.data.map(row => row.map(v => v.toFixed(3).padStart(8)).join(' ')).join('\n');
  }
}
