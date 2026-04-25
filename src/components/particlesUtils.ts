export interface EmojiOption {
  emoji: string;
  canFlip: boolean;
}

export interface Particle {
  x: number;
  y: number;
  xv: number;
  yv: number;
  a: number;
  s: number;
  opacity: number;
  life: number;
  maxLife: number;
  emoji: string;
  flipH: boolean;
  fontSize: number;
  radius: number;
  gx: number;
  gy: number;
  targetX?: number;
  targetY?: number;
  homingDelay?: number;
}

const MAX_ACTIVE = 500;
const ANIM_FRAMES = 120;
const MAX_DPR = 2;
const HOMING_FORCE = 0.9;
const HOMING_MAX_SPEED = 26;
const HOMING_BUZZ_JITTER = 1.6;
const emojiCache = new Map<string, HTMLCanvasElement>();

export const maxParticleDpr = (): number =>
  Math.min(window.devicePixelRatio || 1, MAX_DPR);

export const getEmojiCanvas = (emoji: string): HTMLCanvasElement => {
  const cached = emojiCache.get(emoji);
  if (cached) return cached;

  const dpr = maxParticleDpr();
  const fontSize = Math.ceil(64 * dpr);
  const size = Math.ceil(fontSize * 1.5);

  const offscreen = document.createElement('canvas');
  offscreen.width = size;
  offscreen.height = size;

  const c2d = offscreen.getContext('2d');
  if (!c2d) return offscreen;
  c2d.textAlign = 'center';
  c2d.textBaseline = 'middle';
  c2d.font = `${fontSize}px serif`;
  c2d.fillText(emoji, size / 2, size / 2);

  emojiCache.set(emoji, offscreen);
  return offscreen;
};

export const updateParticle = (particle: Particle): boolean => {
  particle.a += particle.xv * 0.5;
  particle.yv *= 0.9;
  particle.y += particle.yv;
  particle.xv *= 0.98;
  particle.x += particle.xv;
  particle.s += (1 - particle.s) * 0.3;
  particle.xv += particle.gx * 0.1;
  particle.yv += (particle.gy + particle.yv) * 0.1;

  if (particle.targetX !== undefined && particle.targetY !== undefined) {
    const elapsed = particle.maxLife - particle.life;
    if (elapsed >= (particle.homingDelay ?? 0)) {
      const dx = particle.targetX - particle.x;
      const dy = particle.targetY - particle.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > 18 * 18) {
        const dist = Math.sqrt(distSq);
        particle.xv += (dx / dist) * HOMING_FORCE;
        particle.yv += (dy / dist) * HOMING_FORCE;
        const speed = Math.sqrt(particle.xv * particle.xv + particle.yv * particle.yv);
        if (speed > HOMING_MAX_SPEED) {
          particle.xv = (particle.xv / speed) * HOMING_MAX_SPEED;
          particle.yv = (particle.yv / speed) * HOMING_MAX_SPEED;
        }
        particle.x += (Math.random() - 0.5) * HOMING_BUZZ_JITTER;
        particle.y += (Math.random() - 0.5) * HOMING_BUZZ_JITTER;
      } else {
        particle.opacity *= 0.7;
        if (particle.opacity < 0.05) particle.life = 0;
      }
    }
  }

  particle.radius = particle.fontSize * particle.s * 0.5;
  particle.life--;
  const lifeRatio = particle.life / particle.maxLife;
  if (lifeRatio < 0.25) {
    particle.opacity = Math.min(particle.opacity, lifeRatio / 0.25);
  }

  return particle.life > 0 && particle.opacity > 0.01;
};

export const resolveCollisions = (particles: Particle[]) => {
  const count = particles.length;
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const a = particles[i];
      const b = particles[j];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distSq = dx * dx + dy * dy;
      const minDist = a.radius + b.radius;

      if (distSq < minDist * minDist && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const ny = dy / dist;

        const overlap = minDist - dist;
        const sep = overlap * 0.5;
        a.x -= nx * sep;
        a.y -= ny * sep;
        b.x += nx * sep;
        b.y += ny * sep;

        const dvx = a.xv - b.xv;
        const dvy = a.yv - b.yv;
        const dvDotN = dvx * nx + dvy * ny;

        if (dvDotN > 0) {
          const restitution = 0.5;
          const impulse = dvDotN * restitution;
          a.xv -= impulse * nx;
          a.yv -= impulse * ny;
          b.xv += impulse * nx;
          b.yv += impulse * ny;
        }
      }
    }
  }
};

export const resizeCanvas = (canvas: HTMLCanvasElement) => {
  const dpr = maxParticleDpr();
  const width = window.innerWidth;
  const height = window.innerHeight;
  const targetW = Math.round(width * dpr);
  const targetH = Math.round(height * dpr);

  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }
};

export const spawnBurst = (
  particles: Particle[],
  x: number,
  y: number,
  emojis: EmojiOption[],
  gx: number,
  gy: number,
) => {
  const amount = 4;
  if (particles.length + amount > MAX_ACTIVE) return;

  for (let i = 0; i < amount; i++) {
    const xv = Math.random() * 16 - 8;
    const yv =
      (i === 0 ? 4 : i === 1 ? 8 : i === 2 ? 8 : 0) *
      (0.25 + Math.random() * 0.25);
    const pick = emojis[Math.floor(Math.random() * emojis.length)];

    particles.push({
      x,
      y,
      xv,
      yv,
      a: 0,
      s: 0.2,
      opacity: 1,
      life: ANIM_FRAMES,
      maxLife: ANIM_FRAMES,
      emoji: pick?.emoji ?? '✨',
      flipH: pick?.canFlip ? Math.random() < 0.5 : false,
      fontSize: 20 + Math.ceil(Math.random() * 40),
      radius: 0,
      gx,
      gy,
    });
  }
};

export const spawnHomingBurst = (
  particles: Particle[],
  originX: number,
  originY: number,
  targetX: number,
  targetY: number,
  emojis: EmojiOption[],
  amount: number,
) => {
  const cap = Math.min(amount, MAX_ACTIVE - particles.length);
  if (cap <= 0) return;

  for (let i = 0; i < cap; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 7;
    const pick = emojis[Math.floor(Math.random() * emojis.length)];

    particles.push({
      x: originX + (Math.random() - 0.5) * 30,
      y: originY + (Math.random() - 0.5) * 30,
      xv: Math.cos(angle) * speed,
      yv: Math.sin(angle) * speed,
      a: Math.random() * 360,
      s: 0.2,
      opacity: 1,
      life: ANIM_FRAMES,
      maxLife: ANIM_FRAMES,
      emoji: pick?.emoji ?? '✨',
      flipH: pick?.canFlip ? Math.random() < 0.5 : false,
      fontSize: 28 + Math.ceil(Math.random() * 30),
      radius: 0,
      gx: 0,
      gy: 0,
      targetX,
      targetY,
      homingDelay: 22 + Math.floor(Math.random() * 14),
    });
  }
};
