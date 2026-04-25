# `data/` — raw FSANZ nutrition datasets

This directory holds the source files for the AUSNUT + AFCD ETL.
Files are **gitignored** (FSANZ asks not to redistribute), so each
operator must download them once.

## Files the ETL expects

Drop these into this directory, renamed to the names below. The
preprocessor (`scripts/buildFoodsData.ts`) auto-detects `.csv` vs
`.xlsx` extensions, so either is fine.

| Filename | What | Source |
| --- | --- | --- |
| `afcd-release-2.xlsx` | AFCD Release 2 (~1,600 whole foods, gold-standard nutrient data) | foodstandards.gov.au → Science & data → Australian Food Composition Database → Release 2 download |
| `ausnut-food-details.csv` | AUSNUT 2011-13 "Food Details file" (food code → name) | foodstandards.gov.au → AUSNUT 2011-13 → AHS Food Details file |
| `ausnut-food-nutrient.csv` | AUSNUT 2011-13 "AHS Food Nutrient Database" (wide format: one row per food, one column per nutrient) | same page → AHS Food Nutrient Database |
| `ausnut-food-measure.csv` | AUSNUT 2011-13 "AHS Food Measures Database" | same page → AHS Food Measures Database |

If FSANZ ships a slightly different column layout in a newer release,
the preprocessor is resilient: it matches column headers by
case-insensitive substring (e.g. any header containing "energy" + "with
dietary" maps to kJ). If it can't find a required column it bails with
an error naming what's missing.

## Build + ingest

```sh
# 1. Preprocess raw files into a single normalized JSON
pnpm tsx scripts/buildFoodsData.ts
# → scripts/foodsData.json (~3-5 MB, also gitignored)

# 2. Set the admin secret (Convex side + local script side)
npx convex env set FOODS_ADMIN_SECRET $(openssl rand -hex 16)
# Mirror the same value in .env.local as FOODS_ADMIN_SECRET=…
# Also set CONVEX_URL (or rely on VITE_CONVEX_URL from convex dev)

# 3. Reseed chains/branded items (drops legacy ausnut staples)
npx convex run foods:seed '{"force": true}'

# 4. Run the ETL
pnpm tsx scripts/seedFoods.ts
# Or `pnpm tsx scripts/seedFoods.ts --clear` to wipe ausnut/afcd first
```

## Data licensing

AUSNUT 2011-13 and AFCD are © Food Standards Australia New Zealand,
released under CC-BY 3.0 AU. We use the data internally; we don't
redistribute the raw files. See foodstandards.gov.au for citation
requirements.
