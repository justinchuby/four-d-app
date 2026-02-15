import { VectorND } from '../math/VectorND';

/**
 * Represents a geometry in N-dimensional space.
 * Contains vertices, edges (as index pairs), and optionally faces.
 */
export interface GeometryND {
  /** Name of the geometry */
  name: string;
  /** Dimension of the space this geometry lives in */
  dimension: number;
  /** Array of vertex positions */
  vertices: VectorND[];
  /** Edges as pairs of vertex indices */
  edges: [number, number][];
  /** Optional: faces as arrays of vertex indices (for solid rendering) */
  faces?: number[][];
}

/**
 * Generate an N-dimensional hypercube (generalizes: segment → square → cube → tesseract → ...)
 * 
 * A hypercube in N dimensions has:
 * - 2^N vertices
 * - N × 2^(N-1) edges
 * - Vertices at all combinations of ±1 in each coordinate
 * 
 * @param dimension - Number of dimensions (2=square, 3=cube, 4=tesseract, etc.)
 * @param size - Half-edge length (default 1, so vertices are at ±1)
 */
export function createHypercube(dimension: number, size = 1): GeometryND {
  const vertexCount = Math.pow(2, dimension);
  const vertices: VectorND[] = [];
  
  // Generate all vertices: each vertex corresponds to a binary number
  // where each bit determines +size or -size for that coordinate
  for (let i = 0; i < vertexCount; i++) {
    const coords: number[] = [];
    for (let d = 0; d < dimension; d++) {
      const bit = (i >> d) & 1;
      coords.push(bit === 0 ? -size : size);
    }
    vertices.push(new VectorND(coords));
  }
  
  // Generate edges: two vertices are connected if they differ in exactly one coordinate
  const edges: [number, number][] = [];
  for (let i = 0; i < vertexCount; i++) {
    for (let j = i + 1; j < vertexCount; j++) {
      // Check if i and j differ in exactly one bit
      const xor = i ^ j;
      if ((xor & (xor - 1)) === 0) {
        edges.push([i, j]);
      }
    }
  }
  
  const names = ['Point', 'Segment', 'Square', 'Cube', 'Tesseract', '5-cube', '6-cube', '7-cube'];
  
  // Generate faces (2D faces of the hypercube)
  // A face is defined by fixing (n-2) coordinates and varying 2
  const faces: number[][] = [];
  if (dimension >= 2) {
    // For each pair of axes, and each combination of fixed values for other axes
    for (let axis1 = 0; axis1 < dimension; axis1++) {
      for (let axis2 = axis1 + 1; axis2 < dimension; axis2++) {
        // For each combination of fixed coordinates
        const otherAxes = [];
        for (let d = 0; d < dimension; d++) {
          if (d !== axis1 && d !== axis2) otherAxes.push(d);
        }
        
        const numCombinations = Math.pow(2, otherAxes.length);
        for (let combo = 0; combo < numCombinations; combo++) {
          // Build the 4 vertices of this square face
          const faceVertices: number[] = [];
          for (let corner = 0; corner < 4; corner++) {
            let vertexIndex = 0;
            // Set bits for axis1 and axis2
            if (corner === 1 || corner === 2) vertexIndex |= (1 << axis1);
            if (corner === 2 || corner === 3) vertexIndex |= (1 << axis2);
            // Set bits for other axes based on combo
            for (let k = 0; k < otherAxes.length; k++) {
              if ((combo >> k) & 1) vertexIndex |= (1 << otherAxes[k]);
            }
            faceVertices.push(vertexIndex);
          }
          faces.push(faceVertices);
        }
      }
    }
  }
  
  return {
    name: names[dimension] ?? `${dimension}-cube`,
    dimension,
    vertices,
    edges,
    faces,
  };
}

/**
 * Generate an N-dimensional simplex (generalizes: point → segment → triangle → tetrahedron → 5-cell → ...)
 * 
 * A simplex in N dimensions has:
 * - N+1 vertices, all equidistant from each other
 * - (N+1)×N/2 edges (complete graph)
 * 
 * @param dimension - Number of dimensions
 * @param size - Edge length scaling factor
 */
export function createSimplex(dimension: number, size = 1): GeometryND {
  const vertices: VectorND[] = [];
  
  // Generate vertices using the standard construction:
  // Start with vertex at origin, then add vertices that maintain equal distances
  // We use the construction where vertex i has 1/√(i(i+1)) in coordinate i-1
  // and -1/√(i(i+1))/i in all previous coordinates
  
  // Simpler approach: embed in (N+1) dimensions first, then center
  // Vertices are at e_0, e_1, ..., e_N (standard basis vectors in N+1 space)
  // Then project to N dimensions
  
  for (let i = 0; i <= dimension; i++) {
    const coords: number[] = [];
    for (let d = 0; d < dimension; d++) {
      if (d < i) {
        coords.push(-1 / Math.sqrt((d + 1) * (d + 2)));
      } else if (d === i && d < dimension) {
        coords.push(Math.sqrt((d + 1) / (d + 2)));
      } else {
        coords.push(0);
      }
    }
    vertices.push(new VectorND(coords).scale(size));
  }
  
  // Center the simplex at origin
  const center = vertices.reduce((acc, v) => acc.add(v), VectorND.zero(dimension))
    .scale(1 / vertices.length);
  const centeredVertices = vertices.map(v => v.subtract(center));
  
  // Normalize scale
  const maxDist = Math.max(...centeredVertices.map(v => v.magnitude()));
  const normalizedVertices = centeredVertices.map(v => v.scale(size / maxDist));
  
  // Generate edges: complete graph (all pairs connected)
  const edges: [number, number][] = [];
  for (let i = 0; i <= dimension; i++) {
    for (let j = i + 1; j <= dimension; j++) {
      edges.push([i, j]);
    }
  }
  
  // Generate faces: all triangles (combinations of 3 vertices)
  const faces: number[][] = [];
  for (let i = 0; i <= dimension; i++) {
    for (let j = i + 1; j <= dimension; j++) {
      for (let k = j + 1; k <= dimension; k++) {
        faces.push([i, j, k]);
      }
    }
  }
  
  const names = ['Point', 'Segment', 'Triangle', 'Tetrahedron', '5-cell', '5-simplex', '6-simplex'];
  
  return {
    name: names[dimension] ?? `${dimension}-simplex`,
    dimension,
    vertices: normalizedVertices,
    edges,
    faces,
  };
}

/**
 * Generate an N-dimensional orthoplex/cross-polytope 
 * (generalizes: segment → square → octahedron → 16-cell → ...)
 * 
 * An orthoplex in N dimensions has:
 * - 2N vertices (at ±1 on each axis)
 * - 2N(N-1) edges
 * - Vertices at (±1, 0, 0, ...), (0, ±1, 0, ...), etc.
 * 
 * @param dimension - Number of dimensions
 * @param size - Distance of vertices from origin
 */
export function createOrthoplex(dimension: number, size = 1): GeometryND {
  const vertices: VectorND[] = [];
  
  // Create 2 vertices per axis: one positive, one negative
  for (let d = 0; d < dimension; d++) {
    const coordsPos = new Array(dimension).fill(0);
    const coordsNeg = new Array(dimension).fill(0);
    coordsPos[d] = size;
    coordsNeg[d] = -size;
    vertices.push(new VectorND(coordsPos));
    vertices.push(new VectorND(coordsNeg));
  }
  
  // Generate edges: connect every vertex to every other vertex EXCEPT its opposite
  // Vertex 2d and 2d+1 are opposites (on same axis)
  const edges: [number, number][] = [];
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      // Check if they're NOT on the same axis
      const axisI = Math.floor(i / 2);
      const axisJ = Math.floor(j / 2);
      if (axisI !== axisJ) {
        edges.push([i, j]);
      }
    }
  }
  
  // Generate faces: triangles formed by vertices from 3 different axes
  const faces: number[][] = [];
  for (let a1 = 0; a1 < dimension; a1++) {
    for (let a2 = a1 + 1; a2 < dimension; a2++) {
      for (let a3 = a2 + 1; a3 < dimension; a3++) {
        // Each combination of signs gives a triangle
        for (let s1 = 0; s1 < 2; s1++) {
          for (let s2 = 0; s2 < 2; s2++) {
            for (let s3 = 0; s3 < 2; s3++) {
              faces.push([a1 * 2 + s1, a2 * 2 + s2, a3 * 2 + s3]);
            }
          }
        }
      }
    }
  }
  
  const names = ['Point', 'Segment', 'Square', 'Octahedron', '16-cell', '5-orthoplex'];
  
  return {
    name: names[dimension] ?? `${dimension}-orthoplex`,
    dimension,
    vertices,
    edges,
    faces,
  };
}

/**
 * Generate a 24-cell (unique to 4D, no direct analog in other dimensions)
 * 
 * The 24-cell has:
 * - 24 vertices
 * - 96 edges
 * - It's self-dual and highly symmetric
 */
export function create24Cell(size = 1): GeometryND {
  const vertices: VectorND[] = [];
  
  // 8 vertices: permutations of (±1, 0, 0, 0) - scaled by size
  for (let d = 0; d < 4; d++) {
    for (const sign of [-1, 1]) {
      const coords = [0, 0, 0, 0];
      coords[d] = sign * size;
      vertices.push(new VectorND(coords));
    }
  }
  
  // 16 vertices: all combinations of (±1/2, ±1/2, ±1/2, ±1/2) scaled by 2*size
  // to have the same circumradius as the axis vertices
  for (let i = 0; i < 16; i++) {
    const coords: number[] = [];
    for (let d = 0; d < 4; d++) {
      coords.push(((i >> d) & 1) === 0 ? -0.5 * size : 0.5 * size);
    }
    // Scale by 2 so these have magnitude 1 (same as axis vertices)
    vertices.push(new VectorND(coords).scale(2));
  }
  
  // Generate edges: vertices are connected if their distance equals sqrt(2) * size
  // (the edge length of a 24-cell with circumradius 1)
  const edges: [number, number][] = [];
  const edgeLengthSq = 2 * size * size; // Edge length squared = 2
  const tolerance = 0.01 * size * size;
  
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const distSq = vertices[i].subtract(vertices[j]).magnitudeSquared();
      if (Math.abs(distSq - edgeLengthSq) < tolerance) {
        edges.push([i, j]);
      }
    }
  }
  
  // Generate triangular faces by finding edge triangles
  const faces: number[][] = [];
  const edgeSet = new Set(edges.map(([a, b]) => `${Math.min(a,b)}-${Math.max(a,b)}`));
  
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      for (let k = j + 1; k < vertices.length; k++) {
        // Check if all three edges exist
        const e1 = `${i}-${j}`;
        const e2 = `${i}-${k}`;
        const e3 = `${j}-${k}`;
        if (edgeSet.has(e1) && edgeSet.has(e2) && edgeSet.has(e3)) {
          faces.push([i, j, k]);
        }
      }
    }
  }
  
  return {
    name: '24-cell',
    dimension: 4,
    vertices,
    edges,
    faces,
  };
}

/**
 * Get a list of available preset geometries for a given dimension
 */
export function getAvailableGeometries(dimension: number): string[] {
  const base = ['Hypercube', 'Simplex', 'Orthoplex'];
  if (dimension === 4) {
    return [...base, '24-cell'];
  }
  return base;
}
