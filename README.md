# 4D Renderer

An educational web application for visualizing and exploring higher-dimensional objects (4D and beyond).

![4D Renderer](https://img.shields.io/badge/Dimension-4D+-cyan)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![React](https://img.shields.io/badge/React-19-blue)

## Features

- **N-Dimensional Shapes**: Visualize tesseracts, 5-cells, 16-cells, 24-cells, and more
- **Multiple Projections**: Perspective, orthographic, and stereographic projection modes
- **Interactive Rotations**: Rotate in all 6 planes of 4D space (XY, XZ, XW, YZ, YW, ZW)
- **Dimension Scaling**: Explore shapes from 3D to 6D
- **Educational Content**: Built-in explanations of 4D concepts
- **Color-Coded Depth**: Colors indicate position in the 4th dimension

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Controls

- **Mouse Drag**: Rotate the 3D view
- **Scroll**: Zoom in/out
- **Control Panel**: Adjust shape, dimension, projection, and animation settings
- **"Learn About 4D" Button**: Open educational content

## Understanding 4D

In 4D space, rotations happen in **planes**, not around axes. The 6 rotation planes are:

| Plane | Description |
|-------|-------------|
| XY, XZ, YZ | Normal 3D rotations |
| XW, YW, ZW | 4D rotations (mixing with W axis) |

When objects rotate in XW/YW/ZW, parts move "into" and "out of" the 4th dimension, creating the characteristic morphing effect.

## Architecture

```
src/
├── core/
│   ├── math/        # VectorND, MatrixND, RotationND
│   ├── geometry/    # Polytope generators (hypercube, simplex, etc.)
│   └── projection/  # N-D to 3D projection algorithms
├── components/
│   ├── viewer/      # Three.js canvas and geometry rendering
│   ├── ui/          # Control panel
│   └── educational/ # Info panels
└── stores/          # Zustand state management
```

## Testing

```bash
npm test
```

## Technologies

- React 19 + TypeScript
- Three.js with React Three Fiber
- Zustand for state management
- Tailwind CSS
- Vite

## License

MIT
