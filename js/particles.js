// Generic ambient particle system used to give each deity a distinct
// screen-space atmosphere (falling lightning, drifting petals, embers, etc).
// Deliberately decoupled from face tracking — this is background flavor,
// not something anchored to a landmark.

class ParticleSystem {
  /**
   * @param {object} config
   * @param {(ctx:CanvasRenderingContext2D, p:object) => void} config.draw - draws one particle
   * @param {() => object} config.spawn - returns a fresh particle state object
   * @param {(p:object, dt:number, w:number, h:number) => boolean} config.step - mutates particle, returns false to kill it
   * @param {number} config.rate - average particles spawned per second
   * @param {number} [config.max] - hard cap on live particles
   */
  constructor(config) {
    this.draw = config.draw;
    this.spawn = config.spawn;
    this.step = config.step;
    this.rate = config.rate;
    this.max = config.max || 60;
    this.particles = [];
    this._spawnAccumulator = 0;
  }

  reset() {
    this.particles.length = 0;
    this._spawnAccumulator = 0;
  }

  update(dt, w, h) {
    this._spawnAccumulator += this.rate * dt;
    while (this._spawnAccumulator >= 1 && this.particles.length < this.max) {
      this._spawnAccumulator -= 1;
      this.particles.push(this.spawn(w, h));
    }
    this.particles = this.particles.filter((p) => this.step(p, dt, w, h));
  }

  render(ctx) {
    for (const p of this.particles) this.draw(ctx, p);
  }
}

// ---- Reusable particle factories -----------------------------------------
// Each factory takes a color (or palette) and returns a ParticleSystem.
// All spawn positions are in normalized screen space (0..1) scaled to w/h
// at draw time, so systems behave sensibly across canvas sizes.

const Particles = {
  /** Bolts of light falling from the top of the screen (Zeus). */
  lightning(color = '#ffe066') {
    return new ParticleSystem({
      rate: 1.4,
      max: 6,
      spawn: (w) => ({
        x: Math.random() * w,
        y: -20,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
        len: 60 + Math.random() * 90,
        seed: Math.random() * 1000,
      }),
      step: (p, dt) => {
        p.life += dt;
        p.y += (900 * dt);
        return p.life < p.maxLife;
      },
      draw: (ctx, p) => {
        const alpha = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        let x = p.x, y = p.y;
        ctx.moveTo(x, y);
        const segs = 4;
        for (let i = 0; i < segs; i++) {
          x += (Math.sin(p.seed + i) * 14);
          y += p.len / segs;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      },
    });
  },

  /** Slow rising embers / sparks (Hephaestus forge, Ares war-fire). */
  embers(color = '#ff7a30') {
    return new ParticleSystem({
      rate: 6,
      max: 40,
      spawn: (w, h) => ({
        x: Math.random() * w,
        y: h + 10,
        vx: (Math.random() - 0.5) * 20,
        vy: -40 - Math.random() * 60,
        r: 1.5 + Math.random() * 2.5,
        life: 0,
        maxLife: 2 + Math.random() * 1.5,
      }),
      step: (p, dt) => {
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx += (Math.random() - 0.5) * 6;
        return p.life < p.maxLife;
      },
      draw: (ctx, p) => {
        const alpha = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      },
    });
  },

  /** Drifting droplets falling and fading (Poseidon). */
  waterDrops(color = '#4fd6ff') {
    return new ParticleSystem({
      rate: 5,
      max: 30,
      spawn: (w) => ({
        x: Math.random() * w,
        y: -10,
        vy: 120 + Math.random() * 80,
        r: 2 + Math.random() * 3,
        life: 0,
        maxLife: 1.6 + Math.random(),
      }),
      step: (p, dt, w, h) => {
        p.life += dt;
        p.y += p.vy * dt;
        return p.life < p.maxLife && p.y < h + 20;
      },
      draw: (ctx, p) => {
        const alpha = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha) * 0.8;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.r * 0.6, p.r, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      },
    });
  },

  /** Soft drifting petals, side to side (Aphrodite, Demeter chaff variant). */
  petals(color = '#ff8fb3') {
    return new ParticleSystem({
      rate: 3,
      max: 24,
      spawn: (w) => ({
        x: Math.random() * w,
        y: -10,
        vy: 30 + Math.random() * 25,
        vx: (Math.random() - 0.5) * 40,
        r: 4 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 2,
        life: 0,
        maxLife: 4 + Math.random() * 2,
      }),
      step: (p, dt, w, h) => {
        p.life += dt;
        p.x += (p.vx + Math.sin(p.life * 2) * 15) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        return p.life < p.maxLife && p.y < h + 20;
      },
      draw: (ctx, p) => {
        const alpha = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha) * 0.9;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r, p.r * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      },
    });
  },

  /** Twinkling stars scattered across the whole frame (Artemis). */
  stars(color = '#e6f0ff') {
    return new ParticleSystem({
      rate: 2,
      max: 20,
      spawn: (w, h) => ({
        x: Math.random() * w,
        y: Math.random() * h * 0.6,
        r: 1 + Math.random() * 1.8,
        life: 0,
        maxLife: 1.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
      }),
      step: (p, dt) => {
        p.life += dt;
        return p.life < p.maxLife;
      },
      draw: (ctx, p) => {
        const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(p.phase + p.life * 6));
        const alpha = Math.min(p.life * 2, 1 - p.life / p.maxLife) * twinkle;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      },
    });
  },

  /** Small drifting shapes (leaves/feathers/grapes) defined by a custom drawShape fn. */
  driftShapes(color, drawShape) {
    return new ParticleSystem({
      rate: 2.2,
      max: 18,
      spawn: (w) => ({
        x: Math.random() * w,
        y: -10,
        vy: 25 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 25,
        s: 5 + Math.random() * 5,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 1.5,
        life: 0,
        maxLife: 5 + Math.random() * 2,
      }),
      step: (p, dt, w, h) => {
        p.life += dt;
        p.x += (p.vx + Math.sin(p.life * 1.5) * 12) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        return p.life < p.maxLife && p.y < h + 20;
      },
      draw: (ctx, p) => {
        const alpha = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha) * 0.9;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = color;
        drawShape(ctx, p.s);
        ctx.restore();
      },
    });
  },
};
