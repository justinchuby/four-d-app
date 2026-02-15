import { describe, it, expect } from 'vitest';
import {
  createHypercube,
  createSimplex,
  createOrthoplex,
  create24Cell,
  create600Cell,
  createCliffordTorus,
  createDuocylinder,
  createHypercone,
  createGrandAntiprism,
} from './polytopes';

describe('createHypercube', () => {
  it('creates a 2D square with 4 vertices and 4 edges', () => {
    const square = createHypercube(2);
    expect(square.name).toBe('Square');
    expect(square.vertices.length).toBe(4);
    expect(square.edges.length).toBe(4);
  });

  it('creates a 3D cube with 8 vertices and 12 edges', () => {
    const cube = createHypercube(3);
    expect(cube.name).toBe('Cube');
    expect(cube.vertices.length).toBe(8);
    expect(cube.edges.length).toBe(12);
  });

  it('creates a 4D tesseract with 16 vertices and 32 edges', () => {
    const tesseract = createHypercube(4);
    expect(tesseract.name).toBe('Tesseract');
    expect(tesseract.vertices.length).toBe(16);
    expect(tesseract.edges.length).toBe(32);
  });

  it('vertices are at distance sqrt(N) from origin', () => {
    const tesseract = createHypercube(4, 1);
    // Each vertex has coords (±1, ±1, ±1, ±1), magnitude = sqrt(4) = 2
    expect(tesseract.vertices[0].magnitude()).toBeCloseTo(2);
  });

  it('verifies hypercube formula: N × 2^(N-1) edges', () => {
    for (let n = 2; n <= 5; n++) {
      const hypercube = createHypercube(n);
      expect(hypercube.edges.length).toBe(n * Math.pow(2, n - 1));
    }
  });
});

describe('createSimplex', () => {
  it('creates a 2D triangle with 3 vertices and 3 edges', () => {
    const triangle = createSimplex(2);
    expect(triangle.name).toBe('Triangle');
    expect(triangle.vertices.length).toBe(3);
    expect(triangle.edges.length).toBe(3);
  });

  it('creates a 3D tetrahedron with 4 vertices and 6 edges', () => {
    const tetra = createSimplex(3);
    expect(tetra.name).toBe('Tetrahedron');
    expect(tetra.vertices.length).toBe(4);
    expect(tetra.edges.length).toBe(6);
  });

  it('creates a 4D 5-cell with 5 vertices and 10 edges', () => {
    const fiveCell = createSimplex(4);
    expect(fiveCell.name).toBe('5-cell');
    expect(fiveCell.vertices.length).toBe(5);
    expect(fiveCell.edges.length).toBe(10);
  });

  it('verifies simplex formula: (N+1)×N/2 edges', () => {
    for (let n = 2; n <= 5; n++) {
      const simplex = createSimplex(n);
      expect(simplex.edges.length).toBe(((n + 1) * n) / 2);
    }
  });

  it('is centered at origin', () => {
    const simplex = createSimplex(4);
    const center = simplex.vertices.reduce((acc, v) => acc.add(v), simplex.vertices[0].scale(0));
    expect(center.magnitude()).toBeCloseTo(0, 5);
  });
});

describe('createOrthoplex', () => {
  it('creates a 3D octahedron with 6 vertices and 12 edges', () => {
    const octa = createOrthoplex(3);
    expect(octa.name).toBe('Octahedron');
    expect(octa.vertices.length).toBe(6);
    expect(octa.edges.length).toBe(12);
  });

  it('creates a 4D 16-cell with 8 vertices and 24 edges', () => {
    const sixteenCell = createOrthoplex(4);
    expect(sixteenCell.name).toBe('16-cell');
    expect(sixteenCell.vertices.length).toBe(8);
    expect(sixteenCell.edges.length).toBe(24);
  });

  it('verifies orthoplex formula: 2N vertices', () => {
    for (let n = 2; n <= 5; n++) {
      const orthoplex = createOrthoplex(n);
      expect(orthoplex.vertices.length).toBe(2 * n);
    }
  });

  it('vertices lie on coordinate axes', () => {
    const orthoplex = createOrthoplex(4);
    for (const vertex of orthoplex.vertices) {
      // Exactly one non-zero coordinate
      const nonZero = vertex.components.filter(c => Math.abs(c) > 0.001);
      expect(nonZero.length).toBe(1);
    }
  });
});

describe('create24Cell', () => {
  it('creates 24 vertices', () => {
    const cell24 = create24Cell();
    expect(cell24.vertices.length).toBe(24);
  });

  it('creates edges', () => {
    const cell24 = create24Cell();
    expect(cell24.edges.length).toBeGreaterThan(0);
  });

  it('is 4-dimensional', () => {
    const cell24 = create24Cell();
    expect(cell24.dimension).toBe(4);
    expect(cell24.vertices[0].dimension).toBe(4);
  });
});

describe('create600Cell', () => {
  it('creates vertices and edges', () => {
    const cell600 = create600Cell();
    expect(cell600.vertices.length).toBeGreaterThan(20);
    expect(cell600.edges.length).toBeGreaterThan(0);
    expect(cell600.dimension).toBe(4);
  });
  
  it('has triangular faces', () => {
    const cell600 = create600Cell();
    expect(cell600.faces).toBeDefined();
    expect(cell600.faces!.length).toBeGreaterThan(0);
  });
});

describe('createCliffordTorus', () => {
  it('creates a 4D torus with grid topology', () => {
    const torus = createCliffordTorus(8, 8);
    expect(torus.vertices.length).toBe(64);
    expect(torus.edges.length).toBeGreaterThan(0);
    expect(torus.dimension).toBe(4);
  });
  
  it('all vertices have the same distance from origin', () => {
    const torus = createCliffordTorus(16, 16);
    const dist = torus.vertices[0].magnitude();
    for (const v of torus.vertices) {
      expect(v.magnitude()).toBeCloseTo(dist, 4);
    }
  });
});

describe('createDuocylinder', () => {
  it('creates a 4D duocylinder', () => {
    const duo = createDuocylinder(10);
    expect(duo.vertices.length).toBe(100);
    expect(duo.edges.length).toBeGreaterThan(0);
    expect(duo.dimension).toBe(4);
  });
});

describe('createHypercone', () => {
  it('creates a 4D cone with apex', () => {
    const cone = createHypercone(8, 4);
    expect(cone.vertices.length).toBeGreaterThan(0);
    expect(cone.dimension).toBe(4);
    // First vertex is the apex at W=height
    expect(cone.vertices[0].get(3)).toBeGreaterThan(0);
  });
});

describe('createGrandAntiprism', () => {
  it('creates a grand antiprism with 100 vertices', () => {
    const antiprism = createGrandAntiprism();
    expect(antiprism.vertices.length).toBe(100);
    expect(antiprism.edges.length).toBeGreaterThan(0);
    expect(antiprism.dimension).toBe(4);
  });
});
