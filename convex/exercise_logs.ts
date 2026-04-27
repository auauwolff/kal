import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { ensureAuthUser, getAuthUserOrNull, requireAuth } from './lib/auth';
import { awardGems, GEMS_PER_EXERCISE_LOG, isFirstExerciseEntryOfDay } from './lib/rewards';
import { recomputeAndPatchStreak } from './lib/streaks';
import { exerciseIntensityValidator, exerciseTypeValidator } from './validators';

const toClientExerciseLog = (log: Doc<'exercise_logs'>) => ({
  id: log._id,
  userId: log.userId,
  date: log.date,
  type: log.type,
  durationMin: log.durationMin,
  intensity: log.intensity,
  ...(log.notes ? { notes: log.notes } : {}),
  loggedAt: log.loggedAt,
});

export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const user = await getAuthUserOrNull(ctx);
    if (!user) return [];

    const logs = await ctx.db
      .query('exercise_logs')
      .withIndex('by_userId_and_date', (q) =>
        q.eq('userId', user._id).eq('date', date),
      )
      .take(100);

    return [...logs]
      .sort((a, b) => a.loggedAt - b.loggedAt)
      .map(toClientExerciseLog);
  },
});

export const add = mutation({
  args: {
    date: v.string(),
    type: exerciseTypeValidator,
    durationMin: v.number(),
    intensity: exerciseIntensityValidator,
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { date, type, durationMin, intensity, notes }) => {
    if (!Number.isFinite(durationMin) || durationMin <= 0) {
      throw new Error('Duration must be greater than 0 minutes');
    }

    const user = await ensureAuthUser(ctx);
    const isFirst = await isFirstExerciseEntryOfDay(ctx, user._id, date);
    const exerciseLogId = await ctx.db.insert('exercise_logs', {
      userId: user._id,
      date,
      type,
      durationMin,
      intensity,
      ...(notes ? { notes } : {}),
      loggedAt: Date.now(),
    });
    await recomputeAndPatchStreak(ctx, user._id);
    let gemsAwarded = 0;
    if (isFirst) {
      await awardGems(ctx, user._id, GEMS_PER_EXERCISE_LOG);
      gemsAwarded = GEMS_PER_EXERCISE_LOG;
    }
    return { exerciseLogId, gemsAwarded };
  },
});

export const remove = mutation({
  args: { exerciseLogId: v.id('exercise_logs') },
  handler: async (ctx, { exerciseLogId }) => {
    const user = await requireAuth(ctx);
    const log = await ctx.db.get(exerciseLogId);
    if (!log || log.userId !== user._id) throw new Error('Exercise log not found');
    await ctx.db.delete(exerciseLogId);
    await recomputeAndPatchStreak(ctx, user._id);
    return exerciseLogId;
  },
});
