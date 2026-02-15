import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';

const educationalContent = {
  whatIs4D: {
    title: "What is the 4th Dimension?",
    content: `Just as a 2D being would see a 3D cube as a changing 2D shape when it passes through their plane, we see 4D objects as changing 3D shapes.

The 4th dimension (often called W) is perpendicular to all three spatial dimensions we know (X, Y, Z). We can't directly see it, but we can understand it through projection - the same way a shadow is a 2D projection of a 3D object.

What you're seeing is a 3D "shadow" of a 4D object.`
  },
  tesseract: {
    title: "The Tesseract (4D Hypercube)",
    content: `A tesseract is to a cube what a cube is to a square.

• A square has 4 vertices, 4 edges
• A cube has 8 vertices, 12 edges  
• A tesseract has 16 vertices, 32 edges

It's made of 8 cubic "cells" - just as a cube is made of 6 square faces. When we rotate it in 4D, you see cubes appear to move through each other - this is normal! They exist in different "depths" in the 4th dimension.`
  },
  rotation: {
    title: "Rotation in 4D",
    content: `In 3D, we rotate around an axis (a line). In 4D, we rotate around a plane!

In 4D, there are 6 independent rotation planes:
• XY, XZ, YZ - these look like normal 3D rotations
• XW, YW, ZW - these are the "new" 4D rotations

When you rotate in the XW plane, the X and W coordinates mix - parts of the object move "into" and "out of" the 4th dimension. This is what causes the beautiful morphing effect you see.`
  },
  projection: {
    title: "Projection Methods",
    content: `We project 4D → 3D just like projecting 3D → 2D:

• Perspective: Objects "deeper" in the 4th dimension appear smaller, like how distant objects look smaller in photos.

• Orthographic: Simply ignores the 4th coordinate. No depth effect, but shows "true" shape relationships.

• Stereographic: Projects from a "pole" onto a hyperplane. Preserves angles and maps circles to circles. Often used for visualizing hyperspheres.`
  },
  simplex: {
    title: "The 5-Cell (4D Simplex)",
    content: `The simplest possible 4D shape - the 4D equivalent of a tetrahedron.

• A triangle (2D simplex) has 3 vertices
• A tetrahedron (3D simplex) has 4 vertices
• A 5-cell (4D simplex) has 5 vertices

Every vertex is connected to every other vertex. It has 10 edges and 10 triangular faces forming 5 tetrahedral "cells".`
  },
  orthoplex: {
    title: "The 16-Cell (4D Orthoplex)",
    content: `The 4D equivalent of an octahedron - made by connecting points on each axis.

• A square (2D orthoplex) has vertices at (±1, 0) and (0, ±1)
• An octahedron has 6 vertices on the ±X, ±Y, ±Z axes
• The 16-cell has 8 vertices on the ±X, ±Y, ±Z, ±W axes

It has 24 edges and 32 triangular faces. The 16 "cells" are tetrahedra.`
  },
  cell24: {
    title: "The 24-Cell",
    content: `A beautiful shape unique to 4D - it has no direct analog in any other dimension!

It has 24 vertices, 96 edges, and 24 octahedral cells. It's "self-dual" - meaning its vertices and cells have the same structure.

The 24-cell can tile 4D space with no gaps - similar to how cubes tile 3D space or hexagons tile 2D space.`
  }
};

export function InfoPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<keyof typeof educationalContent>('whatIs4D');
  const { geometryType } = useAppStore();

  // Auto-select relevant topic based on geometry
  const relevantTopics: Record<string, keyof typeof educationalContent> = {
    hypercube: 'tesseract',
    simplex: 'simplex',
    orthoplex: 'orthoplex',
    '24-cell': 'cell24',
  };

  const topics = Object.entries(educationalContent) as [keyof typeof educationalContent, typeof educationalContent.whatIs4D][];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-4 left-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg shadow-lg flex items-center gap-2"
      >
        <span className="text-xl">💡</span>
        Learn About 4D
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 left-4 w-96 max-h-[70vh] bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold text-cyan-400">Learn About Higher Dimensions</h2>
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
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            } ${key === relevantTopics[geometryType] ? 'ring-1 ring-cyan-400' : ''}`}
          >
            {topic.title.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto flex-1 text-sm">
        <h3 className="text-cyan-300 font-semibold mb-2">
          {educationalContent[selectedTopic].title}
        </h3>
        <div className="text-gray-300 whitespace-pre-line leading-relaxed">
          {educationalContent[selectedTopic].content}
        </div>
      </div>
    </div>
  );
}
