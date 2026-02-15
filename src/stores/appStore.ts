import { create } from 'zustand';
import { getRotationPlanes } from '../core/math';
import type { ProjectionType } from '../core/projection';
import type { GeometryND } from '../core/geometry';

export interface AppState {
  // Geometry
  geometryType: 'hypercube' | 'simplex' | 'orthoplex' | '24-cell' | 'custom';
  dimension: number;
  customGeometry: GeometryND | null;
  
  // Rotation state - angles for each rotation plane
  rotationAngles: Record<string, number>;
  
  // Projection
  projectionType: ProjectionType;
  viewDistance: number;
  
  // Animation
  isAnimating: boolean;
  animationSpeed: number;
  activeRotationPlanes: string[];
  
  // Actions
  setGeometryType: (type: AppState['geometryType']) => void;
  setDimension: (dim: number) => void;
  setCustomGeometry: (geometry: GeometryND | null) => void;
  setRotationAngle: (plane: string, angle: number) => void;
  setProjectionType: (type: ProjectionType) => void;
  setViewDistance: (distance: number) => void;
  toggleAnimation: () => void;
  setAnimationSpeed: (speed: number) => void;
  toggleRotationPlane: (plane: string) => void;
  resetRotations: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  geometryType: 'hypercube',
  dimension: 4,
  customGeometry: null,
  rotationAngles: {},
  projectionType: 'perspective',
  viewDistance: 3,
  isAnimating: true,
  animationSpeed: 0.5,
  activeRotationPlanes: ['XW', 'YW'], // Default: rotate in XW and YW planes
  
  // Actions
  setGeometryType: (type) => set({ geometryType: type, customGeometry: null }),
  
  setDimension: (dim) => set(() => {
    // Reset rotation angles and active planes when dimension changes
    const planes = getRotationPlanes(dim);
    const planeNames = planes.map(([i, j]) => {
      const names = ['X', 'Y', 'Z', 'W', 'V', 'U'];
      return `${names[i] ?? `A${i}`}${names[j] ?? `A${j}`}`;
    });
    
    // Activate rotations in the higher dimension planes by default
    const activePlanes = planeNames.filter(name => 
      name.includes('W') || name.includes('V') || name.includes('U')
    ).slice(0, 2);
    
    return {
      dimension: dim,
      rotationAngles: {},
      activeRotationPlanes: activePlanes,
      customGeometry: null,
    };
  }),
  
  setCustomGeometry: (geometry) => set(() => {
    if (geometry) {
      return { 
        customGeometry: geometry, 
        geometryType: 'custom' as const,
        dimension: geometry.dimension,
      };
    }
    return { customGeometry: null, geometryType: 'hypercube' as const };
  }),
  
  setRotationAngle: (plane, angle) => set((state) => ({
    rotationAngles: { ...state.rotationAngles, [plane]: angle }
  })),
  
  setProjectionType: (type) => set({ projectionType: type }),
  
  setViewDistance: (distance) => set({ viewDistance: distance }),
  
  toggleAnimation: () => set((state) => ({ isAnimating: !state.isAnimating })),
  
  setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
  
  toggleRotationPlane: (plane) => set((state) => {
    const planes = state.activeRotationPlanes;
    if (planes.includes(plane)) {
      return { activeRotationPlanes: planes.filter(p => p !== plane) };
    } else {
      return { activeRotationPlanes: [...planes, plane] };
    }
  }),
  
  resetRotations: () => set({ rotationAngles: {} }),
}));
