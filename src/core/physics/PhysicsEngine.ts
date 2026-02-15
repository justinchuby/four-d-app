import { VectorND } from '../math/VectorND';

/**
 * A particle in N-dimensional space with position, velocity, and mass
 */
export interface Particle {
  position: VectorND;
  velocity: VectorND;
  mass: number;
}

/**
 * Physics simulation for N-dimensional particles
 */
export class PhysicsEngine {
  particles: Particle[] = [];
  dimension: number;
  gravity: VectorND;
  damping: number = 0.96;  // Strong damping for stability
  timeScale: number = 1.0; // Normal time scale
  
  // Simulation bounds
  bounds: { min: number; max: number } = { min: -2, max: 2 };
  
  constructor(dimension: number) {
    this.dimension = dimension;
    // Default gravity points "down" in Y direction (more intuitive)
    const gravityComponents = new Array(dimension).fill(0);
    gravityComponents[Math.min(1, dimension - 1)] = -3;
    this.gravity = new VectorND(gravityComponents);
  }
  
  /**
   * Add a particle to the simulation
   */
  addParticle(position: VectorND, velocity?: VectorND, mass = 1): void {
    this.particles.push({
      position: position.extend(this.dimension),
      velocity: velocity?.extend(this.dimension) ?? VectorND.zero(this.dimension),
      mass,
    });
  }
  
  /**
   * Create particles at the vertices of a geometry
   */
  addGeometryParticles(vertices: VectorND[], mass = 1): void {
    for (const vertex of vertices) {
      this.addParticle(vertex.clone(), VectorND.zero(this.dimension), mass);
    }
  }
  
  /**
   * Apply spring forces to maintain edge connections
   */
  applySpringForces(edges: [number, number][], restLength = 1, stiffness = 0.3): void {
    for (const [i, j] of edges) {
      if (i >= this.particles.length || j >= this.particles.length) continue;
      
      const p1 = this.particles[i];
      const p2 = this.particles[j];
      
      const diff = p2.position.subtract(p1.position);
      const dist = diff.magnitude();
      if (dist < 0.001) continue;
      
      const displacement = dist - restLength;
      // Use less stiffness to avoid oscillation
      const force = diff.normalize().scale(displacement * stiffness * 0.5);
      
      // Apply force proportional to mass
      p1.velocity = p1.velocity.add(force.scale(1 / p1.mass));
      p2.velocity = p2.velocity.subtract(force.scale(1 / p2.mass));
    }
  }
  
  /**
   * Apply collision forces between particles
   */
  applyCollisions(radius = 0.15, restitution = 0.7): void {
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        
        const diff = p2.position.subtract(p1.position);
        const dist = diff.magnitude();
        
        if (dist < radius * 2 && dist > 0.001) {
          const normal = diff.normalize();
          const relVel = p2.velocity.subtract(p1.velocity);
          const velAlongNormal = relVel.dot(normal);
          
          if (velAlongNormal > 0) continue;
          
          const totalMass = p1.mass + p2.mass;
          const impulse = -(1 + restitution) * velAlongNormal / totalMass;
          
          p1.velocity = p1.velocity.subtract(normal.scale(impulse * p2.mass));
          p2.velocity = p2.velocity.add(normal.scale(impulse * p1.mass));
          
          const overlap = radius * 2 - dist;
          const separation = normal.scale(overlap / 2);
          p1.position = p1.position.subtract(separation);
          p2.position = p2.position.add(separation);
        }
      }
    }
  }
  
  /**
   * Apply boundary constraints (bounce off N-dimensional walls)
   */
  applyBoundaryConstraints(restitution = 0.7): void {
    for (const particle of this.particles) {
      for (let d = 0; d < this.dimension; d++) {
        const pos = particle.position.get(d);
        const vel = particle.velocity.get(d);
        
        if (pos < this.bounds.min) {
          const newPos = [...particle.position.components];
          newPos[d] = this.bounds.min;
          particle.position = new VectorND(newPos);
          
          const newVel = [...particle.velocity.components];
          newVel[d] = Math.abs(vel) * restitution;
          particle.velocity = new VectorND(newVel);
        } else if (pos > this.bounds.max) {
          const newPos = [...particle.position.components];
          newPos[d] = this.bounds.max;
          particle.position = new VectorND(newPos);
          
          const newVel = [...particle.velocity.components];
          newVel[d] = -Math.abs(vel) * restitution;
          particle.velocity = new VectorND(newVel);
        }
      }
    }
  }
  
  /**
   * Step the simulation forward
   */
  step(deltaTime: number, edges?: [number, number][]): void {
    // Clamp delta time to prevent instability
    const dt = Math.min(deltaTime, 0.033) * this.timeScale;
    
    // Apply gravity
    for (const particle of this.particles) {
      particle.velocity = particle.velocity.add(this.gravity.scale(dt));
    }
    
    // Apply spring forces if edges provided
    if (edges) {
      this.applySpringForces(edges);
    }
    
    // Update positions with damping
    for (const particle of this.particles) {
      // Apply damping before position update
      particle.velocity = particle.velocity.scale(this.damping);
      particle.position = particle.position.add(particle.velocity.scale(dt));
    }
    
    // Apply boundary constraints
    this.applyBoundaryConstraints();
  }
  
  /**
   * Get current particle positions
   */
  getPositions(): VectorND[] {
    return this.particles.map(p => p.position.clone());
  }
  
  /**
   * Apply random impulse to all particles
   */
  applyRandomImpulse(strength = 0.3): void {
    for (const particle of this.particles) {
      const impulse: number[] = [];
      for (let d = 0; d < this.dimension; d++) {
        impulse.push((Math.random() - 0.5) * strength);
      }
      particle.velocity = particle.velocity.add(new VectorND(impulse));
    }
  }
  
  /**
   * Set gravity direction
   */
  setGravityAxis(axis: number, strength = 0.3): void {
    const components = new Array(this.dimension).fill(0);
    if (axis < this.dimension) {
      components[axis] = -strength;
    }
    this.gravity = new VectorND(components);
  }
  
  /**
   * Clear all particles
   */
  clear(): void {
    this.particles = [];
  }
}
