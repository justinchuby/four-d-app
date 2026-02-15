import { useAppStore } from '../../stores/appStore';
import { getRotationPlaneNames } from '../../core/math';

export function ControlPanel() {
  const {
    geometryType,
    setGeometryType,
    dimension,
    setDimension,
    renderMode,
    setRenderMode,
    projectionType,
    setProjectionType,
    viewDistance,
    setViewDistance,
    isAnimating,
    toggleAnimation,
    animationSpeed,
    setAnimationSpeed,
    activeRotationPlanes,
    toggleRotationPlane,
    resetRotations,
    sliceEnabled,
    setSliceEnabled,
    slicePosition,
    setSlicePosition,
    sliceAnimating,
    toggleSliceAnimation,
  } = useAppStore();

  const rotationPlanes = getRotationPlaneNames(dimension);

  return (
    <div className="absolute top-4 right-4 w-72 max-h-[90vh] overflow-y-auto bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 text-white shadow-xl border border-gray-700">
      <h2 className="text-lg font-bold mb-4 text-cyan-400">Controls</h2>
      
      {/* Geometry Selection */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">Shape</label>
        <select
          value={geometryType}
          onChange={(e) => setGeometryType(e.target.value as any)}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
        >
          <option value="hypercube">Hypercube (Tesseract)</option>
          <option value="simplex">Simplex (5-cell)</option>
          <option value="orthoplex">Orthoplex (16-cell)</option>
          {dimension === 4 && <option value="24-cell">24-cell</option>}
          {dimension === 4 && <option value="600-cell">600-cell</option>}
          {dimension === 4 && <option value="clifford-torus">Clifford Torus</option>}
          {dimension === 4 && <option value="duocylinder">Duocylinder</option>}
          {dimension === 4 && <option value="hypercone">Hypercone</option>}
          {dimension === 4 && <option value="grand-antiprism">Grand Antiprism</option>}
        </select>
      </div>

      {/* Dimension Selection */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">
          Dimension: {dimension}D
        </label>
        <input
          type="range"
          min={3}
          max={6}
          value={dimension}
          onChange={(e) => setDimension(parseInt(e.target.value))}
          className="w-full accent-cyan-500"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>3D</span>
          <span>4D</span>
          <span>5D</span>
          <span>6D</span>
        </div>
      </div>

      {/* Render Mode */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">Render Mode</label>
        <select
          value={renderMode}
          onChange={(e) => setRenderMode(e.target.value as any)}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
        >
          <option value="both">Faces + Wireframe</option>
          <option value="wireframe">Wireframe Only</option>
          <option value="solid">Faces Only</option>
        </select>
      </div>

      {/* Projection Type */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">Projection</label>
        <select
          value={projectionType}
          onChange={(e) => setProjectionType(e.target.value as any)}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
        >
          <option value="perspective">Perspective</option>
          <option value="orthographic">Orthographic</option>
          <option value="stereographic">Stereographic</option>
        </select>
      </div>

      {/* View Distance (for perspective) */}
      {projectionType === 'perspective' && (
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">
            View Distance: {viewDistance.toFixed(1)}
          </label>
          <input
            type="range"
            min={1.5}
            max={10}
            step={0.1}
            value={viewDistance}
            onChange={(e) => setViewDistance(parseFloat(e.target.value))}
            className="w-full accent-cyan-500"
          />
        </div>
      )}

      {/* Animation Controls */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-gray-400">Animation</label>
          <button
            onClick={toggleAnimation}
            className={`px-3 py-1 rounded text-sm ${
              isAnimating 
                ? 'bg-cyan-600 hover:bg-cyan-700' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isAnimating ? 'Playing' : 'Paused'}
          </button>
        </div>
        <label className="block text-sm text-gray-400 mb-1">
          Speed: {animationSpeed.toFixed(1)}×
        </label>
        <input
          type="range"
          min={0.1}
          max={2}
          step={0.1}
          value={animationSpeed}
          onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
          className="w-full accent-cyan-500"
        />
      </div>

      {/* Rotation Planes */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          Rotation Planes
        </label>
        <div className="flex flex-wrap gap-2">
          {rotationPlanes.map((plane) => (
            <button
              key={plane}
              onClick={() => toggleRotationPlane(plane)}
              className={`px-2 py-1 rounded text-xs font-mono ${
                activeRotationPlanes.includes(plane)
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {plane}
            </button>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={resetRotations}
        className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
      >
        Reset Rotations
      </button>

      {/* Cross-Section Slicer */}
      {dimension >= 4 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400">4D Cross-Section</label>
            <button
              onClick={() => setSliceEnabled(!sliceEnabled)}
              className={`px-3 py-1 rounded text-sm ${
                sliceEnabled 
                  ? 'bg-orange-600 hover:bg-orange-700' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {sliceEnabled ? 'On' : 'Off'}
            </button>
          </div>
          
          {sliceEnabled && (
            <>
              <label className="block text-sm text-gray-400 mb-1">
                Slice W = {slicePosition.toFixed(2)}
              </label>
              <input
                type="range"
                min={-1.5}
                max={1.5}
                step={0.01}
                value={slicePosition}
                onChange={(e) => setSlicePosition(parseFloat(e.target.value))}
                className="w-full accent-orange-500"
              />
              <button
                onClick={toggleSliceAnimation}
                className={`w-full mt-2 py-1 rounded text-sm ${
                  sliceAnimating 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {sliceAnimating ? '⏸ Stop Slice Animation' : '▶ Animate Slice'}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Watch the shape appear/disappear as the 3D "slice" moves through 4D space!
              </p>
            </>
          )}
        </div>
      )}

      {/* Physics Simulation */}
      <PhysicsControls />
    </div>
  );
}

function PhysicsControls() {
  const {
    dimension,
    physicsEnabled,
    setPhysicsEnabled,
    gravityAxis,
    setGravityAxis,
    resetPhysics,
  } = useAppStore();

  const axisNames = ['X', 'Y', 'Z', 'W', 'V', 'U'];

  return (
    <div className="mt-4 pt-4 border-t border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-gray-400">🎮 Physics Mode</label>
        <div className="flex gap-2">
          {physicsEnabled && (
            <button
              onClick={resetPhysics}
              className="px-2 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600"
            >
              Reset
            </button>
          )}
          <button
            onClick={() => setPhysicsEnabled(!physicsEnabled)}
            className={`px-3 py-1 rounded text-sm ${
              physicsEnabled 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {physicsEnabled ? 'On' : 'Off'}
          </button>
        </div>
      </div>
      
      {physicsEnabled && (
        <>
          <label className="block text-sm text-gray-400 mb-2">
            Gravity Direction
          </label>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: dimension }, (_, i) => (
              <button
                key={i}
                onClick={() => setGravityAxis(i)}
                className={`px-3 py-1 rounded text-xs font-mono ${
                  gravityAxis === i
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                -{axisNames[i] ?? `A${i}`}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Watch the {dimension}D shape fall and bounce in N-dimensional gravity!
          </p>
        </>
      )}
    </div>
  );
}
