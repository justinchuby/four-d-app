import { useState } from 'react';
import { Viewer } from './components/viewer';
import { ControlPanel, ParametricEditor, StatsDisplay, KeyboardShortcuts } from './components/ui';
import { InfoPanel, MathPanel, FlatlandDemo } from './components/educational';
import { useAppStore } from './stores/appStore';

function App() {
  const { geometryType, dimension, customGeometry, setCustomGeometry } = useAppStore();
  const [showFlatland, setShowFlatland] = useState(false);
  
  // Get readable name
  const shapeNames: Record<string, string> = {
    hypercube: dimension === 4 ? 'Tesseract' : `${dimension}-cube`,
    simplex: dimension === 4 ? '5-cell' : `${dimension + 1}-simplex`,
    orthoplex: dimension === 4 ? '16-cell' : `${dimension}-orthoplex`,
    '24-cell': '24-cell',
    custom: customGeometry?.name || 'Custom Shape',
  };

  return (
    <div className="w-full h-full relative">
      {/* Keyboard shortcuts handler */}
      <KeyboardShortcuts />
      
      {/* 3D Viewer */}
      <Viewer />
      
      {/* Title overlay */}
      <div className="absolute top-4 left-4 text-white">
        <h1 className="text-2xl font-bold">
          {dimension}D Renderer
        </h1>
        <p className="text-sm text-gray-400">
          {shapeNames[geometryType] || geometryType}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Drag to rotate view • Scroll to zoom
        </p>
        <p className="text-xs text-gray-600 mt-0.5">
          Space: play/pause • R: reset • 1-4: shapes
        </p>
        
        {/* Flatland Demo Button */}
        <button
          onClick={() => setShowFlatland(true)}
          className="mt-3 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-sm flex items-center gap-2"
        >
          📖 Flatland Demo
        </button>
      </div>
      
      {/* Control Panel */}
      <ControlPanel />
      
      {/* Stats Display */}
      <StatsDisplay />
      
      {/* Parametric Shape Editor */}
      <ParametricEditor onGeometryChange={setCustomGeometry} />
      
      {/* Educational Info Panel */}
      <InfoPanel />
      
      {/* Math Panel */}
      <MathPanel />
      
      {/* Flatland Demo Modal */}
      <FlatlandDemo isOpen={showFlatland} onClose={() => setShowFlatland(false)} />
    </div>
  );
}

export default App;
