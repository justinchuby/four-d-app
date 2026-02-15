import { useState, useEffect } from 'react';

interface FlatlandDemoProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FlatlandDemo({ isOpen, onClose }: FlatlandDemoProps) {
  const [slicePos, setSlicePos] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!isOpen || !isAnimating) return;
    
    const interval = setInterval(() => {
      setSlicePos(Math.sin(Date.now() * 0.001) * 1.2);
    }, 16);
    
    return () => clearInterval(interval);
  }, [isOpen, isAnimating]);

  if (!isOpen) return null;

  // Calculate sphere cross-section radius at slice position
  const sphereRadius = 1;
  const crossSectionRadius2D = Math.sqrt(Math.max(0, sphereRadius * sphereRadius - slicePos * slicePos));
  const crossSectionRadius3D = Math.sqrt(Math.max(0, sphereRadius * sphereRadius - slicePos * slicePos));

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full mx-4 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-cyan-400">Flatland Simulation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* 2D → 3D Analogy */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-orange-400 mb-2">
              2D Being Views 3D Sphere
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              A Flatlander (2D being) sees only a 2D slice of our 3D world.
            </p>
            
            {/* 2D visualization */}
            <div className="relative h-48 bg-gray-900 rounded border border-gray-700 overflow-hidden">
              {/* The plane (Flatland) */}
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-orange-500/50" />
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-700" />
              
              {/* The sphere (side view) */}
              <svg className="absolute inset-0" viewBox="-2 -2 4 4">
                {/* Sphere outline (3D view for us) */}
                <circle cx="0" cy={-slicePos} r={sphereRadius} fill="none" stroke="rgba(100,200,255,0.3)" strokeWidth="0.02" />
                
                {/* The slice line */}
                <line x1="-2" y1="0" x2="2" y2="0" stroke="orange" strokeWidth="0.02" />
                
                {/* What Flatlander sees: a line segment */}
                {crossSectionRadius2D > 0.01 && (
                  <line 
                    x1={-crossSectionRadius2D} 
                    y1="0" 
                    x2={crossSectionRadius2D} 
                    y2="0" 
                    stroke="cyan" 
                    strokeWidth="0.08"
                  />
                )}
              </svg>
              
              {/* Labels */}
              <div className="absolute bottom-2 left-2 text-xs text-gray-500">
                Sphere center: {slicePos.toFixed(2)}
              </div>
              <div className="absolute top-2 right-2 text-xs text-cyan-400">
                Flatlander sees: {crossSectionRadius2D > 0.01 ? `line (r=${crossSectionRadius2D.toFixed(2)})` : 'nothing!'}
              </div>
            </div>
          </div>

          {/* 3D → 4D Analogy */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-400 mb-2">
              3D Being (You!) Views 4D Hypersphere
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              We only see a 3D slice of 4D space. Same principle!
            </p>
            
            {/* 3D visualization (simplified as 2D diagram) */}
            <div className="relative h-48 bg-gray-900 rounded border border-gray-700 overflow-hidden">
              {/* Our 3D "plane" */}
              <div className="absolute inset-x-4 top-1/2 h-px bg-purple-500/50" />
              
              {/* The hypersphere cross-section */}
              <svg className="absolute inset-0" viewBox="-2 -2 4 4">
                {/* Hypersphere outline (4D - we can't see this) */}
                <circle cx="0" cy={-slicePos} r={sphereRadius} fill="none" stroke="rgba(200,100,255,0.2)" strokeWidth="0.02" strokeDasharray="0.1" />
                
                {/* The 3D slice plane */}
                <line x1="-2" y1="0" x2="2" y2="0" stroke="purple" strokeWidth="0.02" />
                
                {/* What we see: a 3D sphere (shown as circle) */}
                {crossSectionRadius3D > 0.01 && (
                  <circle 
                    cx="0" 
                    cy="0" 
                    r={crossSectionRadius3D} 
                    fill="rgba(200,100,255,0.3)"
                    stroke="magenta" 
                    strokeWidth="0.04"
                  />
                )}
              </svg>
              
              {/* Labels */}
              <div className="absolute bottom-2 left-2 text-xs text-gray-500">
                Hypersphere W: {slicePos.toFixed(2)}
              </div>
              <div className="absolute top-2 right-2 text-xs text-purple-400">
                You see: {crossSectionRadius3D > 0.01 ? `sphere (r=${crossSectionRadius3D.toFixed(2)})` : 'nothing!'}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            className={`px-4 py-2 rounded ${isAnimating ? 'bg-orange-600' : 'bg-gray-700'}`}
          >
            {isAnimating ? '⏸ Pause' : '▶ Play'}
          </button>
          
          <input
            type="range"
            min={-1.2}
            max={1.2}
            step={0.01}
            value={slicePos}
            onChange={(e) => {
              setIsAnimating(false);
              setSlicePos(parseFloat(e.target.value));
            }}
            className="flex-1 accent-cyan-500"
          />
          
          <span className="text-sm text-gray-400 w-24">
            Position: {slicePos.toFixed(2)}
          </span>
        </div>

        {/* Explanation */}
        <div className="mt-4 p-4 bg-gray-800/50 rounded text-sm text-gray-300">
          <p className="mb-2">
            <strong className="text-cyan-400">Key insight:</strong> Just as a 2D being would see a 3D sphere 
            appear as a point, grow to a circle, and shrink away...
          </p>
          <p>
            <strong className="text-purple-400">We</strong> would see a 4D hypersphere appear as a point, 
            grow to a sphere, reach maximum size, then shrink and vanish as it passes through our 3D "slice" of 4D space!
          </p>
        </div>
      </div>
    </div>
  );
}
