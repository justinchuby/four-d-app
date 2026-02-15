import { useAppStore } from '../../stores/appStore';

export function PhysicsInfo() {
  const { physicsEnabled, dimension, gravityAxis } = useAppStore();

  if (!physicsEnabled) return null;

  const axisNames = ['X', 'Y', 'Z', 'W', 'V', 'U'];
  const gravityName = axisNames[gravityAxis] ?? `Axis ${gravityAxis}`;

  return (
    <div className="absolute top-20 left-4 w-64 bg-red-900/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm border border-red-700">
      <h3 className="font-bold text-red-300 mb-2">🎮 Physics Mode Active</h3>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-300">Dimension:</span>
          <span className="text-red-300 font-mono">{dimension}D</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-300">Gravity:</span>
          <span className="text-red-300 font-mono">-{gravityName} axis</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-300">Bounds:</span>
          <span className="text-red-300 font-mono">{dimension}D hypercube</span>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-red-700/50 text-xs text-gray-400">
        <p className="mb-1">
          <strong className="text-red-300">What's happening:</strong>
        </p>
        <p className="leading-relaxed">
          Each vertex is a particle with mass. They're connected by springs 
          (edges) and fall under {dimension}D gravity. When they hit the 
          {dimension}D "walls", they bounce back!
        </p>
        {dimension >= 4 && gravityAxis >= 3 && (
          <p className="mt-2 text-yellow-400">
            ⚠️ Gravity is in the {gravityName} direction - you're seeing 
            objects fall "into" or "out of" the 4th dimension!
          </p>
        )}
      </div>
    </div>
  );
}
