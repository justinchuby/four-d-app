import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';

const mathTopics = {
  rotationMatrices: {
    title: "Rotation Matrices in N-D",
    content: `In 3D, rotations happen around axes. In 4D+, rotations happen in **planes**.

**3D Rotation (around Z-axis):**
\`\`\`
    ⎡ cos θ  -sin θ   0 ⎤
R = ⎢ sin θ   cos θ   0 ⎥
    ⎣   0       0     1 ⎦
\`\`\`

**4D Rotation (in XW plane):**
\`\`\`
    ⎡ cos θ   0    0   -sin θ ⎤
R = ⎢   0     1    0      0   ⎥
    ⎢   0     0    1      0   ⎥
    ⎣ sin θ   0    0    cos θ ⎦
\`\`\`

The rotation matrix for plane (i,j) with angle θ:
- R[i][i] = cos(θ)
- R[j][j] = cos(θ)  
- R[i][j] = -sin(θ)
- R[j][i] = sin(θ)
- All other diagonal = 1, off-diagonal = 0

**Number of rotation planes:** N(N-1)/2
- 3D: 3 planes (XY, XZ, YZ)
- 4D: 6 planes (XY, XZ, XW, YZ, YW, ZW)
- 5D: 10 planes`
  },
  
  projections: {
    title: "Projection Equations",
    content: `**Perspective Projection (N-D → (N-1)-D):**

For a point P = (x₁, x₂, ..., xₙ) and view distance d:
\`\`\`
x'ᵢ = xᵢ × d / (d - xₙ)   for i = 1 to n-1
\`\`\`

When xₙ → d, the point approaches infinity (behind viewer).
When xₙ < 0, the point is "in front" and appears larger.

**Orthographic Projection:**
\`\`\`
x'ᵢ = xᵢ   for i = 1 to n-1
\`\`\`
Simply drops the last coordinate. No depth distortion.

**Stereographic Projection:**
Projects from a pole onto a hyperplane:
\`\`\`
x'ᵢ = xᵢ × p / (p - xₙ)
\`\`\`
Where p is the pole distance. This is conformal (preserves angles).`
  },
  
  vertexCounting: {
    title: "Vertex & Edge Formulas",
    content: `**N-Cube (Hypercube):**
- Vertices: 2ⁿ
- Edges: n × 2ⁿ⁻¹
- k-faces: C(n,k) × 2ⁿ⁻ᵏ

| Dim | Name       | Vertices | Edges |
|-----|------------|----------|-------|
| 2   | Square     | 4        | 4     |
| 3   | Cube       | 8        | 12    |
| 4   | Tesseract  | 16       | 32    |
| 5   | 5-cube     | 32       | 80    |

**N-Simplex:**
- Vertices: n + 1
- Edges: (n+1)×n / 2 (complete graph)

| Dim | Name        | Vertices | Edges |
|-----|-------------|----------|-------|
| 2   | Triangle    | 3        | 3     |
| 3   | Tetrahedron | 4        | 6     |
| 4   | 5-cell      | 5        | 10    |

**N-Orthoplex (Cross-polytope):**
- Vertices: 2n
- Edges: 2n(n-1)

| Dim | Name       | Vertices | Edges |
|-----|------------|----------|-------|
| 3   | Octahedron | 6        | 12    |
| 4   | 16-cell    | 8        | 24    |`
  },
  
  distance: {
    title: "Distance & Angles in N-D",
    content: `**Euclidean Distance:**
\`\`\`
d(P, Q) = √(Σᵢ (pᵢ - qᵢ)²)
\`\`\`

**Dot Product:**
\`\`\`
P · Q = Σᵢ (pᵢ × qᵢ)
\`\`\`

**Angle Between Vectors:**
\`\`\`
cos(θ) = (P · Q) / (|P| × |Q|)
\`\`\`

**Interesting fact:** In N dimensions, two random unit vectors are almost always nearly perpendicular as N increases!

**N-Sphere Volume:**
\`\`\`
Vₙ(r) = πⁿ/² × rⁿ / Γ(n/2 + 1)
\`\`\`

Volume peaks at n ≈ 5.26, then decreases! A high-dimensional sphere has almost all its volume near the surface.`
  },
  
  crossSection: {
    title: "Cross-Sections (Flatland)",
    content: `**The Flatland Analogy:**

A 2D being sees only a 2D slice of our 3D world.

When a 3D sphere passes through Flatland:
1. First appears as a point
2. Grows to a circle
3. Reaches maximum size at the equator
4. Shrinks back to a point
5. Disappears!

**4D → 3D Cross-Sections:**

A 4D hypersphere passing through our 3D space:
1. Appears as a point
2. Grows to a 3D sphere
3. Reaches maximum at the "equator" 
4. Shrinks and vanishes

**Tesseract cross-sections** cycle through:
Point → Tetrahedron → Octahedron → larger shapes → back

This is what you see when animating the slice position!`
  },
  
  duality: {
    title: "Polytope Duality",
    content: `**Duality** swaps vertices ↔ faces while preserving structure.

**Self-dual polytopes** (their dual is the same shape):
- 2D: All regular polygons
- 3D: Tetrahedron
- 4D: 5-cell, **24-cell** (unique!)

**Dual pairs:**
- Cube ↔ Octahedron
- Tesseract ↔ 16-cell
- 120-cell ↔ 600-cell

**The 24-cell is special:**
- Unique to 4D (no analog in other dimensions)
- 24 vertices, 24 octahedral cells
- Self-dual
- Can tile 4D space (like cubes tile 3D)

**Euler characteristic:**
\`\`\`
V - E + F = 2     (3D polyhedra)
V - E + F - C = 0 (4D polytopes)
\`\`\`
Where C = number of 3D cells.`
  }
};

export function MathPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<keyof typeof mathTopics>('rotationMatrices');
  const { dimension } = useAppStore();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg flex items-center gap-2"
      >
        <span className="text-lg">∑</span>
        Mathematics
      </button>
    );
  }

  const topics = Object.entries(mathTopics) as [keyof typeof mathTopics, typeof mathTopics.rotationMatrices][];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[500px] max-h-[80vh] bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold text-green-400">Mathematical Concepts</h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white text-xl"
        >
          ×
        </button>
      </div>

      {/* Topic tabs */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-700 bg-gray-800/50">
        {topics.map(([key, topic]) => (
          <button
            key={key}
            onClick={() => setSelectedTopic(key)}
            className={`px-2 py-1 rounded text-xs ${
              selectedTopic === key
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            {topic.title.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto flex-1 text-sm font-mono">
        <h3 className="text-green-300 font-semibold mb-3 font-sans">
          {mathTopics[selectedTopic].title}
        </h3>
        <pre className="text-gray-300 whitespace-pre-wrap leading-relaxed text-xs">
          {mathTopics[selectedTopic].content}
        </pre>
      </div>

      {/* Current stats */}
      <div className="p-3 border-t border-gray-700 bg-gray-800/50 text-xs text-gray-400">
        <strong>Current {dimension}D:</strong> {dimension}({dimension}-1)/2 = <span className="text-green-400">{dimension * (dimension - 1) / 2}</span> rotation planes
      </div>
    </div>
  );
}
