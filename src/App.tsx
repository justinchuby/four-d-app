import { useState } from 'react';
import { Viewer } from './components/viewer';
import { ControlPanel, ParametricEditor, StatsDisplay, KeyboardShortcuts, PhysicsInfo } from './components/ui';
import { InfoPanel, MathPanel, FlatlandDemo, MultiSliceViewer, ProjectionComparison } from './components/educational';
import { useAppStore } from './stores/appStore';

function App() {
  const { geometryType, dimension, customGeometry, setCustomGeometry } = useAppStore();
  const [showFlatland, setShowFlatland] = useState(false);
  const [showMultiSlice, setShowMultiSlice] = useState(false);
  const [showProjections, setShowProjections] = useState(false);
  
  // Get readable name
  const shapeNames: Record<string, string> = {
    hypercube: dimension === 4 ? 'Tesseract' : `${dimension}-cube`,
    simplex: dimension === 4 ? '5-cell' : `${dimension + 1}-simplex`,
    orthoplex: dimension === 4 ? '16-cell' : `${dimension}-orthoplex`,
    '24-cell': '24-cell',
    '600-cell': '600-cell',
    'clifford-torus': 'Clifford Torus',
    'duocylinder': 'Duocylinder',
    'hypercone': 'Hypercone',
    'grand-antiprism': 'Grand Antiprism',
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
        
        {/* Educational Mode Buttons */}
        <div className="mt-3 flex flex-col gap-2">
          <button
            onClick={() => setShowMultiSlice(true)}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded text-sm flex items-center gap-2"
          >
            🎓 Multi-Slice Viewer
          </button>
          <button
            onClick={() => setShowProjections(true)}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm flex items-center gap-2"
          >
            🔄 6 Rotation Planes
          </button>
          <button
            onClick={() => setShowFlatland(true)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-sm flex items-center gap-2"
          >
            📖 Flatland Demo
          </button>
        </div>
      </div>
      
      {/* Control Panel */}
      <ControlPanel />
      
      {/* Stats Display */}
      <StatsDisplay />
      
      {/* Physics Info Panel */}
      <PhysicsInfo />
      
      {/* Parametric Shape Editor */}
      <ParametricEditor onGeometryChange={setCustomGeometry} />
      
      {/* Educational Info Panel */}
      <InfoPanel />
      
      {/* Math Panel */}
      <MathPanel />
      
      {/* Educational Modals */}
      <FlatlandDemo isOpen={showFlatland} onClose={() => setShowFlatland(false)} />
      <MultiSliceViewer isOpen={showMultiSlice} onClose={() => setShowMultiSlice(false)} />
      <ProjectionComparison isOpen={showProjections} onClose={() => setShowProjections(false)} />
    </div>
  );
}

export default App;
