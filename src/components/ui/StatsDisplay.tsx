import { useEffect, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { createHypercube, createSimplex, createOrthoplex, create24Cell } from '../../core/geometry';

export function StatsDisplay() {
  const { geometryType, dimension, customGeometry } = useAppStore();

  const stats = useMemo(() => {
    if (geometryType === 'custom' && customGeometry) {
      return {
        vertices: customGeometry.vertices.length,
        edges: customGeometry.edges.length,
        name: customGeometry.name,
      };
    }
    
    let geom;
    switch (geometryType) {
      case 'hypercube':
        geom = createHypercube(dimension);
        break;
      case 'simplex':
        geom = createSimplex(dimension);
        break;
      case 'orthoplex':
        geom = createOrthoplex(dimension);
        break;
      case '24-cell':
        geom = create24Cell();
        break;
      default:
        geom = createHypercube(dimension);
    }
    
    return {
      vertices: geom.vertices.length,
      edges: geom.edges.length,
      name: geom.name,
    };
  }, [geometryType, dimension, customGeometry]);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm flex gap-4">
      <span className="text-gray-400">
        <span className="text-cyan-400 font-mono">{stats.vertices}</span> vertices
      </span>
      <span className="text-gray-400">
        <span className="text-cyan-400 font-mono">{stats.edges}</span> edges
      </span>
    </div>
  );
}

export function KeyboardShortcuts() {
  const { toggleAnimation, resetRotations, setGeometryType } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          toggleAnimation();
          break;
        case 'r':
          resetRotations();
          break;
        case '1':
          setGeometryType('hypercube');
          break;
        case '2':
          setGeometryType('simplex');
          break;
        case '3':
          setGeometryType('orthoplex');
          break;
        case '4':
          setGeometryType('24-cell');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleAnimation, resetRotations, setGeometryType]);

  return null;
}
