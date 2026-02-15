import { describe, it, expect } from 'vitest';
import { VectorND } from '../math/VectorND';
import {
  perspectiveProject,
  orthographicProject,
  stereographicProject,
  projectTo3D,
} from './projections';

describe('orthographicProject', () => {
  it('drops the last coordinate', () => {
    const p = new VectorND([1, 2, 3, 4]);
    const result = orthographicProject(p);
    expect(result.components).toEqual([1, 2, 3]);
  });

  it('projects 4D to 3D', () => {
    const p = new VectorND([1, 2, 3, 4]);
    const result = orthographicProject(p);
    expect(result.dimension).toBe(3);
  });
});

describe('perspectiveProject', () => {
  it('scales points based on W distance', () => {
    const p1 = new VectorND([1, 0, 0, 0]);    // W = 0, at view plane
    const p2 = new VectorND([1, 0, 0, 1]);    // W = 1, closer to viewer
    
    const result1 = perspectiveProject(p1, 2);
    const result2 = perspectiveProject(p2, 2);
    
    // p2 should appear larger (closer)
    expect(result2.get(0)).toBeGreaterThan(result1.get(0));
  });

  it('preserves origin', () => {
    const origin = new VectorND([0, 0, 0, 0]);
    const result = perspectiveProject(origin, 2);
    expect(result.magnitude()).toBeCloseTo(0);
  });

  it('reduces dimension by 1', () => {
    const p = new VectorND([1, 2, 3, 4, 5]);
    const result = perspectiveProject(p, 2);
    expect(result.dimension).toBe(4);
  });
});

describe('stereographicProject', () => {
  it('projects point near pole to large values', () => {
    const nearPole = new VectorND([0.1, 0, 0.99]);  // near north pole
    const result = stereographicProject(nearPole, 1);
    // Point should expand outward
    expect(result.get(0)).toBeGreaterThan(0.1);
  });

  it('projects opposite pole to origin', () => {
    const southPole = new VectorND([0, 0, -1]);
    const result = stereographicProject(southPole, 1);
    expect(result.get(0)).toBeCloseTo(0);
    expect(result.get(1)).toBeCloseTo(0);
  });

  it('projects equator to circle of radius 1', () => {
    const equatorPoint = new VectorND([1, 0, 0]);
    const result = stereographicProject(equatorPoint, 1);
    expect(result.get(0)).toBeCloseTo(1);
  });
});

describe('projectTo3D', () => {
  it('projects 4D to 3D directly', () => {
    const p = new VectorND([1, 2, 3, 4]);
    const result = projectTo3D(p, { type: 'orthographic' });
    expect(result.dimension).toBe(3);
    expect(result.components).toEqual([1, 2, 3]);
  });

  it('projects 5D to 3D in two steps', () => {
    const p = new VectorND([1, 2, 3, 4, 5]);
    const result = projectTo3D(p, { type: 'orthographic' });
    expect(result.dimension).toBe(3);
    expect(result.components).toEqual([1, 2, 3]);
  });

  it('projects 6D to 3D', () => {
    const p = new VectorND([1, 2, 3, 4, 5, 6]);
    const result = projectTo3D(p, { type: 'orthographic' });
    expect(result.dimension).toBe(3);
  });

  it('leaves 3D unchanged', () => {
    const p = new VectorND([1, 2, 3]);
    const result = projectTo3D(p, { type: 'perspective' });
    expect(result.components).toEqual([1, 2, 3]);
  });
});
