import type { EmojiOption } from './particlesUtils';

type EmojiEntry = [emoji: string, weight: number, canFlip?: boolean];

const GEM_EMOJI_ENTRIES: EmojiEntry[] = [
  ['💎', 10, true],
  ['✨', 6, true],
  ['🔷', 3, false],
  ['🌟', 2, true],
];

export const GEM_EMOJIS: EmojiOption[] = GEM_EMOJI_ENTRIES.flatMap(
  ([emoji, weight, canFlip]) =>
    Array.from({ length: weight }, () => ({
      emoji,
      canFlip: canFlip ?? false,
    })),
);

export const gemParticleCount = (amount: number): number =>
  Math.min(Math.max(amount * 3, 12), 30);

interface HeaderUser {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

export const userInitials = (user: HeaderUser | null | undefined): string =>
  (
    (user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '') ||
    user?.email?.[0] ||
    '?'
  ).toUpperCase();
