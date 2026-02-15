import { describe, it, expect } from 'vitest';
import { VectorND } from './VectorND';
import { MatrixND } from './MatrixND';
import { RotationND, getRotationPlanes } from './RotationND';

describe('VectorND', () => {
  it('creates a vector with components', () => {
    const v = new VectorND([1, 2, 3, 4]);
    expect(v.dimension).toBe(4);
    expect(v.get(0)).toBe(1);
    expect(v.get(3)).toBe(4);
  });

  it('creates zero vector', () => {
    const v = VectorND.zero(5);
    expect(v.dimension).toBe(5);
    expect(v.components.every(c => c === 0)).toBe(true);
  });

  it('creates basis vector', () => {
    const v = VectorND.basis(4, 2);
    expect(v.components).toEqual([0, 0, 1, 0]);
  });

  it('adds vectors', () => {
    const a = new VectorND([1, 2, 3]);
    const b = new VectorND([4, 5, 6]);
    const result = a.add(b);
    expect(result.components).toEqual([5, 7, 9]);
  });

  it('handles different dimensions in add', () => {
    const a = new VectorND([1, 2]);
    const b = new VectorND([3, 4, 5]);
    const result = a.add(b);
    expect(result.components).toEqual([4, 6, 5]);
  });

  it('scales vectors', () => {
    const v = new VectorND([1, 2, 3]);
    expect(v.scale(2).components).toEqual([2, 4, 6]);
  });

  it('computes dot product', () => {
    const a = new VectorND([1, 2, 3]);
    const b = new VectorND([4, 5, 6]);
    expect(a.dot(b)).toBe(32); // 4 + 10 + 18
  });

  it('computes magnitude', () => {
    const v = new VectorND([3, 4]);
    expect(v.magnitude()).toBe(5);
  });

  it('normalizes vectors', () => {
    const v = new VectorND([3, 4]);
    const normalized = v.normalize();
    expect(normalized.magnitude()).toBeCloseTo(1);
    expect(normalized.get(0)).toBeCloseTo(0.6);
    expect(normalized.get(1)).toBeCloseTo(0.8);
  });

  it('truncates to lower dimension', () => {
    const v = new VectorND([1, 2, 3, 4]);
    expect(v.truncate(3).components).toEqual([1, 2, 3]);
  });

  it('extends to higher dimension', () => {
    const v = new VectorND([1, 2]);
    expect(v.extend(4).components).toEqual([1, 2, 0, 0]);
  });
});

describe('MatrixND', () => {
  it('creates identity matrix', () => {
    const m = MatrixND.identity(3);
    expect(m.get(0, 0)).toBe(1);
    expect(m.get(1, 1)).toBe(1);
    expect(m.get(0, 1)).toBe(0);
  });

  it('multiplies matrices', () => {
    const a = new MatrixND([
      [1, 2],
      [3, 4]
    ]);
    const b = new MatrixND([
      [5, 6],
      [7, 8]
    ]);
    const result = a.multiply(b);
    expect(result.get(0, 0)).toBe(19); // 1*5 + 2*7
    expect(result.get(0, 1)).toBe(22); // 1*6 + 2*8
    expect(result.get(1, 0)).toBe(43); // 3*5 + 4*7
    expect(result.get(1, 1)).toBe(50); // 3*6 + 4*8
  });

  it('transforms vectors', () => {
    const m = new MatrixND([
      [1, 2],
      [3, 4]
    ]);
    const v = new VectorND([1, 1]);
    const result = m.transform(v);
    expect(result.get(0)).toBe(3); // 1 + 2
    expect(result.get(1)).toBe(7); // 3 + 4
  });

  it('creates rotation matrix', () => {
    const m = MatrixND.rotation(2, 0, 1, Math.PI / 2);
    const v = new VectorND([1, 0]);
    const result = m.transform(v);
    expect(result.get(0)).toBeCloseTo(0);
    expect(result.get(1)).toBeCloseTo(1);
  });

  it('transposes correctly', () => {
    const m = new MatrixND([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9]
    ]);
    const t = m.transpose();
    expect(t.get(0, 1)).toBe(4);
    expect(t.get(1, 0)).toBe(2);
  });
});

describe('RotationND', () => {
  it('creates rotation in plane', () => {
    const r = new RotationND(4, 0, 3, Math.PI / 4);
    expect(r.dimension).toBe(4);
    expect(r.axis1).toBe(0);
    expect(r.axis2).toBe(3);
    expect(r.getPlaneName()).toBe('XW');
  });

  it('rotates 4D vector in XW plane', () => {
    const r = new RotationND(4, 0, 3, Math.PI / 2);
    const v = new VectorND([1, 0, 0, 0]);
    const result = r.apply(v);
    
    expect(result.get(0)).toBeCloseTo(0);
    expect(result.get(1)).toBeCloseTo(0);
    expect(result.get(2)).toBeCloseTo(0);
    expect(result.get(3)).toBeCloseTo(1);
  });

  it('composes multiple rotations', () => {
    const r1 = new RotationND(3, 0, 1, Math.PI / 2);
    const r2 = new RotationND(3, 1, 2, Math.PI / 2);
    const composed = RotationND.compose([r1, r2]);
    
    const v = new VectorND([1, 0, 0]);
    const result = composed.transform(v);
    
    // After XY 90°: (1,0,0) -> (0,1,0)
    // After YZ 90°: (0,1,0) -> (0,0,1)
    expect(result.get(0)).toBeCloseTo(0);
    expect(result.get(1)).toBeCloseTo(0);
    expect(result.get(2)).toBeCloseTo(1);
  });

  it('preserves vector magnitude under rotation', () => {
    const r = new RotationND(5, 1, 4, 1.234);
    const v = new VectorND([1, 2, 3, 4, 5]);
    const originalMag = v.magnitude();
    const result = r.apply(v);
    
    expect(result.magnitude()).toBeCloseTo(originalMag);
  });
});

describe('getRotationPlanes', () => {
  it('returns correct planes for 3D', () => {
    const planes = getRotationPlanes(3);
    expect(planes).toEqual([[0, 1], [0, 2], [1, 2]]);
  });

  it('returns 6 planes for 4D', () => {
    const planes = getRotationPlanes(4);
    expect(planes.length).toBe(6);
    expect(planes).toContainEqual([0, 3]); // XW
    expect(planes).toContainEqual([2, 3]); // ZW
  });

  it('returns N(N-1)/2 planes', () => {
    for (let n = 2; n <= 6; n++) {
      const planes = getRotationPlanes(n);
      expect(planes.length).toBe(n * (n - 1) / 2);
    }
  });
});
