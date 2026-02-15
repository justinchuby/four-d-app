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
 * Generate a 600-cell (regular 4D polytope)
 * 
 * The 600-cell has:
 * - 120 vertices
 * - 720 edges
 * - 1200 triangular faces
 * - 600 tetrahedral cells
 * 
 * Uses the golden ratio φ = (1 + √5) / 2
 */
export function create600Cell(size = 1): GeometryND {
  const phi = (1 + Math.sqrt(5)) / 2;
  const vertices: VectorND[] = [];
  
  // 24 vertices: all permutations of (±1, ±1, ±1, ±1) with even number of minus signs
  // Actually let's use the simpler construction:
  
  // 8 vertices: (±1, 0, 0, 0) and permutations
  for (let d = 0; d < 4; d++) {
    for (const sign of [-1, 1]) {
      const coords = [0, 0, 0, 0];
      coords[d] = sign * size;
      vertices.push(new VectorND(coords));
    }
  }
  
  // 16 vertices: (±0.5, ±0.5, ±0.5, ±0.5)
  for (let i = 0; i < 16; i++) {
    const coords: number[] = [];
    for (let d = 0; d < 4; d++) {
      coords.push(((i >> d) & 1) === 0 ? -0.5 * size : 0.5 * size);
    }
    vertices.push(new VectorND(coords));
  }
  
  // 96 vertices: even permutations of (±φ/2, ±1/2, ±1/(2φ), 0)
  const values = [phi / 2 * size, 0.5 * size, 1 / (2 * phi) * size, 0];
  const permutations = [
    [0, 1, 2, 3], [0, 2, 3, 1], [0, 3, 1, 2],
    [1, 0, 3, 2], [1, 2, 0, 3], [1, 3, 2, 0],
    [2, 0, 1, 3], [2, 1, 3, 0], [2, 3, 0, 1],
    [3, 0, 2, 1], [3, 1, 0, 2], [3, 2, 1, 0],
  ];
  
  for (const perm of permutations) {
    for (let signs = 0; signs < 8; signs++) {
      const coords = [0, 0, 0, 0];
      for (let i = 0; i < 4; i++) {
        const val = values[perm[i]];
        const sign = ((signs >> i) & 1) === 0 ? 1 : -1;
        coords[i] = val * sign;
      }
      if (coords.some(c => c !== 0)) {
        vertices.push(new VectorND(coords));
      }
    }
  }
  
  // Remove duplicate vertices
  const uniqueVertices: VectorND[] = [];
  const seen = new Set<string>();
  for (const v of vertices) {
    const key = v.components.map(c => c.toFixed(6)).join(',');
    if (!seen.has(key)) {
      seen.add(key);
      uniqueVertices.push(v);
    }
  }
  
  // Edge length is 1/φ for unit circumradius
  const edgeLength = size / phi;
  const edgeLengthSq = edgeLength * edgeLength;
  const tolerance = 0.01 * size * size;
  
  const edges: [number, number][] = [];
  for (let i = 0; i < uniqueVertices.length; i++) {
    for (let j = i + 1; j < uniqueVertices.length; j++) {
      const distSq = uniqueVertices[i].subtract(uniqueVertices[j]).magnitudeSquared();
      if (Math.abs(distSq - edgeLengthSq) < tolerance) {
        edges.push([i, j]);
      }
    }
  }
  
  // Generate triangular faces
  const faces: number[][] = [];
  const edgeSet = new Set(edges.map(([a, b]) => `${Math.min(a,b)}-${Math.max(a,b)}`));
  
  for (let i = 0; i < uniqueVertices.length; i++) {
    for (let j = i + 1; j < uniqueVertices.length; j++) {
      if (!edgeSet.has(`${i}-${j}`)) continue;
      for (let k = j + 1; k < uniqueVertices.length; k++) {
        if (edgeSet.has(`${i}-${k}`) && edgeSet.has(`${j}-${k}`)) {
          faces.push([i, j, k]);
        }
      }
    }
  }
  
  return {
    name: '600-cell',
    dimension: 4,
    vertices: uniqueVertices,
    edges,
    faces,
  };
}

/**
 * Generate a Clifford Torus in 4D
 * 
 * A flat torus embedded in 4D space, defined by two perpendicular circles.
 * Points satisfy x² + y² = r² and z² + w² = r²
 */
export function createCliffordTorus(majorSegments = 16, minorSegments = 16, size = 1): GeometryND {
  const vertices: VectorND[] = [];
  const edges: [number, number][] = [];
  const faces: number[][] = [];
  
  const r = size / Math.sqrt(2);
  
  // Generate vertices
  for (let i = 0; i < majorSegments; i++) {
    const theta = (2 * Math.PI * i) / majorSegments;
    for (let j = 0; j < minorSegments; j++) {
      const phi = (2 * Math.PI * j) / minorSegments;
      vertices.push(new VectorND([
        r * Math.cos(theta),
        r * Math.sin(theta),
        r * Math.cos(phi),
        r * Math.sin(phi),
      ]));
    }
  }
  
  // Generate edges and faces
  for (let i = 0; i < majorSegments; i++) {
    const ni = (i + 1) % majorSegments;
    for (let j = 0; j < minorSegments; j++) {
      const nj = (j + 1) % minorSegments;
      const idx = i * minorSegments + j;
      const idxRight = i * minorSegments + nj;
      const idxDown = ni * minorSegments + j;
      const idxDiag = ni * minorSegments + nj;
      
      edges.push([idx, idxRight]);
      edges.push([idx, idxDown]);
      
      faces.push([idx, idxRight, idxDiag]);
      faces.push([idx, idxDiag, idxDown]);
    }
  }
  
  return {
    name: 'Clifford Torus',
    dimension: 4,
    vertices,
    edges,
    faces,
  };
}

/**
 * Generate a Duocylinder in 4D
 * 
 * The Duocylinder is bounded by two perpendicular circular surfaces in 4D.
 * It's the Cartesian product of two circles.
 */
export function createDuocylinder(segments = 20, size = 1): GeometryND {
  const vertices: VectorND[] = [];
  const edges: [number, number][] = [];
  const faces: number[][] = [];
  
  // Generate vertices on the surface (similar to torus but denser)
  for (let i = 0; i < segments; i++) {
    const theta = (2 * Math.PI * i) / segments;
    for (let j = 0; j < segments; j++) {
      const phi = (2 * Math.PI * j) / segments;
      vertices.push(new VectorND([
        size * Math.cos(theta),
        size * Math.sin(theta),
        size * Math.cos(phi),
        size * Math.sin(phi),
      ]));
    }
  }
  
  // Generate edges and faces (grid topology)
  for (let i = 0; i < segments; i++) {
    const ni = (i + 1) % segments;
    for (let j = 0; j < segments; j++) {
      const nj = (j + 1) % segments;
      const idx = i * segments + j;
      const idxRight = i * segments + nj;
      const idxDown = ni * segments + j;
      const idxDiag = ni * segments + nj;
      
      edges.push([idx, idxRight]);
      edges.push([idx, idxDown]);
      
      faces.push([idx, idxRight, idxDiag]);
      faces.push([idx, idxDiag, idxDown]);
    }
  }
  
  return {
    name: 'Duocylinder',
    dimension: 4,
    vertices,
    edges,
    faces,
  };
}

/**
 * Generate a 4D Cone (hypercone)
 * 
 * A cone in 4D with a spherical base in the W=0 hyperplane
 * and apex at W=height
 */
export function createHypercone(segments = 16, rings = 8, size = 1): GeometryND {
  const vertices: VectorND[] = [];
  const edges: [number, number][] = [];
  const faces: number[][] = [];
  const height = size * 1.5;
  
  // Apex
  vertices.push(new VectorND([0, 0, 0, height]));
  
  // Generate spherical base layers
  for (let ring = 1; ring <= rings; ring++) {
    const t = ring / rings;
    const r = size * t;
    const w = height * (1 - t);
    
    for (let i = 0; i < segments; i++) {
      const theta = (2 * Math.PI * i) / segments;
      for (let j = 0; j < segments / 2; j++) {
        const phi = (Math.PI * j) / (segments / 2);
        vertices.push(new VectorND([
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi),
          w,
        ]));
      }
    }
  }
  
  // Connect apex to first ring
  const firstRingSize = segments * Math.floor(segments / 2);
  for (let i = 1; i <= firstRingSize && i < vertices.length; i++) {
    edges.push([0, i]);
    faces.push([0, i, i % firstRingSize + 1 || 1]);
  }
  
  // Connect rings
  for (let ring = 0; ring < rings - 1; ring++) {
    const ringStart = 1 + ring * firstRingSize;
    const nextRingStart = ringStart + firstRingSize;
    
    for (let i = 0; i < firstRingSize && ringStart + i < vertices.length && nextRingStart + i < vertices.length; i++) {
      const curr = ringStart + i;
      const next = ringStart + (i + 1) % firstRingSize;
      const currDown = nextRingStart + i;
      
      if (curr < vertices.length && currDown < vertices.length) {
        edges.push([curr, currDown]);
      }
      if (curr < vertices.length && next < vertices.length) {
        edges.push([curr, next]);
      }
      if (curr < vertices.length && next < vertices.length && currDown < vertices.length) {
        faces.push([curr, next, currDown]);
      }
    }
  }
  
  return {
    name: 'Hypercone',
    dimension: 4,
    vertices,
    edges,
    faces,
  };
}

/**
 * Generate a Grand Antiprism (unique 4D uniform polytope)
 * 
 * Has 100 vertices arranged as two orthogonal rings of 10 decagons each.
 */
export function createGrandAntiprism(size = 1): GeometryND {
  const vertices: VectorND[] = [];
  const edges: [number, number][] = [];
  const faces: number[][] = [];
  
  const n = 10; // Decagonal rings
  
  // Two perpendicular decagonal rings
  for (let ring = 0; ring < 2; ring++) {
    for (let layer = 0; layer < 5; layer++) {
      for (let i = 0; i < n; i++) {
        const angle = (2 * Math.PI * i) / n;
        const r = size * (0.5 + 0.2 * layer);
        const offset = layer * 0.3 * size;
        
        if (ring === 0) {
          vertices.push(new VectorND([
            r * Math.cos(angle),
            r * Math.sin(angle),
            offset - size * 0.6,
            0,
          ]));
        } else {
          vertices.push(new VectorND([
            0,
            offset - size * 0.6,
            r * Math.cos(angle),
            r * Math.sin(angle),
          ]));
        }
      }
    }
  }
  
  // Generate edges within each ring
  for (let ring = 0; ring < 2; ring++) {
    const base = ring * 50;
    for (let layer = 0; layer < 5; layer++) {
      const layerBase = base + layer * n;
      for (let i = 0; i < n; i++) {
        // Connect around the ring
        edges.push([layerBase + i, layerBase + (i + 1) % n]);
        // Connect to next layer
        if (layer < 4) {
          edges.push([layerBase + i, layerBase + n + i]);
          edges.push([layerBase + i, layerBase + n + (i + 1) % n]);
        }
      }
    }
  }
  
  // Connect between rings (antiprism connection)
  for (let i = 0; i < 50; i++) {
    edges.push([i, 50 + (i * 3) % 50]);
    edges.push([i, 50 + (i * 3 + 1) % 50]);
  }
  
  // Generate some faces
  for (let ring = 0; ring < 2; ring++) {
    const base = ring * 50;
    for (let layer = 0; layer < 4; layer++) {
      const layerBase = base + layer * n;
      for (let i = 0; i < n; i++) {
        const ni = (i + 1) % n;
        faces.push([layerBase + i, layerBase + ni, layerBase + n + i]);
        faces.push([layerBase + ni, layerBase + n + ni, layerBase + n + i]);
      }
    }
  }
  
  return {
    name: 'Grand Antiprism',
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
    return [...base, '24-cell', '600-cell', 'Clifford Torus', 'Duocylinder', 'Hypercone', 'Grand Antiprism'];
  }
  return base;
}
