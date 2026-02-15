import { useState } from 'react';
import { VectorND } from '../../core/math';
import type { GeometryND } from '../../core/geometry';

interface ParametricEditorProps {
  onGeometryChange: (geometry: GeometryND | null) => void;
}

// Example parametric formulas
const presetFormulas = {
  torus4D: {
    name: '4D Torus',
    description: 'A torus (donut) embedded in 4D',
    params: { R: 1.5, r: 0.5, uSteps: 16, vSteps: 16 },
    generate: (params: { R: number; r: number; uSteps: number; vSteps: number }) => {
      const { R, r, uSteps, vSteps } = params;
      const vertices: VectorND[] = [];
      const edges: [number, number][] = [];
      
      for (let i = 0; i < uSteps; i++) {
        for (let j = 0; j < vSteps; j++) {
          const u = (i / uSteps) * 2 * Math.PI;
          const v = (j / vSteps) * 2 * Math.PI;
          
          // Clifford torus parametrization
          const x = (R + r * Math.cos(v)) * Math.cos(u);
          const y = (R + r * Math.cos(v)) * Math.sin(u);
          const z = r * Math.sin(v) * Math.cos(u);
          const w = r * Math.sin(v) * Math.sin(u);
          
          vertices.push(new VectorND([x, y, z, w]));
        }
      }
      
      // Connect grid
      for (let i = 0; i < uSteps; i++) {
        for (let j = 0; j < vSteps; j++) {
          const current = i * vSteps + j;
          const nextU = ((i + 1) % uSteps) * vSteps + j;
          const nextV = i * vSteps + ((j + 1) % vSteps);
          edges.push([current, nextU]);
          edges.push([current, nextV]);
        }
      }
      
      return { name: '4D Torus', dimension: 4, vertices, edges };
    }
  },
  hypersphere: {
    name: '4D Sphere (wireframe)',
    description: 'A 3-sphere in 4D space',
    params: { radius: 1, latSteps: 12, lonSteps: 12 },
    generate: (params: { radius: number; latSteps: number; lonSteps: number }) => {
      const { radius, latSteps, lonSteps } = params;
      const vertices: VectorND[] = [];
      const edges: [number, number][] = [];
      
      // Generate points on 3-sphere using hyperspherical coordinates
      for (let i = 0; i <= latSteps; i++) {
        for (let j = 0; j < lonSteps; j++) {
          const theta = (i / latSteps) * Math.PI;
          const phi = (j / lonSteps) * 2 * Math.PI;
          const psi = (j / lonSteps) * Math.PI; // Additional angle for 4D
          
          const x = radius * Math.sin(theta) * Math.sin(phi) * Math.cos(psi);
          const y = radius * Math.sin(theta) * Math.sin(phi) * Math.sin(psi);
          const z = radius * Math.sin(theta) * Math.cos(phi);
          const w = radius * Math.cos(theta);
          
          vertices.push(new VectorND([x, y, z, w]));
        }
      }
      
      // Connect grid
      for (let i = 0; i < latSteps; i++) {
        for (let j = 0; j < lonSteps; j++) {
          const current = i * lonSteps + j;
          const nextLat = (i + 1) * lonSteps + j;
          const nextLon = i * lonSteps + ((j + 1) % lonSteps);
          
          if (i < latSteps) edges.push([current, nextLat]);
          edges.push([current, nextLon]);
        }
      }
      
      return { name: '4D Sphere', dimension: 4, vertices, edges };
    }
  },
  spiral4D: {
    name: '4D Spiral',
    description: 'A helix that spirals through 4D',
    params: { turns: 4, pointsPerTurn: 20, radius: 1, pitch: 0.5 },
    generate: (params: { turns: number; pointsPerTurn: number; radius: number; pitch: number }) => {
      const { turns, pointsPerTurn, radius, pitch } = params;
      const vertices: VectorND[] = [];
      const edges: [number, number][] = [];
      const totalPoints = turns * pointsPerTurn;
      
      for (let i = 0; i < totalPoints; i++) {
        const t = (i / pointsPerTurn) * 2 * Math.PI;
        const w = (i / totalPoints) * turns * pitch - (turns * pitch) / 2;
        
        const x = radius * Math.cos(t);
        const y = radius * Math.sin(t);
        const z = radius * Math.cos(t * 2) * 0.3;
        
        vertices.push(new VectorND([x, y, z, w]));
        
        if (i > 0) {
          edges.push([i - 1, i]);
        }
      }
      
      return { name: '4D Spiral', dimension: 4, vertices, edges };
    }
  }
};

export function ParametricEditor({ onGeometryChange }: ParametricEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof presetFormulas>('torus4D');
  const [params, setParams] = useState<Record<string, number>>(presetFormulas.torus4D.params);

  const currentFormula = presetFormulas[selectedPreset];

  const handleGenerate = () => {
    try {
      const geometry = currentFormula.generate(params as any);
      onGeometryChange(geometry);
    } catch (e) {
      console.error('Failed to generate geometry:', e);
    }
  };

  const handlePresetChange = (preset: keyof typeof presetFormulas) => {
    setSelectedPreset(preset);
    setParams({ ...presetFormulas[preset].params });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-4 right-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg"
      >
        ✨ Custom Shapes
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 w-80 bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-purple-400">Parametric Shapes</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">×</button>
      </div>

      {/* Preset selector */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">Preset</label>
        <select
          value={selectedPreset}
          onChange={(e) => handlePresetChange(e.target.value as keyof typeof presetFormulas)}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white"
        >
          {Object.entries(presetFormulas).map(([key, formula]) => (
            <option key={key} value={key}>{formula.name}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">{currentFormula.description}</p>
      </div>

      {/* Parameter sliders */}
      <div className="space-y-3 mb-4">
        {Object.entries(params).map(([key, value]) => (
          <div key={key}>
            <label className="block text-sm text-gray-400 mb-1">
              {key}: {typeof value === 'number' ? value.toFixed(2) : value}
            </label>
            <input
              type="range"
              min={key.includes('Steps') ? 4 : 0.1}
              max={key.includes('Steps') ? 32 : 3}
              step={key.includes('Steps') ? 1 : 0.1}
              value={value as number}
              onChange={(e) => setParams({ ...params, [key]: parseFloat(e.target.value) })}
              className="w-full accent-purple-500"
            />
          </div>
        ))}
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded text-white font-medium"
      >
        Generate Shape
      </button>
      
      <button
        onClick={() => onGeometryChange(null)}
        className="w-full py-2 mt-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300"
      >
        Reset to Standard Shapes
      </button>
    </div>
  );
}
