// Gem-earn sound: level-up jingle — quick ascending arpeggio (C5→E6) that
// resolves into a held C major triad. Synthesised via Web Audio, all sine
// waves so it stays bright without harsh harmonics.

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
  dur: number,
  gainPeak: number,
  attack = 0.006,
) => {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.value = 0;
  gain.gain.linearRampToValueAtTime(gainPeak, when + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, when + dur);
  osc.connect(gain).connect(audio.destination);
  osc.start(when);
  osc.stop(when + dur);
};

export const playGemSound = () => {
  const audio = getCtx();
  if (!audio) return;
  const t = audio.currentTime;

  // Ascending run: C5 → E5 → G5 → C6 → E6 (60ms between hits)
  const run = [523.25, 659.25, 783.99, 1046.5, 1318.51];
  run.forEach((f, i) => {
    const jitter = 0.995 + Math.random() * 0.01;
    playNote(audio, f * jitter, t + i * 0.06, 0.14, 0.1);
  });

  // Held C major triad at the resolution — slight swell-in for triumph
  const chordStart = t + 0.3;
  const chordDur = 0.85;
  [1046.5, 1318.51, 1567.98].forEach((f) => {
    const jitter = 0.995 + Math.random() * 0.01;
    playNote(audio, f * jitter, chordStart, chordDur, 0.07, 0.04);
  });
};
