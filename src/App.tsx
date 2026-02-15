import { Viewer } from './components/viewer';
import { ControlPanel } from './components/ui';
import { InfoPanel } from './components/educational';
import { useAppStore } from './stores/appStore';

function App() {
  const { geometryType, dimension } = useAppStore();
  
  // Get readable name
  const shapeNames: Record<string, string> = {
    hypercube: dimension === 4 ? 'Tesseract' : `${dimension}-cube`,
    simplex: dimension === 4 ? '5-cell' : `${dimension + 1}-simplex`,
    orthoplex: dimension === 4 ? '16-cell' : `${dimension}-orthoplex`,
    '24-cell': '24-cell',
  };

  return (
    <div className="w-full h-full relative">
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
      </div>
      
      {/* Control Panel */}
      <ControlPanel />
      
      {/* Educational Info Panel */}
      <InfoPanel />
    </div>
  );
}

export default App;
