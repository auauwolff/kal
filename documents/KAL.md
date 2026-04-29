# Kal — Source of Truth

*Cronometer's detail + Duolingo's rewards + a virtual pet that grows with your fitness journey.*

This is the single canonical document for the Kal project. It supersedes `archive/KAL_SPECS.md` and `archive/IMPLEMENTATION.md`. Everything — goals, stack, schema, roadmap, open questions — lives here. When a decision changes, update this file.

*Last updated: 2026-04-29 — Owner: Felipe (fewo@dhigroup.com)*

## Current status

- ✅ **Phase 0 — Scaffold** (2026-04-24): Vite + React 19 + MUI + Zustand + TanStack Router + Convex + WorkOS AuthKit + `vite-plugin-pwa` all wired. Installs to phone via `public/manifest.json`.
- ✅ **Phase 2 — App shell** (2026-04-24): sticky AppHeader (Kal icon · title · dark-mode · avatar menu) + 3-tab BottomNav (Diary · Stats · Settings). Diary and Stats rendered with **mock data** in shapes matching §6.
- ✅ **Phase 2 — Profile & targets** (2026-04-25): Settings page houses Body Stats, Weight Goal, and Daily Targets cards. Profile + targets now save directly to Convex `users` through `useUserProfile` / `users.upsertProfile`; the old local `ProfileSync` bridge was removed. Diary energy gauge + macro rings consume the live Convex targets. Light mode is the default; dark-mode toggle lives only in the AppHeader.
- ✅ **Phase 1 — AU food DB backbone** (2026-04-25): `foods` schema now includes `by_source_and_sourceId` for idempotent upserts. `convex/foods.ts` exposes admin-gated batch ingest / clear helpers plus source counts. `scripts/buildFoodsData.ts` now supports the actual local FSANZ files we downloaded: `AFCD Release 3 - Nutrient profiles.xlsx` and `AUSNUT 2023 - Food nutrient profiles.xlsx` (with legacy format fallback still kept in code). `scripts/seedFoods.ts` ingests in 500-row batches via `ConvexHttpClient`. Current loaded counts in Convex: `afcd=1588`, `ausnut=3280`, `branded_au=16`, `chain=10` (`total=4894`). Seed reruns are idempotent. USDA API key is stored only as env for future fallback use; USDA import is not active.
- ✅ **Food search polish** (2026-04-25): `api.foods.searchFoods` now does normalized + scored ranking on top of the Convex search index, so exact / prefix / AU-relevant matches rank first. `AddFoodDialog` now shows source chips (`AFCD`, `AUSNUT`, `Brand`, `Chain`, etc.). Manual sanity checks in-app looked good for AU staples and chain aliases.
- ✅ **Convex diary backbone + portion picker** (2026-04-25): `users`, `meal_logs`, `exercise_logs`, `weights`, `favorites`, and `meal_templates` are now in `convex/schema.ts`; `convex/lib/auth.ts` provides `getAuthUserOrNull`, `requireAuth`, and `ensureAuthUser`; `convex/meal_logs.ts` exposes real by-date, recent, add, relog, move, delete, and copy-day mutations. Diary add / delete / move / recent-food / Copy Yesterday flows now use Convex instead of local mock state while keeping the Phase 2 `+5` gem celebration placeholder. The abandoned freeform quick-add panel was removed; selecting a searched food now opens a simpler portion picker with friendly chips like 1 slice, 2 slices, half pizza, whole pizza, small/regular/large cake slice, plus grams. Exercise add/delete is also wired to Convex.
- ✅ **Gem rule rework + Save-as-meal polish** (2026-04-27): gems are now awarded server-side on the **first entry of the day per category**. Meal categories (Breakfast / Lunch / Dinner / Snack) award **+1 gem** each; Exercise awards **+5 gems**. Subsequent entries in any category award nothing, closing the water-spam farm path called out in §2.2. Daily logging cap = 4 + 5 = **9 gems/day**. Exercise's +5 animates as five staggered +1 bursts (180 ms apart) for a Duolingo-style cascade; meal entries fire the same single-pulse animation as before. Reduced-motion users get a single combined burst. `users.backfillMyGems` migrated to `(distinct meal category-days × 1) + (distinct exercise days × 5)` without shrinking existing balances. Diary UI: section-level **Save as meal** button (`BookmarkAddOutlined`) now lives on the **left** of each meal header (opposite the `+`), disabled when the section is empty. `AddFoodDialog` Foods/Meals tabs switched to the orange primary palette.
- ✅ **Weight tracking** (2026-04-29): `convex/weights.ts` now exposes `latest` / `getRecent` queries and `logForDate` / `remove` mutations (one entry per date — same-day re-logs replace). Saving a new weight in Settings → Body Stats also appends a `weights` row for today via a shared `upsertWeightRow` helper, so the Stats Weight chart populates from the user's onboarding weight without a separate logging step. The Diary date-header row got a compact weight chip (left of the kebab) — plain orange text `82.0 kg`, no icon (an icon read as ambiguous in user testing), tap opens `WeightLogDialog`; tooltip shows last-weighed date + days-since. Stats `WeightTrendCard` got a small `+` quick-log icon next to its header subtitle. Both surfaces open the shared `WeightLogDialog` (date picker + kg field) which prefills with the latest known weight. No gem reward on weigh-ins for now (kept in line with §2.2 anti-farm principle); Sunday-cron weekly adjustment will read this table next.
- ✅ **Stats motivation layer** (2026-04-29): Stats page now leads with a `HeroScoreboardCard` (2×2 grid, ignores range toggle) showing current weight + Δ7d, kg-to-go (or "Reached" / "Recomp" / "Set a goal" → /settings), days on target, and current streak with best-streak caption — copy never goes red, per §2.4. `WeightTrendCard` switched its 7-day SMA overlay to a 0.1-α EWMA (raw weighs faded), added a dashed horizontal target-weight reference line, and a dotted goal-pace diagonal interpolated from first weigh-in to `goal.targetDateISO`; subtitle reads `latest → target · ETA Mon DD '26` (or `holding` / `trend off` / `Goal reached` / maintain band / no-goal fallback) using `projectETA()` (14-day slope extrapolation). `MacroSplitCard` rebuilt as three stacked per-macro bar rows (Protein / Carbs / Fat) each with its own dashed target line and `avg X g · target Y g · ↑/↓ Δ vs prev · on target` caption — finally surfaces macro targets, which the old stacked-area chart didn't. `CalorieIntakeCard` subtitle gains `↑/↓ X vs prev Nd`; `StreakHeatmapCard` subtitle gains `· best Nd`. One Convex query change: `api.stats.getRange` now also returns `longestStreak`, `currentWeightKg`, `goal`, and `prevPeriodAverages` (one extra `meal_logs` `withIndex` read for the prior window) — no schema change, no migration. Also fixed a latent ECharts Calendar crash on empty-data renders (`Cannot read properties of undefined (reading 'toString')`) by always passing an explicit `[start, end]` to the streak heatmap. Helpers: `ewma()` and `projectETA()` in `src/components/stats/statsUtils.ts`.
- ✅ **Phase 5 v1 — Friends & duo streaks** (2026-04-29): pulled the social slice forward (out of phase order — Felipe wanted it now, see §8). Three additive Convex tables — `friendships` (canonical-pair `userA._id < userB._id`, `pending` / `accepted` / `blocked`), `friend_streaks` (one row per pair, `currentDays` / `longestDays` / `lastBothLoggedDate`), and `cheers` (1-gem positive-only nudges, capped 3/friend/day). New `convex/lib/social.ts` exposes `canonicalPair` + `bumpFriendStreaksForLog(ctx, userId)` which runs after every meal/exercise log: marks the user's `users.lastLoggedDate = today` (Brisbane), then for every accepted friendship where the other side also logged today, extends or starts the duo streak. AEST date helpers extracted to `convex/lib/dateAEST.ts` (shared with `streaks.ts`). `convex/users.ts` adds `getPublicProfile(userId)` and `searchByUsername(query)` — both return a strict allowlist (`_id`, `username`, `displayName`, `currentStreak`, `longestStreak`, `gemBalance`, `joinedAt`); body data is never serialised. `convex/lib/rewards.ts` adds `spendGems` (errors on insufficient balance) used by `convex/cheers.ts:sendCheer`. New `convex/friendships.ts` exposes `listFriends` / `listPendingRequests` / `sendRequest` (auto-accepts mutual pending) / `acceptRequest` / `declineRequest` / `removeFriend` / `block` / `unblock`. Frontend: 4-tab BottomNav (Diary · Kal · Stats · Friends), new `/friends` route, six components under `src/components/friends/` — `FriendsPage`, `FriendStreakCard` (twin avatars + flame + cheer), `FriendRow`, `AddFriendDialog` (debounced username search), `PendingRequestsSection`, `PublicProfileSheet` (bottom drawer). Cheers UI is positive-only — Finch model, no shame copy, no penalty notifications. v2 (Friend Quests) and v3 (Leagues) deferred per §8.
- ⏭️ **Next:** copy-from-any-day, barcode fallback via Open Food Facts, weekly-adjustment cron (now that `weights` is populating), and CSV export.

---

## 1. Context & Goal

### Why

Felipe currently uses **Cronometer** for calorie tracking and loves the detail and easy entry, but finds the UI clinical and boring. He wants something **more fun** — rewards, streaks, character — like **Duolingo** and **Foodvisor**, and eventually a **virtual pet called Kal** (short for "Kal your/my fitness pal") that users feed their logs to and dress with earned gems.

### Primary goal (near term)

Build a **calorie tracker PWA** that Felipe can use every day in Australia in place of Cronometer. The bar is personal use first — if Felipe stays on it for 2+ weeks without switching back, the MVP has succeeded.

### Secondary goal (later phases)

Layer on gamification → pet → social so it can be shared with Felipe's Currents (Gold Coast) and Surf Mates communities, and eventually the broader AU market.

### One-liner

> Cronometer's detail + Duolingo's rewards + a virtual pet that reflects your fitness journey. Aussie food first, no ads, under AUD $10/mo if we ever monetise.

### Target user

1. **Phase 1–4:** Felipe only. Personal use, active 30-something in Australia.
2. **Phase 5+:** Active 20–35 year-old Australians who've bounced off MyFitnessPal (ad-heavy, $79.99/yr paywall), Cronometer (dense, clinical), MacroFactor (data-nerd), or Foodvisor (shallow gamification).

---

## 2. Design Principles

Distilled from research across Reddit (r/loseit, r/MacroFactor, r/Cronometer), App Store reviews, and academic studies on health-app gamification. These are load-bearing — every feature should be checkable against them.

1. **Log time <15 seconds per meal.** 73% of tracker quitters cite "too time-consuming." Adherence drops from 5.4 days/week in weeks 1–4 to 1.4 days/week in weeks 5–12 if the log loop is slow. Friction kills everything else.
2. **Reward consistency, not raw frequency.** Gems for hitting protein/calorie targets and for multi-day streaks, not just for tapping "log." Otherwise users game it with water-only entries (documented Foodvisor failure mode).
3. **Forgiving streaks.** Finch-model, not punishing Duolingo-model. Grace days, streak freezes, "compassionate miss" that pauses rather than resets. Streak shame causes churn.
4. **Never body-shaming.** Pet evolution is Pokémon-style (energy / vitality / strength), never before/after photos. One bad day can't tank the pet.
5. **Weekly trend, never daily.** Calorie adjustments and pet evolution both track 7-day rolling averages. Daily noise is meaningless.
6. **Exercise is a pet stat input, not a calorie credit.** Exercise calorie estimates are ±30–50% accurate; adding them to the daily budget causes plateaus. Gym log → pet strength goes up; calorie target stays fixed.
7. **Accuracy hierarchy is honest.** Barcode scan is ±5%; AI photo recognition is ±40%. Surface this in-app so users understand why a weighed portion matters.
8. **Aussie-first food DB.** Tim Tams, Vegemite, Weet-Bix, barramundi, kangaroo, macadamias — accurate out of the box. This is a real moat against MFP's 15–30% variance on AU foods.

---

## 3. Tech Stack (locked)

| Layer | Choice | Why / reference |
|---|---|---|
| Frontend | React 19 + Vite + TypeScript | Matches `petrol-saver`, `surf-mates` |
| UI | MUI v7 (Box + sx; no Grid, no Tailwind for UI) | `meccanopoly/CLAUDE.md` conventions |
| State (UI only) | Zustand | `surf-mates/src/stores/mapStore.ts` pattern |
| Routing | TanStack Router | `cf-app`, `meccanopoly` |
| Backend | Convex (real-time, TS-native) | All our Convex apps; real-time fits pet + future social |
| Auth | WorkOS AuthKit (already wired in `src/main.tsx` via `ConvexProviderWithAuthKit`) | `surf-mates` wiring pattern |
| PWA | `vite-plugin-pwa` (installable, offline shell) | `petrol-saver`, `surf-mates` |
| Charts | ECharts via `echarts-for-react` | `petrol-saver`, `clocker-convex` |
| Barcode | `html5-qrcode` (progressive-enhance to `BarcodeDetector` on Android Chrome 83+) | Research: best PWA-compatible scanner in 2026 |
| Haptics | `web-haptics` (`useWebHaptics().trigger("success" \| "nudge" \| "error" \| "buzz")`) | Cross-browser vibration with iOS Safari fallbacks. Used for gem-earn juice (AppHeader) and any future "rewarding" interactions. |
| AI logging (later) | Anthropic SDK via Convex action, Claude Sonnet 4.6 with prompt caching | See `claude-api` skill |

### Why PWA, not React Native

- Matches Felipe's existing stack and saved preferences; fastest iteration for a solo part-time build.
- Installable to iOS / Android home screen, with camera and barcode working fine.
- No app-store friction for personal use.
- If Phase 7 (monetisation + Apple Health integration) ever lands, that's the trigger for a PWA → RN migration decision. Convex backend stays portable.

### Conventions (from `DEV_REFERENCE.md`)

- Arrow-function components only.
- `interface` not `type`. No `any` — `unknown` or proper types.
- `@/` path alias.
- Data fetching via Convex queries. No `useEffect` for data.
- Zustand actions own browser APIs (geolocation, camera, barcode) directly — no bridging hooks.
- `convex/lib/auth.ts` exports `getAuthUserOrNull` and `requireAuth`. Every query/mutation uses these.
- Browser-safe types live in `convex/shared.ts`; never import server functions into the client.
- **Always read `convex/_generated/ai/guidelines.md` before writing Convex code** (per project `CLAUDE.md`).

---

## 4. Food Database Strategy (AU-first)

| Source | Role | Implementation |
|---|---|---|
| **AUSNUT 2023** (FSANZ) | Core AU reference | ✅ Imported from `AUSNUT 2023 - Food nutrient profiles.xlsx` into Convex `foods` as `source: "ausnut"` (currently 3,280 rows after AFCD name-dedupe). No household measures loaded yet, so current ETL falls back to `defaultServingG=100` and `commonPortions=[]`. |
| **Australian Food Composition Database (AFCD) Release 3** | AU whole-food reference | ✅ Imported from `AFCD Release 3 - Nutrient profiles.xlsx` into Convex `foods` as `source: "afcd"` (currently 1,588 rows). |
| **USDA FoodData Central** | Backup/fallback for international or missing foods | Not imported. API key is stored in local env only as a future fallback option; enable only if AU hit-rate proves insufficient. |
| **Open Food Facts** | Live barcode lookup fallback, 3M products globally | Convex HTTP action, on-demand. Free, unlimited. AU coverage patchy but acceptable as supplement. |
| **Hand-curated AU chains** | GYG, Zambrero, Grill'd, Nando's, Mad Mex, Hungry Jack's, McDonald's, KFC, Subway, Domino's, Crust, Sumo Salad, Boost, Oporto, Red Rooster, Schnitz, Roll'd | Weekend job. Covers ~80% of eating-out logs. AU law requires nutrition disclosure, so data is legally available from each chain. |
| **User-contributed foods** | Crowdsource missing items | Gem reward. Phase 3+. |
| **FatSecret Platform API** | Optional upgrade if OFF hit rate is too low | 5k calls/day free tier. Deferred — measure first. |

**Total reference footprint:** ~25 MB. Sits comfortably inside the Convex free tier (0.5 GB).

### What makes this a moat

MFP and Cronometer both have weak AU coverage. Crowdsourced MFP entries for Tim Tams, Weet-Bix, Vegemite, Milo, barramundi, kangaroo vary 15–30%. Day one, Kal is the most accurate Aussie food tracker on the market.

---

## 5. Nutrition Math

### Defaults for onboarding

Implemented in `src/lib/nutrition.ts`. Mifflin-St Jeor BMR × activity multiplier — accounts for age + sex, which the older "30–33 kcal/kg" heuristic does not.

| Metric | Formula |
|---|---|
| BMR (Mifflin-St Jeor) | `10·kg + 6.25·cm − 5·age + (male ? 5 : −161)` |
| TDEE | `BMR × activity` (sedentary 1.2, light 1.375, moderate 1.55, active 1.725, very_active 1.9) |
| Calorie target | `TDEE + clamped daily delta from goal` (delta = `(targetWeight − currentWeight) × 7700 / daysToGoal`, clamped to ±1%/wk loss / ±0.5%/wk gain of bodyweight, floor 1500 kcal) |
| Protein | `2.2 g/kg` for lose/recomp, `1.8 g/kg` otherwise |
| Fat | `0.9 g/kg` |
| Carbs | Remainder of calories: `(calorieTarget − protein·4 − fat·9) / 4` |

**Example — 185 cm / 82 kg / 34 M / active, lose to 76 kg by 2027-05-01 (~371 days from 2026-04-25):** BMR 1811 → TDEE ≈ 3124 → daily delta −124 kcal (well within the safe-rate clamp) → **target ≈ 3000 kcal · 180 g protein · 74 g fat · 390 g carbs**.

The Settings → Daily Targets card lets the user override every value. Each `OverridableTarget` carries an `isOverride` flag; auto-recompute on body-stat or goal change only touches fields where `isOverride === false`. "Reset to auto" clears all overrides and re-derives.

Always default generous on calories/protein — risk of under-eating for recomp users outweighs over-eating risk.

### Weekly adjustment algorithm (MacroFactor-style)

```
Every 7 days:
  weight_trend    = mean(last 7 days)
  previous_trend  = mean(days 8–14 ago)
  actual_change   = weight_trend - previous_trend
  expected_change = user's goal (e.g. -0.4 kg/week for recomp)

  if actual_change < expected_change - 0.15:  calorie_target += 150   # losing too fast
  elif actual_change > expected_change + 0.15: calorie_target -= 150   # not losing
  # else: hold
```

Never adjust from a single day's weight. Runs as a Convex cron.

### Accuracy hierarchy (surface in-app)

| Method | Accuracy | Verdict |
|---|---|---|
| Barcode scan | ±2–5% | ✅ |
| USDA lookup + weighed portion | ±5–10% | ✅ |
| Licensed chain restaurant item | ±5–10% | ✅ |
| Hand-portion estimate | ±15–20% | ⚠️ |
| AI natural language | ±20–30% | ⚠️ |
| AI photo recognition | ±25–40% | ⚠️ |
| Exercise calorie estimates | ±30–50% | ❌ Not used for budget |

Users don't need absolute accuracy — they need consistent-enough tracking for the weekly trend to do its work. Fast + imperfect beats slow + accurate.

---

## 6. Convex Schema

### `foods` (~25 MB, shared reference)

```typescript
{
  _id: Id<"foods">,
  source: "ausnut" | "afcd" | "branded_au" | "usda" | "chain" | "user_contributed" | "openfoodfacts_cache",
  source_id: string,
  name: string,
  brand?: string,
  barcode?: string,
  serving_size_g: number,
  nutrients_per_100g: {
    calories: number,
    protein_g: number,
    carbs_g: number,
    fat_g: number,
    fiber_g: number,
    sugar_g: number,
    sodium_mg: number,
    // + micros if from AUSNUT
  },
  common_portions: Array<{ name: string, grams: number }>, // "1 cup", "1 slice", "medium"
  searchable_tokens: string[],
}
```

**Indexes:** `by_barcode` (unique), `by_searchable_tokens` (text search).

### `users`

```typescript
{
  _id: Id<"users">,
  auth_id: string,
  username: string,
  display_name: string,
  created_at: number,

  // Goals (user-overridable)
  target_weight_kg: number,
  daily_calorie_target: number,
  daily_protein_g: number,
  daily_carbs_g: number,
  daily_fat_g: number,

  // Denormalized "today" snapshot (updated on meal log)
  today_date: string,        // YYYY-MM-DD — reset on first log of a new day
  today_calories: number,
  today_protein_g: number,
  today_carbs_g: number,
  today_fat_g: number,

  // Streaks (Phase 3+)
  current_streak: number,
  longest_streak: number,
  grace_days_remaining: number,

  // Economy (Phase 3+)
  gem_balance: number,

  // Pet (Phase 4+) — added via migration, see §9
  pet?: {
    name: string,
    stage: "egg" | "baby" | "kid" | "teen" | "adult" | "champion",
    vitality: number,          // 0–100
    energy: number,
    strength: number,
    happiness: number,
    last_evolved_at: number,
    cosmetics_owned: string[],
    active_cosmetic?: string,
  },
}
```

**Indexes:** `by_auth_id`, `by_username`.

### `meal_logs`

```typescript
{
  _id: Id<"meal_logs">,
  user_id: Id<"users">,
  date: string,              // YYYY-MM-DD
  meal_type: "breakfast" | "lunch" | "dinner" | "snack",
  logged_at: number,
  food_id: Id<"foods">,
  quantity_g: number,
  // Cached computed values (snapshot at log time in case the food entry changes later)
  calories: number,
  protein_g: number,
  carbs_g: number,
  fat_g: number,
}
```

**Indexes:** `by_user_date`, `by_user_loggedAt`.

### `weights`

```typescript
{
  _id: Id<"weights">,
  user_id: Id<"users">,
  date: string,
  weight_kg: number,
  logged_at: number,
}
```

**Indexes:** `by_user_date`.

### `exercise_logs` (Phase 2)

```typescript
{
  _id: Id<"exercise_logs">,
  user_id: Id<"users">,
  date: string,                                     // YYYY-MM-DD
  type: "strength" | "cardio" | "sports" | "walk" | "other",
  duration_min: number,
  intensity: "light" | "moderate" | "hard",
  notes?: string,
  logged_at: number,
}
```

**Indexes:** `by_user_date`.

Exercise is logged here but **never added to the calorie budget** (Design Principle §2.6). Feeds pet `strength` / `vitality` in Phase 4 and Stats consistency charts in Phase 2.

### `meal_templates` (Phase 2)

```typescript
{
  _id: Id<"meal_templates">,
  user_id: Id<"users">,
  name: string,                // "My usual breakfast"
  items: Array<{ food_id: Id<"foods">, quantity_g: number }>,
}
```

### `favorites` (Phase 2)

```typescript
{
  _id: Id<"favorites">,
  user_id: Id<"users">,
  food_id: Id<"foods">,
  starred_at: number,
}
```

### `friendships` (Phase 5 v1, shipped 2026-04-29)

Canonical-pair invariant: every row has `userA._id < userB._id` (string compare). One row per pair regardless of who initiated, which dedupes naturally and avoids OCC contention since each row only mutates when one of the two named users acts.

```typescript
{
  _id: Id<"friendships">,
  userA: Id<"users">,
  userB: Id<"users">,
  status: "pending" | "accepted" | "blocked",
  initiatedBy: Id<"users">,        // for pending: who sent it; for blocked: who blocked
  acceptedAt?: number,
  createdAt: number,
}
```

**Indexes:** `by_userA_status`, `by_userB_status`, `by_pair`.

### `friend_streaks` (Phase 5 v1)

One denormalised row per pair, used for the shared "duo" streak. Updated server-side from `convex/lib/social.ts:bumpFriendStreaksForLog` after every meal/exercise log; read-side uses `friendStreakDisplayDays()` to render 0 when neither today nor yesterday match (broken-streak grace day).

```typescript
{
  _id: Id<"friend_streaks">,
  userA: Id<"users">,             // canonical pair, same as friendships
  userB: Id<"users">,
  currentDays: number,
  longestDays: number,
  lastBothLoggedDate?: string,    // YYYY-MM-DD AEST
}
```

**Indexes:** `by_pair`, `by_userA`, `by_userB`.

### `cheers` (Phase 5 v1)

1-gem positive-only nudges, capped at `CHEERS_PER_FRIEND_PER_DAY = 3` per recipient per day. Cheers are not body-data and never expose any food/weight context — they're pure encouragement.

```typescript
{
  _id: Id<"cheers">,
  fromUser: Id<"users">,
  toUser: Id<"users">,
  date: string,                   // YYYY-MM-DD AEST
  createdAt: number,
}
```

**Indexes:** `by_toUser_date`, `by_fromUser_toUser_date`.

### Deferred to Phase 5 v2 / v3

- `quests` + `quest_participants` — weekly random-pair 7-day co-op goals (e.g. "10 logged days combined"). v2.
- `league_periods` + `league_members` — weekly anonymised cohorts of ~20 users, Bronze→Diamond, promote top 5 / demote bottom 3. v3 — highest retention payoff, also highest build cost (cohort cron, tournament logic).
- `challenges { name, type, participants, start_date, end_date, prize_gems, leaderboard }` — bespoke group challenges. Likely subsumed by quests + leagues once those land.

### Migration discipline

All schema changes after Phase 1 use the **widen → migrate → narrow** workflow with `@convex-dev/migrations` (see `convex-migration-helper` skill). Pet fields, gem balance, and streaks all land via migrations, not raw schema edits.

---

## 7. App UX — the make-or-break

The logging loop is the whole game. Everything here is Phase 2 unless marked otherwise. Layout references: `petrol-saver` for the top bar + bottom nav pattern, Cronometer for meal grouping, Foodvisor for Stats-style graphs.

### App chrome

- **Top app bar:** **gem balance chip** on the left (`Diamond` icon + count, sapphire `info.main` when active, dimmed `text.disabled` at 0; wired to `user.gemBalance` — earn rules in §8). Phase 2 placeholder rule (shipped 2026-04-27): the **first entry of the day per category** awards gems server-side; subsequent entries in the same category award nothing. Meal categories (Breakfast / Lunch / Dinner / Snack) → **+1 gem** each; Exercise → **+5 gems**. Cap is 9 gems/day from logging — consistent with §2.2 and resilient to spam. Each gem awarded fires its own pulse: Web Audio level-up jingle, `web-haptics` "buzz" haptic, and a canvas particle burst from screen-center homing into the chip (see `src/components/ParticlesProvider.tsx`). Exercise's +5 plays as five staggered +1 bursts (180 ms apart) for a Duolingo-style cascade; meal entries get a single pulse. Reduced-motion users get a single combined burst. Right side of the bar: dark-mode toggle (the only place it lives — light mode is the default and Settings does not duplicate the toggle) and avatar menu (profile/settings/sign-out). The streak chip moved to the Diary day-header row — streaks count logging days, so they belong with the date. MUI `AppBar` with sticky positioning.
- **Bottom nav:** four tabs — **Diary** · **Kal** · **Stats** · **Friends** (Friends shipped 2026-04-29 with the Phase 5 v1 social slice). Settings lives in the avatar menu, not the BottomNav. **Shop** still planned for Phase 3. MUI `BottomNavigation`, clear active state.
- **PWA shell:** installable, matching status-bar theme color, offline-safe diary page (last-logged data cached via Convex local cache + service worker).

### Diary page (top to bottom)

1. **Day header row** — left to right: **streak chip** (`LocalFireDepartment` + count, dimmed at 0) · **date nav** (`‹ prev` · day label (Today / Yesterday / weekday + date) · `next ›`, future disabled; tap label to jump back to today) · **right cluster** with a **weight chip** (plain orange `82.0 kg` text matching the day-label size; tooltip shows last-weighed date + days-since; tap opens `WeightLogDialog`) and the **day-actions kebab** (`MoreVert` → Copy from yesterday, exports, etc.). Anchoring the streak to the date row makes the calendar relationship obvious — streaks count logged *days*. Weekly weigh-ins ride next to the kebab so the cadence stays present without taking real estate from the energy summary.
2. **Streak chip** — lives in the left slot of #1. Wired to `user.current_streak` in Phase 3; rendered dimmed at 0 in Phase 2 so the affordance is visible from day one. Grace days append later (Phase 3+).
3. **Energy summary** — ECharts radial gauge for consumed vs daily calorie target (colour-graded: green inside ±10%, amber outside, red beyond 20%). Under it, a thin stacked-bar showing protein / carbs / fat vs targets. Compact — must fit above the fold on a phone.
4. **Macro progress rings** — P / C / F / Cal, Duolingo-style. Taps open a breakdown sheet with per-meal contributions.
5. **Meal sections: Breakfast · Lunch · Dinner · Snack** — each a card with summed calories + macro chips, expandable entry list, `+` to add food on the right. The header's **left** edge holds a `BookmarkAddOutlined` "Save as meal" button (opposite the `+`); disabled when the section is empty, active once it has entries — opens the `SaveAsMealDialog` to persist the section as a `meal_templates` row. Tapping `+` opens the Convex-backed food search + portion picker; the `AddFoodDialog` is tabbed (Foods · Meals) with orange primary-palette tabs. The first entry of the day in this section earns +1 gem (single pulse — see App chrome above); later entries earn nothing. Each entry has a vertical kebab (`MoreVert`) menu: **Move to {Breakfast / Lunch / Dinner / Snack}** (the entry's current group is omitted — handy for mistakes like "I logged that as breakfast but it was a snack") and **Delete**. Drag-and-drop was considered and rejected: touch DnD fights vertical scroll, meal cards are far apart, and moving entries is a rare *correction* — discoverability beats raw speed here.
6. **Exercise section** — separate card below meals (see below). Visually distinct so it never gets confused with food logging.
7. **Day actions row** (sticky or bottom of diary) — **Copy Yesterday** · **Templates** · **Recent** · **Custom Food**. Exposes the fast-log features as big, thumb-reachable buttons.

### Exercise logging

Backed by the `exercise_logs` table (see §6). Types: `strength` · `cardio` · `sports` · `walk` · `other`. Per log: type, duration (min), intensity (`light` | `moderate` | `hard`), optional notes.

**Exercise NEVER adds to the calorie budget.** Design Principle §2.6 is load-bearing here — exercise calorie estimates are ±30–50% accurate and breaking this rule causes the plateaus that sink MFP users. What exercise *does*:
- Feeds the pet's `strength` and `vitality` stats in Phase 4.
- Shows up in Stats as a weekly consistency chart (Phase 2).
- Powers Phase 3 missions ("hit 3 strength sessions this week → gems").

### Stats page (Phase 2)

MacroFactor- and Cronometer-inspired trend views built around a "where am I right now" hero + target-aware cards. The 7 / 30 / 90-day toggle drives every card except the hero, which always shows current state. Charts via ECharts.

0. **Hero scoreboard** (always visible, ignores range toggle) — 2×2 grid: current weight + Δ7d (EWMA-based) · kg-to-go to target (or "Set a goal" → /settings, or "Reached" / "Recomp" / "From target") · days on target in range · current streak with flame icon and best-streak caption. Pure typography, no charts — sets emotional tone before scrolling. Never red, per §2.4.
1. **Weight trend** — daily weighs (faded), EWMA trend line (orange), dashed horizontal target-weight reference, dotted goal-pace diagonal interpolated from first weigh-in to the target date. Subtitle reads `latest → target · ETA Mon DD '26` (or `holding` / `trend off` / `Goal reached` / maintain band / no-goal fallback). ETA uses a 14-day EWMA-slope extrapolation. Quick-log `+` button stays.
2. **Calorie intake** — daily bars vs target line (success within ±10%, warning over, info under). Subtitle appends `↑/↓ X vs prev Nd` when prior-period data exists.
3. **Macros vs target** — three stacked per-macro bar rows (Protein / Carbs / Fat) each with its own dashed target line. Caption row below each: `avg X g · target Y g · ↑/↓ Δ vs prev · on target`.
4. **Streak history** — calendar heatmap (GitHub-contribution style), colour-graded 0–3 (miss / logged / target-hit / perfect). Subtitle adds `· best Nd`. Always passes a valid `[start, end]` to the calendar (computed from `rangeDays` if data is empty) to avoid the ECharts `_initRangeOption` crash.
5. **Exercise consistency** — weekly stacked bars by exercise type. Minutes or sessions toggle.
6. **Nutrient coverage** (stretch — wires up once AUSNUT micros are in the `foods` table) — Cronometer-style grid of daily % of RDI for the 20 key micros.

All data via one Convex query (`api.stats.getRange`) which now returns `longestStreak`, `currentWeightKg`, `goal`, `prevPeriodAverages` alongside the per-day, weights and exercise-week series. No `useEffect` polling (§3 conventions).

### Settings page (Phase 2 — shipped 2026-04-25)

Mobile-first, slim. Three cards stacked, no auth-info banner, no in-page dark-mode toggle (lives in the AppHeader), no unit toggle (Australian standard always: kg, cm, kcal).

1. **Body Stats** — height (cm), weight (kg), age, sex, activity level (5 levels: sedentary → very_active). Commits on blur or select change. Saved to Convex through `useUserProfile` / `users.upsertProfile`.
2. **Weight Goal** — Lose / Maintain / Gain / Recomp toggle, target weight (hidden when Maintain), target date (native `<input type="date">`). Helper text shows the implied weekly rate ("−0.11 kg/week — within safe range" or "clamped to a safe rate"). Saved to Convex through `useUserProfile` / `users.upsertProfile`.
3. **Daily Targets** — Calories, Protein, Carbs, Fat. Each is an `OverridableTarget`; auto-recompute on body-stat or goal change only touches non-overridden fields. Edited fields display the would-be auto value as a "Auto: 3000" caption. "Reset to auto" appears when any field is overridden, clears all flags + recomputes.

There is no separate Auto-calc button — `setBodyStats` and `setGoal` already trigger `recalcTargets()` internally. The cards are reusable inside a future onboarding wizard (Phase 2 deliverable not yet shipped).

### Fast-log features (non-negotiable in Phase 2)

1. **Recent tab** — last 10 foods, one-tap re-log.
2. **Copy Yesterday** button — people eat similar day-to-day; dramatic friction reduction.
3. **Copy from any day** — secondary action inside the day header. Pick any previous day from a date picker, bulk-copy all its meal entries into the current day.
4. **Meal templates** — "my usual breakfast" as a saved, re-loggable group.
5. **Friendly portion picker** — ✅ selecting a searched food now offers non-gram portions where possible (e.g. pizza slices / half pizza / whole pizza, bread slices, cake slices, cooked rice cups) plus manual grams.
6. **Barcode scan** — html5-qrcode → match local `foods.barcode` first, fall back to Open Food Facts HTTP action, cache the result into `foods` with `source: "openfoodfacts_cache"`.
7. **Favorites** — starred foods surface first in search.
8. **Fast search** — fuzzy match on `searchable_tokens`. Client-side debounce.

### Deferred to Phase 6

- Natural-language logging ("chicken curry with rice, bowl size") via Claude API. Expect ~$0.01–0.03 per parse; only viable with a subscription tier. ±20–30% accuracy — don't oversell.
- Photo recognition. Punt until NLP proves useful.

---

## 8. Phased Roadmap

Each phase has a concrete **Done when** gate. No phase graduates without it.

### Phase 0 — Scaffold (half-day)

- `pnpm create vite` React + TS.
- Add: `@mui/material @emotion/react @emotion/styled zustand @tanstack/react-router convex vite-plugin-pwa echarts echarts-for-react html5-qrcode`.
- Copy theme + project structure from `petrol-saver` or `surf-mates`.
- Run `npx convex ai-files install` (installs `convex/_generated/ai/guidelines.md` and Convex skills into `.claude/skills/`).
- Convex Auth set up per `clocker-convex` pattern.
- `convex/lib/auth.ts` helpers from the start (`getAuthUserOrNull`, `requireAuth`).
- Deploy shell to Vercel + Convex; install PWA to phone home screen.

**Done when:** authed empty PWA installs cleanly on Felipe's iOS home screen.

### Phase 1 — Food database backbone (weekend)

- `foods` schema + indexes.
- ✅ `foods` schema + indexes shipped, including `by_source_and_sourceId` for idempotent ETL upserts.
- ✅ ETL scripts shipped: `scripts/buildFoodsData.ts` builds `scripts/foodsData.json`; `scripts/seedFoods.ts` batch-upserts to Convex.
- ✅ AU data loaded into Convex from AFCD Release 3 + AUSNUT 2023.
- ⏳ Open Food Facts HTTP action for barcode lookups, with write-through cache into `foods`.
- ⏳ Admin/dev spot-check UI / query for search relevance.
- ❄️ USDA fallback intentionally deferred; keep as backup plan only.

**Done when:** search for `tim tam`, `barramundi`, `weet bix`, `vegemite` returns accurate AU data; barcode scan of a random pantry item resolves (local hit first, OFF fallback second).

### Phase 2 — Calorie tracker MVP (2 weeks)

- **App shell:** top sticky AppHeader (Kal icon · title · dark-mode · avatar menu) + 3-tab BottomNav (Diary · Stats · Settings); PWA `manifest.json` + icon, installable on iOS/Android. See §7 "App chrome".
- **Profile & targets editing** (✅ shipped 2026-04-25): age, sex, height, weight, activity level, goal (lose / maintain / gain / recomp), target weight, target date → auto-calc calorie + macro targets via Mifflin-St Jeor + clamped goal-rate adjustment (§5). User overrides any value; per-field override flag preserved across recalcs. Lives in the Settings page (§7), persisted to localStorage via Zustand `kal-profile`. Drives Diary energy gauge + macro rings.
- **Onboarding wizard:** wraps the same 3 cards in a first-run multi-step flow for users without a profile yet. Not yet shipped — Settings is the entry point until then.
- **Diary page** (full layout in §7): day-nav header, streak chip, ECharts energy gauge, macro rings, 4 meal sections (breakfast / lunch / dinner / snack), exercise section, day-actions row.
- **Add food flow:** search → pick → quantity (g + common portions dropdown) → log.
- **Fast-log:** Recent, Copy Yesterday, Copy-from-any-day, Favorites, Meal Templates, friendly portion picker, and Custom Food for missing items.
- **Barcode scan** via html5-qrcode, local-first then Open Food Facts fallback.
- **Exercise log:** add-entry flow (type + duration + intensity); no calorie credit, ever.
- **Weight tracking:** quick-log page + integration into the Stats Weight card.
- **Stats page** (full layout in §7): weight trend · calorie intake · macro split · streak heatmap · exercise consistency. 7 / 30 / 90-day toggle.
- **Weekly adjustment** running as a Convex cron (Sunday 02:00 AEST).
- **Export** raw data as CSV (personal safety net).

**Done when:** Felipe replaces Cronometer with Kal for 14 consecutive days without switching back out of frustration.

### Phase 3 — Gamification layer (1 week)

- `gemBalance` on users (live since Phase 2 placeholder).
- **Earn rules** (subject to tuning):
  - +1 per **first entry of the day in a meal category** (Breakfast / Lunch / Dinner / Snack); +5 per **first exercise of the day**. Cap 9/day from logging. (Already shipped as the Phase 2 placeholder on 2026-04-27; carry forward into Phase 3.)
  - +20 per day-streak maintained
  - +100 per weekly target hit (protein target 5+ of 7 days, calories in range 5+ of 7 days)
  - +50 per friend challenge won (stubbed until Phase 5)
- **Streak logic:** grace days (1/week free), paid streak freezes, compassionate miss (pause, not reset).
- **Daily / weekly missions:** "Hit protein 5 of 7 days this week."
- **Badges** for milestone streaks (7 / 30 / 100 / 365 days).
- **Sink placeholder** — dummy gem store (actual outfits come in Phase 4).

**Done when:** gems accrue correctly, streaks survive a missed day gracefully, and the app doesn't feel shaming after a bad 3-day stretch.

### Phase 4 — Kal the pet (1–2 weeks)

- Port the existing **KalSvg** prototype from the `Kal start` commit in this repo (eye-tracking, blinking, layered accessory pattern).
- Pet state on `users.pet` via migration.
- **Evolution stages:** Egg → Baby → Kid → Teen → Adult → Champion. Advances on 7-day rolling stat thresholds, not daily. Forgiving — one bad week can't downgrade a stage; needs two consecutive bad weeks.
- **Stats (0–100):**
  - *Vitality* — streak integrity + protein target %
  - *Energy* — % of days in calorie range
  - *Strength* — protein surplus days + (Phase 5) training consistency
  - *Happiness* — streak + (Phase 5) friend interactions
- **Accessory system:** layered SVG, base Kal + absolute-positioned accessory SVGs. Attach points: hat y:0–50, glasses y:65–110, bowtie y:120–140, earrings x:50–60/160–170. Carry forward verbatim from prototype.
- **Outfit store:** 200–2,000 gems, rarity tiers (common / rare / epic / legendary). Some outfits gated on pet level.
- **Gem sinks:** outfits, streak freezes, pet re-customise.

**Done when:** logging visibly affects Kal within 5–7 days; outfits can be bought + equipped; nothing about Kal's appearance frames weight/body negatively.

### Phase 5 — Social

Pulled forward of phase order on 2026-04-29 — Felipe wanted the friend slice now rather than waiting on the 2-month dogfood gate. Sliced into three versions so the cheap-but-powerful piece (friend streaks) ships before the expensive one (leagues).

**v1 — Friends + duo streaks + cheers (✅ shipped 2026-04-29):**
- `friendships` + `friend_streaks` + `cheers` tables (additive — no widen→migrate→narrow needed). See §6.
- Add friends by username. Auto-accept on mutual pending. Block / unblock.
- Public profile sheet: display name, username, current/longest solo streak, gem balance, joined date. Body data **never** exposed (§2.4).
- Shared duo-streak: extends when both users log on the same AEST calendar day (any meal or exercise counts). Read-side derived "alive" check with one-day grace before display falls back to "ready to restart".
- 1-gem cheers, capped 3/friend/day. `convex/lib/rewards.ts:spendGems` is the gem sink; `awardGems` unchanged.
- 4-tab BottomNav (Diary · Kal · Stats · Friends).
- Done-when gate ✅: two accounts can add, accept, both log on the same day → shared streak shows; cheer button decrements gems.

**v2 — Friend Quests (next):**
- Weekly random-pair 7-day co-op goal ("10 logged days combined"). Shared gem reward, no penalty if missed — resets next week. Tables: `quests`, `quest_participants`.

**v3 — Leagues (last, highest cost):**
- Weekly anonymised cohorts of ~20 users, Bronze→Diamond, promote top 5 / demote bottom 3. Cohort-assignment cron, weekly reset. Highest documented retention lever in research, but also the most expensive build — defer until v1 + v2 prove the social loop.

**Cross-version:**
- Pet visits (Pou-style, Phase 4-dependent) — once `users.pet` ships, surface `pet.stage` + active cosmetic on the public profile.
- Web push notifications (PWA) for streak-at-risk and challenge wins. Spammy notifications are the documented #1 churn cause; cap at one daily summary.

**Done when:** Felipe's gym and Currents mates can add each other, hold a duo streak across a week, and a meaningful share of them stay logged in past day 14 because of the social loop (v2/v3 measured separately).

### Phase 6 — AI-assisted logging (optional, paid tier if ever monetised)

- Natural-language parse: "chicken curry with rice, medium bowl" → macros. Claude Sonnet 4.6 via Convex action, with prompt caching on the system prompt + food database context. See `claude-api` skill.
- Photo recognition deferred further — only if NLP proves useful.

**Done when:** NLP parse is accurate enough (±25%) that Felipe actually uses it for dinners out.

### Phase 7 — Monetisation / public launch (only if going public)

- Apply to **Convex Startup Program** before public launch (up to 1 year free Pro + 30% off usage).
- Pricing: $6.99/mo or $49.99/yr — aggressive vs MFP's $19.99/mo. Positioning: "the anti-MFP — fair price, no ads, actually fun."
- **Do NOT launch with IAP.** Subscription first, IAP cosmetics later once PMF is proven.
- Warm-launch via Currents + Surf Mates communities first; no ads until 30-day retention >40%.
- PWA → React Native migration becomes a real consideration here if Apple Health integration matters for users.

---

## 9. Prototype assets to carry forward

From the `Kal start` commit and `archive/KAL_SPECS.md` (these are real learnings, not speculation — carry them verbatim):

### KalSvg component
- `React.forwardRef<SVGSVGElement>` for direct DOM access.
- Named IDs on eye parts: `leftEyePupil`, `rightEyePupil`, `leftEyeWhite`, `rightEyeWhite`, `leftEyeBlack`, `rightEyeBlack`.
- `viewBox="0 0 218 230"`.

### Eye tracking
- Global `mousemove` listener in a Zustand action.
- Cursor position → translate pupil highlight `#leftEyePupil` / `#rightEyePupil`, clamped to a 2px radius.
- CSS transition: `transform 0.1s ease-out`.

### Blinking
- CSS keyframe animation, 4 s interval.
- `scaleY` on eye whites + blacks (NOT pupils, so pupil tracking and blinking never fight for the same transform).
- Frames at 94% / 96% / 98% feel natural.

### Layered accessory pattern
```tsx
<Box sx={{ position: 'relative' }}>
  <KalSvg ref={svgRef} />
  {equipped.hat      && <KalAccessoryHat />}
  {equipped.glasses  && <KalAccessoryGlasses />}
  {equipped.bowtie   && <KalAccessoryBowtie />}
  {equipped.earrings && <KalAccessoryEarrings />}
</Box>
```

Each accessory is a self-contained SVG positioned absolute inside the container, sized to the same 218×230 viewBox. No sprite-sheet pain, no exponential variant explosion, base animations intact.

### Accessory data model
```typescript
interface AccessoryItem {
  id: string;
  name: string;
  category: 'hat' | 'glasses' | 'bowtie' | 'earrings';
  price: number;                      // gems
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockLevel?: number;               // pet level gate, optional
  svgComponent: React.ComponentType;
}
```

### Economy starting numbers (tune in Phase 4)
- Common: 50–200 gems
- Rare: 200–500
- Epic: 500–1,000
- Legendary: 1,000–2,000

---

## 10. Risks (honest)

1. **Logging friction kills retention.** Mitigation: obsess over <15 s per meal from day one; benchmark each log flow with a stopwatch.
2. **Pet feels like a gimmick.** Mitigation: make it evolve visibly within a week of real use; tie every stat to a real behavior; never shame.
3. **Aussie DB accuracy doesn't actually matter to users.** Mitigation: test the "first app that knows Tim Tams" pitch with 5 people in Phase 2; fall back to a Cronometer-parity pitch if it doesn't land.
4. **Solo-dev burnout at month 3.** Mitigation: ship Phase 2 fast, use it personally, let daily-use satisfaction fuel the later phases. Don't build Phases 4–5 in silence.
5. **Convex costs spike.** Mitigation: follow the `convex-performance-audit` playbook — denormalize `today_*` and `current_streak`, batch queries, client-cache food lookups, pull-to-refresh not poll. Apply for the Startup Program before going public.

---

## 11. Open questions / deferred decisions

- **Auth upgrade:** WorkOS AuthKit is already wired — covers Google / email sign-in out of the box, so no swap needed for Phase 5. Revisit only if WorkOS pricing bites at scale.
- **Cronometer import:** does Cronometer export user data? Would be useful for seeding Felipe's history in Phase 2. Research task.
- **Apple Health / Google Fit:** PWA can't read these. If it matters enough to Felipe, that's the trigger for a PWA → RN decision.
- **FatSecret fallback:** only pull in if Open Food Facts barcode miss rate is painful in practice. Measure during Phase 2.
- **Gem earn-rate tuning:** the numbers above are first-guess. Tune once Felipe has 2 weeks of real logging data in Phase 3.
- **Subscription pricing (Phase 7):** $6.99/mo is a placeholder. Revisit after seeing cost/user and competitive movement.

---

## 12. Reference map

- **Stack patterns:** `/home/wolffo/Dev/DEV_REFERENCE.md`
- **Closest PWA templates to copy from:** `/home/wolffo/Dev/petrol-saver`, `/home/wolffo/Dev/surf-mates`
- **Convex Auth pattern:** `/home/wolffo/Dev/clocker-convex`
- **Project CLAUDE.md:** `/home/wolffo/Dev/kal/CLAUDE.md` (instructs agents to read `convex/_generated/ai/guidelines.md` first)
- **Superseded docs (historical):** `archive/KAL_SPECS.md`, `archive/IMPLEMENTATION.md`
- **Convex skills** (after `convex ai-files install`): `convex-quickstart`, `convex-setup-auth`, `convex-migration-helper`, `convex-performance-audit`, `convex-create-component`
- **AI logging skill (Phase 6):** `claude-api`

---

## 13. Next actions (right now)

Phase 0 scaffold and the Phase 2 app-shell UI (Diary + Stats + Settings skeletons, mock data) shipped on 2026-04-24. Profile + targets editing in Settings shipped on 2026-04-25 (Zustand-persisted; pending Convex migration).

1. **Finish the remaining real-data flows.** Diary meal entries, profile/targets, exercise logs, weight quick-log, and Stats now use Convex queries/mutations. Remaining: richer stats queries (e.g. nutrient coverage when AUSNUT micros land) and weight edit/delete UI on the Stats card.
2. **Fast-log completion.** Add copy-from-any-day, Favorites, Meal Templates, a better custom-food flow for missing items, and real exercise add/edit/delete flows.
3. **Barcode fallback.** Implement the Open Food Facts HTTP action and client barcode flow (local `foods.barcode` first, OFF second, cache as `openfoodfacts_cache`). Keep USDA as env-only backup, not active product scope.
4. **Phase 2 fill-in.** Onboarding wizard (wraps the 3 Settings cards into a first-run flow), weekly-adjustment Convex cron (Sunday 02:00 AEST — `weights` table is now populating, so this is unblocked), CSV export.
5. **Dogfood for 14 consecutive days** without switching back to Cronometer — the Phase 2 done-when gate.
6. **Smoke-test Phase 5 v1 with a second account.** Add a friend, both log on the same day, watch the duo streak appear; cheer them and verify gem balance drops by 1 with the 3/day cap. See §13 verification list (mirrored from the plan file).

Pet evolution still comes later. Logging is the whole game until it feels better than Cronometer; the Friends slice is the second hook now that the first one works.
