// Canvas-based emoji particle system, adapted from lochie/web-haptics demo site.
// Single full-screen canvas, real physics (gravity, friction, elastic collisions),
// glyphs cached as offscreen canvases, single rAF loop that auto-stops when idle.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';

export interface EmojiOption {
  emoji: string;
  canFlip: boolean;
}

interface ParticlesContextValue {
  create: (
    x: number,
    y: number,
    emojis: EmojiOption[],
    duration?: number,
    gx?: number,
    gy?: number,
  ) => void;
  // Center-pop → gather → fly to a target. Used for the gem-earn animation:
  // lots of gems pop at the origin, freely scatter, then home in on the target
  // (the AppHeader counter), buzzing as they fly.
  createHoming: (
    originX: number,
    originY: number,
    targetX: number,
    targetY: number,
    emojis: EmojiOption[],
    amount?: number,
  ) => void;
}

interface Particle {
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
  homingDelay?: number; // frames before homing force kicks in
}

const ParticlesContext = createContext<ParticlesContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useParticles = (): ParticlesContextValue => {
  const ctx = useContext(ParticlesContext);
  if (!ctx) throw new Error('useParticles must be used within a ParticlesProvider');
  return ctx;
};

const MAX_ACTIVE = 500;
const ANIM_FRAMES = 120;
const MAX_DPR = 2;

const emojiCache = new Map<string, HTMLCanvasElement>();

const getEmojiCanvas = (emoji: string): HTMLCanvasElement => {
  const cached = emojiCache.get(emoji);
  if (cached) return cached;

  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
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

const HOMING_FORCE = 0.9;
const HOMING_MAX_SPEED = 26;
const HOMING_BUZZ_JITTER = 1.6;

const updateParticle = (p: Particle): boolean => {
  p.a += p.xv * 0.5;
  p.yv *= 0.9;
  p.y += p.yv;
  p.xv *= 0.98;
  p.x += p.xv;
  p.s += (1 - p.s) * 0.3;
  p.xv += p.gx * 0.1;
  p.yv += (p.gy + p.yv) * 0.1;

  // Homing: after the free-pop phase, accelerate toward target with a small
  // jitter so the flight feels "buzzy" rather than rail-straight.
  if (p.targetX !== undefined && p.targetY !== undefined) {
    const elapsed = p.maxLife - p.life;
    if (elapsed >= (p.homingDelay ?? 0)) {
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > 18 * 18) {
        const dist = Math.sqrt(distSq);
        p.xv += (dx / dist) * HOMING_FORCE;
        p.yv += (dy / dist) * HOMING_FORCE;
        const speed = Math.sqrt(p.xv * p.xv + p.yv * p.yv);
        if (speed > HOMING_MAX_SPEED) {
          p.xv = (p.xv / speed) * HOMING_MAX_SPEED;
          p.yv = (p.yv / speed) * HOMING_MAX_SPEED;
        }
        p.x += (Math.random() - 0.5) * HOMING_BUZZ_JITTER;
        p.y += (Math.random() - 0.5) * HOMING_BUZZ_JITTER;
      } else {
        // Reached the target — fade out fast and let it absorb into the chip.
        p.opacity *= 0.7;
        if (p.opacity < 0.05) p.life = 0;
      }
    }
  }

  p.radius = p.fontSize * p.s * 0.5;

  p.life--;
  const lifeRatio = p.life / p.maxLife;
  if (lifeRatio < 0.25) p.opacity = Math.min(p.opacity, lifeRatio / 0.25);

  return p.life > 0 && p.opacity > 0.01;
};

const resolveCollisions = (particles: Particle[]) => {
  const n = particles.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
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

const resizeCanvas = (canvas: HTMLCanvasElement) => {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
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

const spawnBurst = (
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

const spawnHomingBurst = (
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
    // Outward velocity in a random direction so they "pop" before homing
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 7;
    const xv = Math.cos(angle) * speed;
    const yv = Math.sin(angle) * speed;

    const pick = emojis[Math.floor(Math.random() * emojis.length)];

    particles.push({
      x: originX + (Math.random() - 0.5) * 30,
      y: originY + (Math.random() - 0.5) * 30,
      xv,
      yv,
      a: Math.random() * 360,
      s: 0.2,
      opacity: 1,
      life: ANIM_FRAMES,
      maxLife: ANIM_FRAMES,
      emoji: pick?.emoji ?? '✨',
      flipH: pick?.canFlip ? Math.random() < 0.5 : false,
      fontSize: 28 + Math.ceil(Math.random() * 30),
      radius: 0,
      // No gravity — homing force takes over after the pop phase
      gx: 0,
      gy: 0,
      targetX,
      targetY,
      homingDelay: 22 + Math.floor(Math.random() * 14), // ~0.4s of free pop
    });
  }
};

export const ParticlesProvider = ({ children }: { children: ReactNode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const startLoop = useCallback(() => {
    if (rafIdRef.current !== null) return;

    const canvas = canvasRef.current;
    const c2d = ctxRef.current;
    if (!canvas || !c2d) return;

    const frame = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        if (!updateParticle(particles[i])) {
          particles[i] = particles[particles.length - 1];
          particles.pop();
        }
      }

      if (particles.length === 0) {
        c2d.setTransform(1, 0, 0, 1, 0, 0);
        c2d.clearRect(0, 0, canvas.width, canvas.height);
        rafIdRef.current = null;
        return;
      }

      resolveCollisions(particles);

      c2d.setTransform(1, 0, 0, 1, 0, 0);
      c2d.clearRect(0, 0, canvas.width, canvas.height);

      c2d.globalAlpha = 1;
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const isFading = p.opacity < 1;
          if (pass === 0 && isFading) continue;
          if (pass === 1 && !isFading) continue;
          if (pass === 1) c2d.globalAlpha = p.opacity;

          const emojiImg = getEmojiCanvas(p.emoji);
          const drawSize = p.fontSize * p.s * 1.5;
          const halfSize = drawSize / 2;

          const rad = (p.a * Math.PI) / 180;
          const cos = Math.cos(rad) * dpr;
          const sin = Math.sin(rad) * dpr;
          const fx = p.flipH ? -1 : 1;
          c2d.setTransform(cos * fx, sin * fx, -sin, cos, p.x * dpr, p.y * dpr);

          c2d.drawImage(emojiImg, -halfSize, -halfSize, drawSize, drawSize);
        }
      }

      rafIdRef.current = requestAnimationFrame(frame);
    };

    rafIdRef.current = requestAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctxRef.current = canvas.getContext('2d');
    resizeCanvas(canvas);

    const onResize = () => resizeCanvas(canvas);
    window.addEventListener('resize', onResize);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const create = useCallback(
    (
      x: number,
      y: number,
      emojis: EmojiOption[],
      duration?: number,
      gx = 0,
      gy = -1.5,
    ) => {
      const particles = particlesRef.current;
      spawnBurst(particles, x, y, emojis, gx, gy);
      startLoop();

      if (duration && duration > 0) {
        const interval = 150;
        const count = Math.floor(duration / interval);
        for (let i = 1; i <= count; i++) {
          window.setTimeout(() => {
            spawnBurst(particles, x, y, emojis, gx, gy);
            startLoop();
          }, i * interval);
        }
      }
    },
    [startLoop],
  );

  const createHoming = useCallback(
    (
      originX: number,
      originY: number,
      targetX: number,
      targetY: number,
      emojis: EmojiOption[],
      amount = 16,
    ) => {
      spawnHomingBurst(
        particlesRef.current,
        originX,
        originY,
        targetX,
        targetY,
        emojis,
        amount,
      );
      startLoop();
    },
    [startLoop],
  );

  return (
    <ParticlesContext.Provider value={{ create, createHoming }}>
      {children}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          display: 'block',
        }}
      />
    </ParticlesContext.Provider>
  );
};
