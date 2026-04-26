// Canvas-based emoji particle system, adapted from lochie/web-haptics demo site.
// Single full-screen canvas, real physics, glyph cache, one rAF loop that idles.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  getEmojiCanvas,
  maxParticleDpr,
  resizeCanvas,
  resolveCollisions,
  spawnBurst,
  spawnHomingBurst,
  updateParticle,
  type EmojiOption,
  type Particle,
} from './particlesUtils';

export type { EmojiOption } from './particlesUtils';

interface ParticlesContextValue {
  create: (
    x: number,
    y: number,
    emojis: EmojiOption[],
    duration?: number,
    gx?: number,
    gy?: number,
  ) => void;
  createHoming: (
    originX: number,
    originY: number,
    targetX: number,
    targetY: number,
    emojis: EmojiOption[],
    amount?: number,
  ) => void;
}

const ParticlesContext = createContext<ParticlesContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useParticles = (): ParticlesContextValue => {
  const ctx = useContext(ParticlesContext);
  if (!ctx) throw new Error('useParticles must be used within a ParticlesProvider');
  return ctx;
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

    resizeCanvas(canvas);

    const frame = () => {
      const dpr = maxParticleDpr();
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
        for (const particle of particles) {
          const isFading = particle.opacity < 1;
          if (pass === 0 && isFading) continue;
          if (pass === 1 && !isFading) continue;
          if (pass === 1) c2d.globalAlpha = particle.opacity;

          const emojiImg = getEmojiCanvas(particle.emoji);
          const drawSize = particle.fontSize * particle.s * 1.5;
          const halfSize = drawSize / 2;
          const rad = (particle.a * Math.PI) / 180;
          const cos = Math.cos(rad) * dpr;
          const sin = Math.sin(rad) * dpr;
          const flipX = particle.flipH ? -1 : 1;

          c2d.setTransform(
            cos * flipX,
            sin * flipX,
            -sin,
            cos,
            particle.x * dpr,
            particle.y * dpr,
          );
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
    const visualViewport = window.visualViewport;
    window.addEventListener('resize', onResize);
    visualViewport?.addEventListener('resize', onResize);
    visualViewport?.addEventListener('scroll', onResize);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      window.removeEventListener('resize', onResize);
      visualViewport?.removeEventListener('resize', onResize);
      visualViewport?.removeEventListener('scroll', onResize);
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
      const canvas = canvasRef.current;
      if (canvas) resizeCanvas(canvas);
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
      const canvas = canvasRef.current;
      if (canvas) resizeCanvas(canvas);
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
    <>
      <ParticlesContext.Provider value={{ create, createHoming }}>
        {children}
      </ParticlesContext.Provider>
      {createPortal(
        <canvas
          ref={canvasRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 2147483647,
            display: 'block',
          }}
        />,
        document.body,
      )}
    </>
  );
};
