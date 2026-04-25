// Gem-earn sound: 4-note ascending C major arpeggio (Mario-coin vibe).
// Synthesised via Web Audio — no audio asset, no harsh sawtooth harmonics.

let ctx: AudioContext | null = null;

const getCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Win = window as Window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctx = window.AudioContext ?? Win.webkitAudioContext;
    if (!Ctx) return null;
    try {
      ctx = new Ctx();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
};

const playNote = (
  audio: AudioContext,
  freq: number,
  when: number,
  dur = 0.18,
  gainPeak = 0.14,
) => {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.value = 0;
  gain.gain.linearRampToValueAtTime(gainPeak, when + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.001, when + dur);
  osc.connect(gain).connect(audio.destination);
  osc.start(when);
  osc.stop(when + dur);
};

export const playGemSound = () => {
  const audio = getCtx();
  if (!audio) return;
  const t = audio.currentTime;
  // C5 · E5 · G5 · C6 — ascending C major
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => {
    const jitter = 0.99 + Math.random() * 0.02;
    const isLast = i === notes.length - 1;
    playNote(audio, f * jitter, t + i * 0.07, isLast ? 0.22 : 0.16, isLast ? 0.16 : 0.12);
  });
};
