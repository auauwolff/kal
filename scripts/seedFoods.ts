#!/usr/bin/env tsx
/**
 * Upsert AUSNUT/AFCD foods into the Convex `foods` table in batches.
 *
 * Usage:
 *   CONVEX_URL=https://xxxxx.convex.cloud \
 *   FOODS_ADMIN_SECRET=xxx \
 *   pnpm tsx scripts/seedFoods.ts [--clear]
 *
 * --clear  first deletes all existing ausnut/afcd rows (chains and
 *          branded_au are preserved), then ingests.
 *
 * The script is idempotent — safe to rerun. Updates are detected via the
 * (source, sourceId) compound index.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_PATH = resolve(ROOT, 'scripts/foodsData.json');
const BATCH_SIZE = 500;
const POLL_INTERVAL_MS = 1000;

const url = process.env.CONVEX_URL ?? process.env.VITE_CONVEX_URL;
const secret = process.env.FOODS_ADMIN_SECRET;
if (!url) {
  console.error(
    'Set CONVEX_URL (or VITE_CONVEX_URL from .env.local) before running.',
  );
  process.exit(1);
}
if (!secret) {
  console.error(
    'Set FOODS_ADMIN_SECRET to match the value set via `npx convex env set FOODS_ADMIN_SECRET ...`.',
  );
  process.exit(1);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const main = async () => {
  const wantClear = process.argv.includes('--clear');
  const client = new ConvexHttpClient(url);

  if (wantClear) {
    console.log('Scheduling clear of ausnut/afcd rows…');
    await client.mutation(api.foods.adminClearSourceData, { secret });
    let lastTotal = -1;
    while (true) {
      const { bySource } = await client.query(api.foods.countBySource, {
        secret,
      });
      const remaining = (bySource.ausnut ?? 0) + (bySource.afcd ?? 0);
      if (remaining === 0) {
        console.log('Clear complete.');
        break;
      }
      if (remaining !== lastTotal) {
        console.log(`  …${remaining} ausnut/afcd rows remaining`);
        lastTotal = remaining;
      }
      await sleep(POLL_INTERVAL_MS);
    }
  }

  console.log(`Reading ${DATA_PATH}…`);
  const raw = readFileSync(DATA_PATH, 'utf-8');
  const items = JSON.parse(raw) as Array<unknown>;
  console.log(`  → ${items.length} records`);

  const t0 = Date.now();
  let totalInserted = 0;
  let totalUpdated = 0;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const result = await client.mutation(api.foods.adminIngest, {
      secret,
      // Cast: server validates the shape; preprocessor produces the schema
      items: batch as never,
    });
    totalInserted += result.inserted;
    totalUpdated += result.updated;
    const end = Math.min(i + BATCH_SIZE, items.length);
    console.log(
      `[${end}/${items.length}] inserted=${result.inserted} updated=${result.updated}`,
    );
  }
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `Done in ${elapsed}s — inserted=${totalInserted} updated=${totalUpdated}`,
  );

  const { total, bySource } = await client.query(api.foods.countBySource, {
    secret,
  });
  console.log(`foods table now: total=${total}`, bySource);
};

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
