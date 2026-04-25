# Kal — Source of Truth

*Cronometer's detail + Duolingo's rewards + a virtual pet that grows with your fitness journey.*

This is the single canonical document for the Kal project. It supersedes `archive/KAL_SPECS.md` and `archive/IMPLEMENTATION.md`. Everything — goals, stack, schema, roadmap, open questions — lives here. When a decision changes, update this file.

*Last updated: 2026-04-25 — Owner: Felipe (fewo@dhigroup.com)*

## Current status

- ✅ **Phase 0 — Scaffold** (2026-04-24): Vite + React 19 + MUI + Zustand + TanStack Router + Convex + WorkOS AuthKit + `vite-plugin-pwa` all wired. Installs to phone via `public/manifest.json`.
- ✅ **Phase 2 — App shell** (2026-04-24): sticky AppHeader (Kal icon · title · dark-mode · avatar menu) + 3-tab BottomNav (Diary · Stats · Settings). Diary and Stats rendered with **mock data** in shapes matching §6.
- ✅ **Phase 2 — Profile & targets** (2026-04-25): Settings page houses Body Stats, Weight Goal, and Daily Targets cards. Profile + targets persisted via Zustand `persist` (`kal-profile` in localStorage) with field names mirroring §6 so the future Convex `users` migration is mechanical. Diary energy gauge + macro rings consume the live targets via `selectDailyTargets`. Light mode is the default; dark-mode toggle lives only in the AppHeader.
- ✅ **Phase 1 — AU food DB backbone** (2026-04-25): `foods` schema now includes `by_source_and_sourceId` for idempotent upserts. `convex/foods.ts` exposes admin-gated batch ingest / clear helpers plus source counts. `scripts/buildFoodsData.ts` now supports the actual local FSANZ files we downloaded: `AFCD Release 3 - Nutrient profiles.xlsx` and `AUSNUT 2023 - Food nutrient profiles.xlsx` (with legacy format fallback still kept in code). `scripts/seedFoods.ts` ingests in 500-row batches via `ConvexHttpClient`. Current loaded counts in Convex: `afcd=1588`, `ausnut=3280`, `branded_au=16`, `chain=10` (`total=4894`). Seed reruns are idempotent. USDA API key is stored only as env for future fallback use; USDA import is not active.
- ⏭️ **Next:** Convex schema + real queries — widen `convex/schema.ts` to cover `users` extensions, `meal_logs`, `exercise_logs`, `weights`, `favorites`, `meal_templates` via `@convex-dev/migrations`; the future `users.upsertProfile` mutation will accept exactly the persisted `kal-profile` shape. Then replace `src/lib/mockDiary.ts` + `src/lib/mockStats.ts` with Convex queries, and wire the real add-food flow against the now-seeded `foods` table.

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

### Deferred to Phase 5

- `friendships { user_a, user_b, status: "pending" | "accepted", created_at }`
- `challenges { name, type, participants, start_date, end_date, prize_gems, leaderboard }`

Noted here so we design current schemas with future compat in mind (no blocker fields, no ownership assumptions).

### Migration discipline

All schema changes after Phase 1 use the **widen → migrate → narrow** workflow with `@convex-dev/migrations` (see `convex-migration-helper` skill). Pet fields, gem balance, and streaks all land via migrations, not raw schema edits.

---

## 7. App UX — the make-or-break

The logging loop is the whole game. Everything here is Phase 2 unless marked otherwise. Layout references: `petrol-saver` for the top bar + bottom nav pattern, Cronometer for meal grouping, Foodvisor for Stats-style graphs.

### App chrome

- **Top app bar:** **gem balance chip** on the left (`Diamond` icon + count, sapphire `info.main` when active, dimmed `text.disabled` at 0; wired to `user.gem_balance` in Phase 3 — earn rules in §8). Phase 2 placeholder: every new log entry awards `+5` gems and triggers the celebration (Web Audio level-up jingle, `web-haptics` "buzz" haptic, full-screen canvas particle burst from screen-center → homing into the chip; see `src/components/ParticlesProvider.tsx`). The +5/log earn conflicts with §3.2 — keep until Phase 3 earn rules replace it. Right side of the bar: dark-mode toggle (the only place it lives — light mode is the default and Settings does not duplicate the toggle) and avatar menu (profile/settings/sign-out). The streak chip moved to the Diary day-header row — streaks count logging days, so they belong with the date. MUI `AppBar` with sticky positioning.
- **Bottom nav (Phase 2):** three tabs — **Diary** · **Stats** · **Settings**. Add **Shop** in Phase 3, **Kal** in Phase 4. MUI `BottomNavigation`, clear active state.
- **PWA shell:** installable, matching status-bar theme color, offline-safe diary page (last-logged data cached via Convex local cache + service worker).

### Diary page (top to bottom)

1. **Day header row** — three slots, left to right: **streak chip** (`LocalFireDepartment` + count, dimmed at 0) · **date nav** (`‹ prev` · day label (Today / Yesterday / weekday + date) · `next ›`, future disabled; tap label to jump back to today) · **day-actions kebab** (`MoreVert` → Copy from yesterday, exports, etc.). Anchoring the streak to the date row makes the calendar relationship obvious — streaks count logged *days*.
2. **Streak chip** — lives in the left slot of #1. Wired to `user.current_streak` in Phase 3; rendered dimmed at 0 in Phase 2 so the affordance is visible from day one. Grace days append later (Phase 3+).
3. **Energy summary** — ECharts radial gauge for consumed vs daily calorie target (colour-graded: green inside ±10%, amber outside, red beyond 20%). Under it, a thin stacked-bar showing protein / carbs / fat vs targets. Compact — must fit above the fold on a phone.
4. **Macro progress rings** — P / C / F / Cal, Duolingo-style. Taps open a breakdown sheet with per-meal contributions.
5. **Meal sections: Breakfast · Lunch · Dinner · Snack** — each a card with summed calories + macro chips, expandable entry list, `+` to add food. **Phase 2 stub**: tapping `+` adds a random `PLACEHOLDER_FOODS` entry (`src/lib/mockDiary.ts`) and earns `+5` gems with the full celebration — replaced by the real food-search flow when it lands. Each entry has a vertical kebab (`MoreVert`) menu: **Move to {Breakfast / Lunch / Dinner / Snack}** (the entry's current group is omitted — handy for mistakes like "I logged that as breakfast but it was a snack"), **Edit quantity** (Phase 2), and **Delete**. Drag-and-drop was considered and rejected: touch DnD fights vertical scroll, meal cards are far apart, and moving entries is a rare *correction* — discoverability beats raw speed here.
6. **Exercise section** — separate card below meals (see below). Visually distinct so it never gets confused with food logging.
7. **Day actions row** (sticky or bottom of diary) — **Copy Yesterday** · **Quick-Add** · **Templates** · **Recent**. Exposes the fast-log features as big, thumb-reachable buttons.

### Exercise logging

Backed by the `exercise_logs` table (see §6). Types: `strength` · `cardio` · `sports` · `walk` · `other`. Per log: type, duration (min), intensity (`light` | `moderate` | `hard`), optional notes.

**Exercise NEVER adds to the calorie budget.** Design Principle §2.6 is load-bearing here — exercise calorie estimates are ±30–50% accurate and breaking this rule causes the plateaus that sink MFP users. What exercise *does*:
- Feeds the pet's `strength` and `vitality` stats in Phase 4.
- Shows up in Stats as a weekly consistency chart (Phase 2).
- Powers Phase 3 missions ("hit 3 strength sessions this week → gems").

### Stats page (Phase 2)

Foodvisor- and Cronometer-inspired trend views. Each card supports a 7 / 30 / 90-day toggle; charts via ECharts.

1. **Weight trend** — line chart + 7-day rolling trend overlay. Shows latest weight + delta vs 7 days ago + delta vs 30 days ago. Quick-log button on the card.
2. **Calorie intake** — daily bars with the target as a reference line. Shows week-over-week average. Highlights days outside ±15% of target.
3. **Macro split** — stacked area chart (P/C/F per day), with 7-day averages vs targets.
4. **Streak history** — calendar heatmap (GitHub-contribution style), colour-graded by whether the daily calorie target was hit.
5. **Exercise consistency** — weekly stacked bars by exercise type. Minutes or sessions toggle.
6. **Nutrient coverage** (stretch — wires up once AUSNUT micros are in the `foods` table) — Cronometer-style grid of daily % of RDI for the 20 key micros.

All data via Convex queries — no `useEffect` polling (§3 conventions).

### Settings page (Phase 2 — shipped 2026-04-25)

Mobile-first, slim. Three cards stacked, no auth-info banner, no in-page dark-mode toggle (lives in the AppHeader), no unit toggle (Australian standard always: kg, cm, kcal).

1. **Body Stats** — height (cm), weight (kg), age, sex, activity level (5 levels: sedentary → very_active). Commits on blur or select change. Stored on `useUserStore.bodyStats`.
2. **Weight Goal** — Lose / Maintain / Gain / Recomp toggle, target weight (hidden when Maintain), target date (native `<input type="date">`). Helper text shows the implied weekly rate ("−0.11 kg/week — within safe range" or "clamped to a safe rate"). Stored on `useUserStore.goal`.
3. **Daily Targets** — Calories, Protein, Carbs, Fat. Each is an `OverridableTarget`; auto-recompute on body-stat or goal change only touches non-overridden fields. Edited fields display the would-be auto value as a "Auto: 3000" caption. "Reset to auto" appears when any field is overridden, clears all flags + recomputes.

There is no separate Auto-calc button — `setBodyStats` and `setGoal` already trigger `recalcTargets()` internally. The cards are reusable inside a future onboarding wizard (Phase 2 deliverable not yet shipped).

### Fast-log features (non-negotiable in Phase 2)

1. **Recent tab** — last 10 foods, one-tap re-log.
2. **Copy Yesterday** button — people eat similar day-to-day; dramatic friction reduction.
3. **Copy from any day** — secondary action inside the day header. Pick any previous day from a date picker, bulk-copy all its meal entries into the current day.
4. **Meal templates** — "my usual breakfast" as a saved, re-loggable group.
5. **Quick-Add calories** — escape hatch for social meals where exact logging is impossible.
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
- **Fast-log:** Recent, Copy Yesterday, Copy-from-any-day, Favorites, Meal Templates, Quick-Add.
- **Barcode scan** via html5-qrcode, local-first then Open Food Facts fallback.
- **Exercise log:** add-entry flow (type + duration + intensity); no calorie credit, ever.
- **Weight tracking:** quick-log page + integration into the Stats Weight card.
- **Stats page** (full layout in §7): weight trend · calorie intake · macro split · streak heatmap · exercise consistency. 7 / 30 / 90-day toggle.
- **Weekly adjustment** running as a Convex cron (Sunday 02:00 AEST).
- **Export** raw data as CSV (personal safety net).

**Done when:** Felipe replaces Cronometer with Kal for 14 consecutive days without switching back out of frustration.

### Phase 3 — Gamification layer (1 week)

- `gem_balance` on users.
- **Earn rules** (subject to tuning):
  - +5 per meal logged
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

### Phase 5 — Social (only if Felipe still wants it after 2 months solo)

- `friendships` + `challenges` tables via migration.
- Add friends by username.
- Pet visits (Pou-style).
- Group weekly challenges with real-time leaderboards via Convex subscriptions.
- Web push notifications (PWA) for streak risks and challenge wins.

**Done when:** Felipe's gym and Currents mates can add each other, join a group "most-consecutive-logging-days" challenge, and the leaderboard updates live.

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

1. **Wire the Convex schema** for `users` extensions, `meal_logs`, `exercise_logs`, `weights`, `favorites`, `meal_templates`. Use `@convex-dev/migrations` (widen → migrate → narrow) per the `convex-migration-helper` skill. Include a `users.upsertProfile` mutation that accepts the persisted `kal-profile` shape (1:1 with §6 field names) and a hydration step that drains localStorage on first authenticated load.
2. **Replace mock data with Convex queries.** Swap `src/lib/mockDiary.ts` → `api.meal_logs.getByDate` + `api.exercise_logs.getByDate`; swap `src/lib/mockStats.ts` → weight/calorie/macro/streak/exercise queries. Swap `useUserStore` → `api.users.get` so targets propagate from Convex too. UI already matches §6 shapes, so this is mostly a rename.
3. **Finish Phase 1 integration.** The AU food DB is already loaded into Convex; now wire the real add-food flow to `api.foods.searchFoods`, add an admin spot-check view/query, and verify search ranking for AU staples + chains.
4. **Add barcode fallback.** Implement the Open Food Facts HTTP action and client barcode flow (local `foods.barcode` first, OFF second, cache as `openfoodfacts_cache`). Keep USDA as env-only backup, not active product scope.
5. **Phase 2 fill-in.** Onboarding wizard (wraps the 3 Settings cards into a first-run flow), weight quick-log + `weights` table, weekly-adjustment Convex cron, CSV export.
6. **Dogfood for 14 consecutive days** without switching back to Cronometer — the Phase 2 done-when gate.

Pet and social come later. Logging is the whole game until it feels better than Cronometer.
