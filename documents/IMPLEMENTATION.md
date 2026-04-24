# Kal — Implementation Reference

*Your fitness pal that evolves with you.*

A calorie tracking app with a virtual pet companion that grows, evolves, and reflects your health journey. Duolingo-style streaks, friend challenges, and genuine accountability — without the ad-heavy, spreadsheet-feel of existing trackers.

---

## 1. The Concept

**One-liner:** Duolingo for calorie tracking. Log your meals → feed your pet → compete with friends → watch Kal evolve as you hit your goals.

**Why this wins:**
- Tracking apps solve logging. Nobody has solved *motivation*.
- Pet evolution gives visible daily reward on a human timescale (weeks), not a physical one (months).
- Friend pets + challenges provide social accountability no tracker currently has.
- Cute pet screenshots are inherently shareable — built-in virality where "my abs progress" feels vain.

**Positioning:** Not "a better MyFitnessPal." It's a *game that happens to track calories*. The pet is the product.

**Target user:** Active 20–35 year olds who've tried MyFitnessPal / Foodvisor / Cronometer and quit because logging felt like a chore. Fitness-aware but not hardcore macros-obsessed.

---

## 2. Competitive Landscape

| App | Tracking | Friend Challenges | Pet / Avatar | Fun to Open |
|---|---|---|---|---|
| Lose It! | ✅ | ✅ | ❌ | Meh |
| MyFitnessPal | ✅ | ✅ | ❌ | No (ad-heavy) |
| FatSecret | ✅ | ✅ | ❌ | No (dated) |
| FriendFit | ✅ | ✅ | ❌ | Early |
| Foodvisor | ✅ | ❌ | ❌ | Decent |
| Cronometer | ✅ | ❌ | ❌ | Clinical |
| MacroFactor | ✅ | ❌ | ❌ | Data-nerd |
| **Kal** | ✅ | ✅ | ✅ | **The hook** |

**Biggest threats:**
1. Lose It! adds a pet feature after Kal validates the concept
2. Cal AI / Foodvisor raises funding and outspends on marketing
3. Building in silence for 6 months and launching to crickets

**Mitigation:**
- Build the pet moat deep — it's the product, not a feature
- Launch to Currents + Surf Mates communities first (warm audience)
- Ship an MVP fast, get 50 real users in 8 weeks, iterate on behavior

---

## 3. Core Mechanics

### The Pet (Kal)

**Stats (0–100 scale):**
- **Vitality** — streak integrity + % of days hitting protein goal
- **Energy** — % of days in calorie range + training logs
- **Strength** — protein surplus days + training consistency
- **Happiness** — streak + friend interactions

**Evolution stages** (every ~2–3 weeks of consistency):
Egg → Baby → Kid → Teen → Adult → Champion

**Critical design principles:**
- **Forgiving.** One bad day can't tank the pet. Use weekly trends, not daily snapshots.
- **Responsive.** Consistent logging = visible pet change within 5–7 days.
- **Fair.** Users understand why the pet is in a given state.
- **Never body-shaming.** Frame as "energy / vitality / fitness level", not "fat / thin". Evolution is Pokémon-style, not before/after photos.

### Streaks & Gems

**Streak rules:**
- Log at least one meal per day to maintain
- 1 "grace day" per week (miss a day, streak continues)
- Milestone rewards at 7 / 30 / 100 / 365 days

**Gem economy (earn):**
- +5 per meal logged
- +20 per day streak maintained
- +100 per weekly goal hit (protein target, calorie range)
- +50 per friend challenge won

**Gem sinks (spend — critical from day one):**
- Pet cosmetics (outfits, accessories): 200–2,000 gems
- Pet evolution customization: higher ranges
- Friend gift sending: small amounts
- Streak freeze (save a broken streak): higher cost

### Friends & Challenges

- Add friends by username
- Visit each other's pets (Pou-style)
- Weekly challenges: "most consecutive days logging", "hit protein target 5 days this week", "group streak"
- Leaderboards with real-time updates (Convex subscriptions shine here)
- Send gifts / encouragement (costs small gems)

---

## 4. The Nutrition Math (User-Facing)

Default target formulas for onboarding. User can override in settings.

**For active users (lift + cardio + daily activity):**

| Metric | Formula / Guide |
|---|---|
| Calories | Slow recomp: ~30–33 kcal/kg bodyweight |
| Protein | 1.8–2.2 g/kg bodyweight |
| Fats | 0.8–1.0 g/kg bodyweight |
| Carbs | Remainder of calories |

**Example — 82kg active male, slow recomp:**
- Calories: ~2,600
- Protein: 165g (2.0 g/kg)
- Fats: 80g
- Carbs: 240g

**Why not just use BMR formulas?**
- Every tracker uses Mifflin-St Jeor × activity multiplier. These are ±20% accurate for individuals.
- Weekly weight-trend adjustment (see algorithm below) is more accurate than any formula.
- Always default generous on calories / protein — risk of under-eating > over-eating for recomp users.

### Weekly Adjustment Algorithm (MacroFactor-style)

```
Every 7 days, compute:
  weight_trend = average(last 7 days weight)
  previous_trend = average(days 8-14 ago weight)
  actual_change = weight_trend - previous_trend
  
  // User's stated goal: lose 0.4 kg/week for recomp
  expected_change = -0.4
  
  // If losing too fast (>0.5kg) → eat more
  // If not losing (or gaining) when trying to lose → eat less
  // If hitting target ±0.1kg → keep current target
  
  if actual_change < expected_change - 0.15:
    calorie_target += 150  // losing too fast, add food
  elif actual_change > expected_change + 0.15:
    calorie_target -= 150  // not losing, reduce slightly
  // else: stay the course
```

**Never adjust based on one day's weight.** Always trend-based.

### Exercise Calories — DO NOT ADD TO BUDGET

**Biggest lie in every calorie app.** Users "earn" 300 calories from a gym session, app tells them to eat more, they're actually only burning 180, and they plateau.

**Kal's approach:**
- Training is a **pet stat input**, not a calorie credit
- Gym log → pet strength/energy goes up
- Calorie target stays fixed based on goal + baseline activity
- Weekly weight trend auto-adjusts if user is under/over-training

This sidesteps the accuracy problem entirely AND fits the pet narrative ("your training made Kal stronger").

---

## 5. Food Database Strategy

### Primary sources (all free, one-time ETL → Convex)

| Source | What It Gives | Size |
|---|---|---|
| AUSNUT 2023 | 3,741 Australian foods, 58 nutrients each, 9,816 portion measures | ~3.5 MB |
| Australian Branded Food Database | ~15,000 packaged products sold in AU | ~13.5 MB |
| USDA FoodData Central (subset) | ~8,000 common international whole foods | ~7 MB |
| **Total reference data** | | **~25 MB** |

### Live APIs (no download)

- **Open Food Facts** — free barcode lookup, ~3M products globally, patchy quality
- **User-contributed foods** — gem reward for adding missing items (crowdsource growth)

### Restaurant chains — hand-curated

Build a curated list of top 30 Australian chains manually. Weekend project, covers ~80% of "eating out" logs:

**Must-haves:** GYG, Zambrero, Grill'd, Nando's, Mad Mex, Hungry Jack's, McDonald's, KFC, Subway, Domino's, Crust, Sumo Salad, Boost, Oporto, Red Rooster, Schnitz, Roll'd, SumoSushi, San Churro, Guzman Y Gomez (detailed bowls).

For each: name, popular items with manufacturer-published nutrition (legally required to publish in AU).

### Legal / licensing

AUSNUT and AFCD are released by FSANZ under Australian government open data (Creative Commons Attribution). Commercial use allowed with one-line attribution in credits. Always re-verify license on data.gov.au before launch.

### Aussie advantage

Day one competitive edge:
- Vegemite, Tim Tams, Weet-Bix, Milo — accurate data (MFP crowdsourced entries vary 15–30%)
- Murray cod, kangaroo, barramundi, macadamias — proper regional coverage
- AU portion sizes and measures built-in
- **Marketing angle: "the first calorie app that actually knows Aussie food"**

---

## 6. Logging UX — The Make-or-Break

**Industry benchmark:** 73% of tracker quitters cite "too time-consuming" as primary reason. Logging must take <15 seconds per meal or users churn.

### Fast-logging features (all day-one, not "nice to have")

1. **Recent tab** — last 10 foods, one tap to re-log
2. **Copy yesterday** button — huge, people eat similar day-to-day
3. **Meal templates** — "my usual breakfast" saved as reusable entry
4. **Quick-add calories** — for social meals where exact logging impossible
5. **Barcode scan** — camera → Open Food Facts API
6. **Favorites** — starred foods surface first

### AI-assisted logging (v2 / paid tier)

- **Natural language:** "chicken curry with rice, bowl size" → Claude/GPT parses to macros
- **Photo recognition:** camera → AI identifies foods + estimates portions
- API costs ~$0.01–0.03 per photo; viable only with subscription tier
- ±25–40% accuracy on portions — don't oversell

### Accuracy hierarchy (honest ranking)

1. Barcode scan — ±2–5% ✅
2. USDA lookup + weighed portion — ±5–10% ✅
3. Licensed chain restaurant item — ±5–10% ✅
4. USDA lookup + hand-portion estimate — ±15–20% ⚠️
5. AI natural language — ±20–30% ⚠️
6. AI photo recognition — ±25–40% ⚠️
7. Exercise calorie estimates — ±30–50% ❌ (don't trust, don't use)

**Mental reframe:** Users don't need accurate absolute calories. They need consistent-enough tracking for weekly trend adjustments. Make logging fast + imperfect rather than slow + accurate.

---

## 7. Tech Stack

### Primary stack (matches existing side-project experience)

- **Frontend:** React Native (iOS + Android single codebase)
- **Backend / DB:** Convex (realtime, TypeScript-native, perfect for pet state + social)
- **Auth:** Better Auth or Clerk
- **Food data:** Convex tables seeded from AUSNUT + AFCD + USDA + Open Food Facts API
- **Payments:** RevenueCat (handles Apple/Google subscriptions + IAP)
- **Analytics:** PostHog (free tier generous, self-hostable later)
- **Push notifications:** Expo Push (free with Expo)

### Convex free tier math

**Limits:**
- 0.5 GB database storage
- 1M function calls/month
- 1 GB file storage
- 20 GB-hours action compute

**Usage projections:**

| Scale | Storage | Function Calls | Free Tier OK? |
|---|---|---|---|
| 50 beta users | ~6 MB | ~60k/mo | ✅ trivially |
| 500 users | ~60 MB | ~600k/mo | ✅ comfortable |
| 1,500 users | ~180 MB | ~1M/mo | ⚠️ at limit |
| 3,000 users | ~350 MB | ~2M/mo | ❌ upgrade needed |

**Real bottleneck = function calls, not storage.**

### Convex optimization strategies (extend free tier)

1. **Cache food lookups client-side** — React Query / local state, don't re-query per keystroke
2. **Batch queries** — "get pet + today + streak" in one function, not three
3. **Denormalize computed values** — store `today_total_calories` and `current_streak` on user doc, update on write
4. **Rate limit polling** — friend leaderboards refresh on visibility change / pull-to-refresh only
5. **Don't duplicate food data** — meal logs store `food_id` + `quantity`, look up details from shared table

With optimization: free tier comfortably supports ~1,500–2,000 active users. Realistically 6–12 months of growth before upgrade.

**Apply for Convex Startup Program** before public launch — up to 1 year free Professional tier, no seat fees, 30% off usage-based fees up to ~$30k.

### Why Convex over Firebase/Supabase for this app

- Real-time subscriptions native = friend leaderboards "just work"
- No WebSocket management for live pet updates
- Type-safe schema + queries = less friction for solo dev
- Already in the stack mental model from Gate Hunter and Meccanopoli

---

## 8. Data Schema (Convex)

### `foods` table (shared reference, ~25 MB)

```typescript
{
  _id: Id<"foods">,
  source: "ausnut" | "afcd" | "branded_au" | "usda" | "user_contributed",
  source_id: string,              // original ID in source DB
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
    // ...micros if from AUSNUT
  },
  common_portions: Array<{
    name: string,                  // "1 cup", "1 slice", "medium"
    grams: number
  }>,
  searchable_tokens: string[],     // for fast text search
}
```

### `users` table

```typescript
{
  _id: Id<"users">,
  auth_id: string,
  username: string,
  display_name: string,
  created_at: number,
  
  // Goals
  target_weight_kg: number,
  daily_calorie_target: number,
  daily_protein_g: number,
  daily_carbs_g: number,
  daily_fat_g: number,
  
  // Denormalized computed (updated on meal log)
  today_calories: number,
  today_protein_g: number,
  today_date: string,              // YYYY-MM-DD
  current_streak: number,
  longest_streak: number,
  grace_days_remaining: number,
  
  // Economy
  gem_balance: number,
  
  // Pet state
  pet: {
    name: string,
    stage: "egg" | "baby" | "kid" | "teen" | "adult" | "champion",
    vitality: number,              // 0-100
    energy: number,
    strength: number,
    happiness: number,
    last_evolved_at: number,
    cosmetics_owned: string[],
    active_cosmetic?: string,
  },
}
```

### `meal_logs` table

```typescript
{
  _id: Id<"meal_logs">,
  user_id: Id<"users">,
  date: string,                    // YYYY-MM-DD
  meal_type: "breakfast" | "lunch" | "dinner" | "snack",
  logged_at: number,
  food_id: Id<"foods">,
  quantity_g: number,
  // Computed values cached on log
  calories: number,
  protein_g: number,
  carbs_g: number,
  fat_g: number,
}
```

### `weights` table

```typescript
{
  _id: Id<"weights">,
  user_id: Id<"users">,
  date: string,
  weight_kg: number,
  logged_at: number,
}
```

### `friendships` table

```typescript
{
  _id: Id<"friendships">,
  user_a: Id<"users">,
  user_b: Id<"users">,
  status: "pending" | "accepted",
  created_at: number,
}
```

### `challenges` table

```typescript
{
  _id: Id<"challenges">,
  name: string,
  type: "streak" | "protein_target" | "calorie_range" | "custom",
  participants: Id<"users">[],
  start_date: string,
  end_date: string,
  prize_gems: number,
  status: "active" | "completed",
  leaderboard: Array<{
    user_id: Id<"users">,
    score: number,
  }>,
}
```

### Indexes (critical for perf)

- `foods` by `barcode` (unique)
- `foods` by `searchable_tokens` (text search)
- `meal_logs` by `user_id + date`
- `weights` by `user_id + date`
- `users` by `auth_id` and `username`
- `friendships` by `user_a` and `user_b`

---

## 9. Build Roadmap

**Realistic timeline: 6 months to public launch, solo, part-time while at DHI.**

### Phase 1 — Prototype (Weekend 1)
**Goal: prove the pet hook before building anything real.**

- Standalone React Native app
- Hardcoded pet state machine (5 stats, 6 evolution stages)
- Simple animations/illustrations per stage
- Fake inputs (buttons: "logged meal", "hit goal", "missed day")
- Share with 5 people, see if pet feels charming in isolation

**Decision gate:** If the pet isn't emotionally engaging with zero real functionality, the whole product fails. Don't proceed without this.

### Phase 2 — Core MVP (Month 1–2)
- Onboarding flow (goals, pet naming, first meal logged)
- AUSNUT + Branded Food Database ETL into Convex
- Food search + barcode scan + manual entry
- Daily diary view
- Pet state machine driven by real logs
- Streaks with grace days
- Gem earning (no sinks yet)

### Phase 3 — Polish + TestFlight (Month 3)
- Pet evolution visuals + animations polished
- Weekly adjustment algorithm for calorie target
- Custom foods + favorites
- Cosmetic gem sinks
- TestFlight beta with 10–20 Currents / Surf Mates friends
- Weekly iteration based on logged behavior (not opinions)

### Phase 4 — Social Layer (Month 4–5)
- Friend adds by username
- Friend pet visits
- Weekly group challenges
- Real-time leaderboards (Convex subscriptions)
- Push notifications for streak risks, friend challenges

### Phase 5 — Launch Prep (Month 6)
- AI natural language logging (paid tier)
- Subscription + IAP cosmetics via RevenueCat
- Restaurant chain database (30 AU chains curated)
- App Store listing, screenshots, marketing site
- Apply for Convex Startup Program
- Soft launch to Currents + Surf Mates communities
- Submit to App Store / Google Play

### Phase 6 — Post-launch (Month 7+)
- Photo AI recognition (paid tier)
- More chains + international coverage
- Challenge types (team vs team, time-limited events)
- Pet breeding / rare evolutions (monetization lever)
- Integrations (Apple Health, Strava for surfing/training)

---

## 10. Monetization

### Free tier (generous on purpose)

- Unlimited logging
- Full food database access
- Pet + evolution (all stages)
- Basic streaks + gems
- Add up to 5 friends
- Join up to 2 active challenges

### Paid tier ($6.99/mo or $49.99/year — aggressive vs MFP's $19.99/mo)

- AI natural language logging
- AI photo recognition
- Advanced analytics (weekly reports, trend graphs)
- Unlimited friends + challenges
- Exclusive pet cosmetics
- Ad-free (if ads are ever added — better to stay ad-free as positioning)

### IAP (cosmetics)

- Pet outfits, accessories, environments: $0.99–$4.99
- Gem packs: $0.99–$19.99
- Streak freezes: small amounts

**Don't launch with IAP.** Add post-PMF. Subscription first — it's a stickier mental model.

### Pricing philosophy

MyFitnessPal opened a gap with $19.99/mo + ads. Kal fills it at $6.99 ad-free. Positioning: "we're the anti-MFP — fair price, no ads, actually fun."

---

## 11. Growth & Distribution

### Warm launch (first 100 users)

- Currents Gold Coast community (you're already in)
- Surf Mates user base (when that launches / already has users)
- DHI colleagues + gym friends
- Post in /r/fitness, /r/1200isplenty, /r/bodybuilding soft-launch threads

### Content / organic

- "Kal the pet" TikToks — pet evolution timelapses are inherently shareable
- Gold Coast / surf fitness angle — niche community, strong affinity
- Comparison content vs MFP — "I quit MyFitnessPal for this" framing

### Paid (post-PMF only)

- Instagram / TikTok ads of pet evolution footage
- Creator partnerships with fitness micro-influencers
- Don't spend until retention data shows 30+ day retention >40%

### Virality loops

- Friend invite → both get gems
- Pet screenshots auto-watermarked with "kal.app" in cute way
- Streak milestones prompt share ("I'm on a 30 day streak with Kal!")
- Challenge invites to non-users with deep links

---

## 12. The Honest Risks

1. **Pet hook might not land.** Mitigate: prototype weekend 1, test with real humans before building anything.
2. **Logging friction kills retention.** Mitigate: obsess over <15 sec logging from day one, benchmark constantly.
3. **Lose It! / MFP clones the pet mechanic.** Mitigate: build the emotional moat deeper than one feature can replicate; capture Currents / AU market first.
4. **Solo dev burnout at month 3.** Mitigate: ship the prototype fast, let real user engagement fuel motivation, don't build in silence.
5. **Convex costs spike faster than revenue.** Mitigate: aggressive optimization, startup program, upgrade only when forced.
6. **App Store discovery is dead.** Mitigate: don't rely on ASO, community-driven launch through Currents + Surf Mates first.

---

## 13. Decision Log

Keep a running doc of big decisions. Examples to include as built:

- Why Convex over Supabase (real-time + TypeScript)
- Why React Native over native (solo dev, faster iteration)
- Why no exercise calories added to budget (accuracy + pet narrative)
- Why AUSNUT over crowdsourced (Aussie accuracy advantage)
- Why $6.99 not $9.99 (positioning vs MFP)

---

## 14. Next Actions

**This weekend:**
1. Download AUSNUT 2023 Excel files from data.gov.au/fsanz
2. Build the pet prototype (standalone, fake data, 5 stats, 6 stages)
3. Test pet with 5 people. Is it charming?

**If pet lands:**
4. Set up Convex project + React Native repo
5. Write ETL script for AUSNUT → Convex
6. Build food search + first meal log

**If pet doesn't land:**
Rethink before committing months. This is the whole product.

---

*Last updated: April 2026*
*Project: Kal — your fitness pal*
*Owner: Felipe*
