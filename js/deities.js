// Procedural headwear + aura + particle definitions for each deity.
// Everything is drawn with canvas paths scaled off the tracked face, rather
// than image assets — keeps the app self-contained and every prop crisp at
// any resolution.
//
// Drawing convention: every draw*() primitive receives
//   (ctx, cx, cy, angle, scale, opts)
// where (cx, cy) is the anchor point just above the tracked forehead,
// `angle` is the face's roll in radians, and `scale` is the face width in
// pixels (used as the base unit so props size with the face).

const Draw = {
  /** A ring of pointed leaves with small berries — laurel / olive / wheat wreaths. */
  leafWreath(ctx, cx, cy, angle, scale, { leafColor, berryColor, leafCount = 14, spread = 1.0, berries = true }) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const r = scale * 0.62 * spread;
    for (let i = 0; i < leafCount; i++) {
      const t = (i / leafCount) * Math.PI - Math.PI / 2; // arch over the top, ear to ear
      const lx = Math.cos(t) * r;
      const ly = -Math.sin(t) * r * 0.65 - scale * 0.05;
      const leafAngle = t + Math.PI / 2;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(leafAngle);
      ctx.fillStyle = leafColor;
      ctx.beginPath();
      const lw = scale * 0.05, ll = scale * 0.16;
      ctx.moveTo(0, -ll / 2);
      ctx.quadraticCurveTo(lw, 0, 0, ll / 2);
      ctx.quadraticCurveTo(-lw, 0, 0, -ll / 2);
      ctx.fill();
      if (berries && i % 3 === 0) {
        ctx.fillStyle = berryColor || leafColor;
        ctx.beginPath();
        ctx.arc(0, ll / 2 + scale * 0.03, scale * 0.025, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  },

  /** A circlet with radiating spikes/rays — sun crown, trident-point crown, star crown. */
  radialCrown(ctx, cx, cy, angle, scale, { color, glow, spikeCount = 9, spikeLen = 0.5, spikeWidth = 0.06, bandHeight = 0.12 }) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const bandW = scale * 0.95, bandH = scale * bandHeight;
    ctx.fillStyle = color;
    ctx.shadowColor = glow || color;
    ctx.shadowBlur = scale * 0.08;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-bandW / 2, -bandH / 2 - scale * 0.02, bandW, bandH, bandH / 2)
                  : ctx.rect(-bandW / 2, -bandH / 2 - scale * 0.02, bandW, bandH);
    ctx.fill();
    for (let i = 0; i < spikeCount; i++) {
      const t = spikeCount === 1 ? 0.5 : i / (spikeCount - 1);
      const sx = (t - 0.5) * bandW;
      const len = scale * spikeLen * (0.7 + 0.3 * Math.sin(t * Math.PI));
      const w = scale * spikeWidth;
      ctx.beginPath();
      ctx.moveTo(sx - w / 2, -bandH / 2 - scale * 0.02);
      ctx.lineTo(sx, -bandH / 2 - scale * 0.02 - len);
      ctx.lineTo(sx + w / 2, -bandH / 2 - scale * 0.02);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  },

  /** A simple gem-set circlet (Hera's regal band), optionally with a feather fan behind. */
  circlet(ctx, cx, cy, angle, scale, { bandColor, gemColor, fan = false, fanColor }) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    if (fan) {
      const feathers = 7;
      for (let i = 0; i < feathers; i++) {
        const t = (i / (feathers - 1)) - 0.5;
        const fx = t * scale * 1.1;
        const fLen = scale * 0.55;
        ctx.save();
        ctx.translate(fx, -scale * 0.1);
        ctx.rotate(t * 0.6);
        const grad = ctx.createLinearGradient(0, 0, 0, -fLen);
        grad.addColorStop(0, fanColor);
        grad.addColorStop(1, 'rgba(255,255,255,0.15)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, -fLen / 2, scale * 0.06, fLen / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#20324a';
        ctx.beginPath();
        ctx.arc(0, -fLen + scale * 0.06, scale * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    const bandW = scale * 0.95, bandH = scale * 0.1;
    ctx.fillStyle = bandColor;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-bandW / 2, -bandH / 2 - scale * 0.02, bandW, bandH, bandH / 2)
                  : ctx.rect(-bandW / 2, -bandH / 2 - scale * 0.02, bandW, bandH);
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      const t = (i / 4) - 0.5;
      ctx.fillStyle = gemColor;
      ctx.beginPath();
      ctx.arc(t * bandW * 0.85, -scale * 0.02, scale * 0.03, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },

  /** A domed helmet with cheek guards and a crest/plume — Ares, Athena, Hephaestus. */
  helmet(ctx, cx, cy, angle, scale, { domeColor, crestColor, cheekColor, plume = true, crestStyle = 'brush' }) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const w = scale * 0.85, h = scale * 0.62;
    ctx.fillStyle = domeColor;
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.15, w / 2, h / 2, 0, Math.PI, 0, false);
    ctx.fill();
    // cheek guards
    ctx.fillStyle = cheekColor || domeColor;
    ctx.beginPath();
    ctx.ellipse(-w / 2 + w * 0.06, h * 0.05, w * 0.09, h * 0.32, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w / 2 - w * 0.06, h * 0.05, w * 0.09, h * 0.32, -0.15, 0, Math.PI * 2);
    ctx.fill();
    // nose guard
    ctx.fillStyle = domeColor;
    ctx.fillRect(-w * 0.03, -h * 0.1, w * 0.06, h * 0.35);
    if (plume) {
      ctx.fillStyle = crestColor;
      if (crestStyle === 'brush') {
        const bristles = 10;
        for (let i = 0; i < bristles; i++) {
          const t = i / (bristles - 1);
          const bx = (t - 0.5) * w * 0.9;
          ctx.beginPath();
          ctx.moveTo(bx - scale * 0.02, -h * 0.55);
          ctx.quadraticCurveTo(bx + (t - 0.5) * scale * 0.3, -h * 0.95, bx + (t - 0.5) * scale * 0.5, -h * 1.15);
          ctx.quadraticCurveTo(bx + (t - 0.5) * scale * 0.3, -h * 0.95, bx + scale * 0.02, -h * 0.55);
          ctx.fill();
        }
      } else { // 'wings' — small side wings for Hermes
        [-1, 1].forEach((side) => {
          ctx.save();
          ctx.translate(side * w * 0.42, -h * 0.25);
          ctx.rotate(side * 0.5);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(scale * 0.35 * side, -scale * 0.1, scale * 0.55 * side, scale * 0.02);
          ctx.quadraticCurveTo(scale * 0.3 * side, scale * 0.05, 0, scale * 0.12);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
      }
    }
    ctx.restore();
  },
};

/**
 * Deity registry. `headwear` is {type, opts} matched against Draw[type].
 * `particles` names a factory in the global Particles object (see particles.js).
 * `aura` is the glow color drawn as a soft radial behind the whole head.
 */
const DEITIES = [
  {
    id: 'zeus', name: 'Zeus', title: 'King of the Gods', gender: 'god',
    tagline: 'Master of the sky and thunder',
    aura: '#ffd54f',
    headwear: { type: 'leafWreath', opts: { leafColor: '#d4af37', berryColor: '#8a6d1a', leafCount: 16 } },
    particles: () => Particles.lightning('#fff2a8'),
  },
  {
    id: 'poseidon', name: 'Poseidon', title: 'Lord of the Sea', gender: 'god',
    tagline: 'Ruler of oceans and storms',
    aura: '#3ec6c6',
    headwear: { type: 'radialCrown', opts: { color: '#1f6f78', glow: '#4fd6ff', spikeCount: 7, spikeLen: 0.55, spikeWidth: 0.09 } },
    particles: () => Particles.waterDrops('#63e0ff'),
  },
  {
    id: 'hades', name: 'Hades', title: 'God of the Underworld', gender: 'god',
    tagline: 'Keeper of the realm of the dead',
    aura: '#7a4fd6',
    headwear: { type: 'radialCrown', opts: { color: '#2a2438', glow: '#7a4fd6', spikeCount: 8, spikeLen: 0.4, spikeWidth: 0.05 } },
    particles: () => Particles.embers('#8a5cff'),
  },
  {
    id: 'apollo', name: 'Apollo', title: 'God of the Sun & Music', gender: 'god',
    tagline: 'Bringer of light, music and prophecy',
    aura: '#ffb300',
    headwear: { type: 'radialCrown', opts: { color: '#f2b705', glow: '#ffe066', spikeCount: 13, spikeLen: 0.5, spikeWidth: 0.045 } },
    particles: () => Particles.stars('#ffe9a8'),
  },
  {
    id: 'ares', name: 'Ares', title: 'God of War', gender: 'god',
    tagline: 'Fury of the battlefield',
    aura: '#e53935',
    headwear: { type: 'helmet', opts: { domeColor: '#8a1f1f', cheekColor: '#6b1717', crestColor: '#e53935', crestStyle: 'brush' } },
    particles: () => Particles.embers('#ff5252'),
  },
  {
    id: 'hermes', name: 'Hermes', title: 'Messenger of the Gods', gender: 'god',
    tagline: 'Swift-footed traveler between worlds',
    aura: '#b0bec5',
    headwear: { type: 'helmet', opts: { domeColor: '#c9c9c9', cheekColor: '#a8a8a8', crestColor: '#e8e8e8', crestStyle: 'wings' } },
    particles: () => Particles.driftShapes('#e8e8e8', (ctx, s) => {
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(s, 0, 0, s);
      ctx.quadraticCurveTo(-s * 0.4, 0, 0, -s);
      ctx.fill();
    }),
  },
  {
    id: 'hephaestus', name: 'Hephaestus', title: 'God of the Forge', gender: 'god',
    tagline: 'Master smith of Olympus',
    aura: '#ff7a30',
    headwear: { type: 'helmet', opts: { domeColor: '#5a4634', cheekColor: '#463621', crestColor: '#ff7a30', crestStyle: 'brush' } },
    particles: () => Particles.embers('#ffb347'),
  },
  {
    id: 'athena', name: 'Athena', title: 'Goddess of Wisdom', gender: 'goddess',
    tagline: 'Strategist and patron of heroes',
    aura: '#dbb54a',
    headwear: { type: 'helmet', opts: { domeColor: '#d4af37', cheekColor: '#b8952e', crestColor: '#8a1f1f', crestStyle: 'brush' } },
    particles: () => Particles.stars('#f0e0a0'),
  },
  {
    id: 'hera', name: 'Hera', title: 'Queen of the Gods', gender: 'goddess',
    tagline: 'Sovereign of marriage and the heavens',
    aura: '#9b7bd6',
    headwear: { type: 'circlet', opts: { bandColor: '#d4af37', gemColor: '#6a3fc7', fan: true, fanColor: '#5fae7a' } },
    particles: () => Particles.stars('#d8c8ff'),
  },
  {
    id: 'aphrodite', name: 'Aphrodite', title: 'Goddess of Love & Beauty', gender: 'goddess',
    tagline: 'Radiance of beauty and desire',
    aura: '#ff8fb3',
    headwear: { type: 'leafWreath', opts: { leafColor: '#ff8fb3', berryColor: '#ffd1e0', leafCount: 14, berries: true } },
    particles: () => Particles.petals('#ffb3c6'),
  },
  {
    id: 'artemis', name: 'Artemis', title: 'Goddess of the Hunt & Moon', gender: 'goddess',
    tagline: 'Wild huntress beneath the silver moon',
    aura: '#c9d8ff',
    headwear: { type: 'radialCrown', opts: { color: '#8fa3c9', glow: '#dfe9ff', spikeCount: 5, spikeLen: 0.35, spikeWidth: 0.05 } },
    particles: () => Particles.stars('#e6f0ff'),
  },
  {
    id: 'demeter', name: 'Demeter', title: 'Goddess of the Harvest', gender: 'goddess',
    tagline: 'Giver of the earth’s bounty',
    aura: '#c9a227',
    headwear: { type: 'leafWreath', opts: { leafColor: '#d9a441', berryColor: '#f2cf6b', leafCount: 12, berries: true } },
    particles: () => Particles.driftShapes('#e0b84a', (ctx, s) => {
      ctx.fillRect(-s * 0.12, -s, s * 0.24, s * 2);
    }),
  },
  {
    id: 'dionysus', name: 'Dionysus', title: 'God of Wine & Revelry', gender: 'god',
    tagline: 'Spirit of festivity and the vine',
    aura: '#8a3fa0',
    headwear: { type: 'leafWreath', opts: { leafColor: '#5a8f4a', berryColor: '#6a2a8f', leafCount: 14, berries: true } },
    particles: () => Particles.driftShapes('#7a2fa0', (ctx, s) => {
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
      ctx.arc(s * 0.5, s * 0.3, s * 0.5, 0, Math.PI * 2);
      ctx.arc(-s * 0.3, s * 0.5, s * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }),
  },
];
