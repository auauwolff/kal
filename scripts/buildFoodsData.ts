#!/usr/bin/env tsx
/**
 * Build `scripts/foodsData.json` from raw FSANZ datasets.
 *
 * Supported inputs in `data/` (gitignored):
 *
 * Legacy path:
 *   - data/afcd-release-2.xlsx           (or .xls)
 *   - data/ausnut-food-details.csv       (or .xlsx/.xls)
 *   - data/ausnut-food-nutrient.csv      (wide format)
 *   - data/ausnut-food-measure.csv
 *
 * Newer FSANZ path:
 *   - data/AFCD Release 3 - Nutrient profiles.xlsx
 *   - data/AUSNUT 2023 - Food nutrient profiles.xlsx
 *
 * Output:
 *   - scripts/foodsData.json
 *
 * Usage: pnpm tsx scripts/buildFoodsData.ts
 */
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(ROOT, 'data');
const OUT = resolve(ROOT, 'scripts/foodsData.json');

type Row = Record<string, unknown>;

type IngestRecord = {
  source: 'ausnut' | 'afcd';
  sourceId: string;
  name: string;
  defaultServingG: number;
  nutrientsPer100g: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG?: number;
    sugarG?: number;
    sodiumMg?: number;
  };
  commonPortions: { label: string; grams: number }[];
};

const KJ_PER_KCAL = 4.184;

const round = (n: number, decimals: number) => {
  const k = 10 ** decimals;
  return Math.round(n * k) / k;
};

const toNum = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const n = Number(v.replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const toStr = (v: unknown): string => {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v).trim();
  return '';
};

const readSheet = (
  filepath: string,
  sheetName?: string,
  headerRow = 1,
): Row[] => {
  if (!existsSync(filepath)) {
    throw new Error(`Missing input file: ${filepath}`);
  }
  const wb = XLSX.readFile(filepath, { cellDates: false, raw: true });
  const name = sheetName ?? wb.SheetNames[0];
  if (!name) throw new Error(`No sheets in ${filepath}`);
  const sheet = wb.Sheets[name];
  if (!sheet) throw new Error(`Sheet "${name}" not found in ${filepath}`);
  return XLSX.utils.sheet_to_json<Row>(sheet, {
    defval: null,
    raw: true,
    range: headerRow - 1,
  });
};

const findFirstExisting = (...candidates: string[]): string | null => {
  for (const c of candidates) {
    const p = resolve(DATA, c);
    if (existsSync(p)) return p;
  }
  return null;
};

// Find the first column header that contains *all* the given substrings
// (case-insensitive). Returns null if no column matches.
const findCol = (sample: Row, ...required: string[]): string | null => {
  const keys = Object.keys(sample);
  const reqs = required.map((s) => s.toLowerCase());
  return (
    keys.find((k) => {
      const lower = k.toLowerCase();
      return reqs.every((r) => lower.includes(r));
    }) ?? null
  );
};

const requireCols = (
  label: string,
  cols: Record<string, string | null>,
): Record<string, string> => {
  const missing = Object.entries(cols)
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`${label}: missing required columns: ${missing.join(', ')}`);
  }
  return cols as Record<string, string>;
};

// Pick a defaultServingG from a list of measures: prefer the smallest portion
// ≥ 50 g (looks like a "real meal" unit); else the largest ≤ 250 g; else 100.
const pickDefaultServing = (
  portions: { label: string; grams: number }[],
): number => {
  if (portions.length === 0) return 100;
  const sorted = [...portions].sort((a, b) => a.grams - b.grams);
  const realistic = sorted.find((p) => p.grams >= 50);
  if (realistic) return realistic.grams;
  const small = sorted.filter((p) => p.grams <= 250);
  if (small.length > 0) return small[small.length - 1].grams;
  return sorted[0].grams;
};

const toRecord = (
  source: 'afcd' | 'ausnut',
  sourceId: string,
  name: string,
  energyKj: number | null,
  protein: number | null,
  fat: number | null,
  carbs: number | null,
  fiber: number | null,
  sugar: number | null,
  sodium: number | null,
  defaultServingG = 100,
  commonPortions: { label: string; grams: number }[] = [],
): IngestRecord => ({
  source,
  sourceId,
  name,
  defaultServingG,
  nutrientsPer100g: {
    calories: energyKj == null ? 0 : Math.round(energyKj / KJ_PER_KCAL),
    proteinG: protein == null ? 0 : round(protein, 1),
    carbsG: carbs == null ? 0 : round(carbs, 1),
    fatG: fat == null ? 0 : round(fat, 1),
    ...(fiber != null ? { fiberG: round(fiber, 1) } : {}),
    ...(sugar != null ? { sugarG: round(sugar, 1) } : {}),
    ...(sodium != null ? { sodiumMg: Math.round(sodium) } : {}),
  },
  commonPortions,
});

// ─── AFCD ────────────────────────────────────────────────────────────
const buildAfcdRecordsLegacy = (path: string): IngestRecord[] => {
  const rows = readSheet(path);
  if (rows.length === 0) {
    console.warn(`AFCD legacy: 0 rows from ${path}`);
    return [];
  }
  const sample = rows[0];
  const cols = requireCols('AFCD legacy', {
    id:
      findCol(sample, 'public food key') ??
      findCol(sample, 'food id') ??
      findCol(sample, 'food key') ??
      findCol(sample, 'food code'),
    name: findCol(sample, 'food name') ?? findCol(sample, 'name'),
    energy:
      findCol(sample, 'energy', 'with dietary') ??
      findCol(sample, 'energy', 'kj'),
    protein: findCol(sample, 'protein'),
    fat: findCol(sample, 'total fat'),
    carbs:
      findCol(sample, 'available carbohydrate') ??
      findCol(sample, 'carbohydrate', 'with sugar alcohols') ??
      findCol(sample, 'carbohydrate'),
  });
  const colFibre =
    findCol(sample, 'total dietary fibre') ?? findCol(sample, 'dietary fibre');
  const colSugar = findCol(sample, 'total sugars') ?? findCol(sample, 'sugars');
  const colSodium = findCol(sample, 'sodium');

  console.log(
    `AFCD legacy columns: id=${cols.id} | name=${cols.name} | energy=${cols.energy} | protein=${cols.protein} | fat=${cols.fat} | carbs=${cols.carbs} | fibre=${colFibre} | sugar=${colSugar} | sodium=${colSodium}`,
  );

  const out: IngestRecord[] = [];
  for (const row of rows) {
    const id = toStr(row[cols.id]);
    const name = toStr(row[cols.name]);
    if (!id || !name) continue;

    const energyKj = toNum(row[cols.energy]);
    const protein = toNum(row[cols.protein]);
    if (energyKj == null && protein == null) continue;

    out.push(
      toRecord(
        'afcd',
        id,
        name,
        energyKj,
        protein,
        toNum(row[cols.fat]),
        toNum(row[cols.carbs]),
        colFibre ? toNum(row[colFibre]) : null,
        colSugar ? toNum(row[colSugar]) : null,
        colSodium ? toNum(row[colSodium]) : null,
      ),
    );
  }
  return out;
};

const buildAfcdRecordsRelease3 = (path: string): IngestRecord[] => {
  const rows = readSheet(path, 'All solids & liquids per 100 g', 3);
  if (rows.length === 0) {
    console.warn(`AFCD Release 3: 0 rows from ${path}`);
    return [];
  }
  const sample = rows[0];
  const cols = requireCols('AFCD Release 3', {
    id: findCol(sample, 'public food key'),
    name: findCol(sample, 'food name'),
    energy: findCol(sample, 'energy', 'with dietary'),
    protein: findCol(sample, 'protein'),
    fat: findCol(sample, 'fat', 'total'),
    carbs:
      findCol(sample, 'available carbohydrate', 'with sugar alcohols') ??
      findCol(sample, 'available carbohydrate', 'without sugar alcohols'),
  });
  const colFibre =
    findCol(sample, 'total dietary fibre') ?? findCol(sample, 'dietary fibre');
  const colSugar = findCol(sample, 'total sugars');
  const colSodium =
    findCol(sample, 'sodium', '(na)') ?? findCol(sample, 'sodium');

  console.log(
    `AFCD Release 3 columns: id=${cols.id} | name=${cols.name} | energy=${cols.energy} | protein=${cols.protein} | fat=${cols.fat} | carbs=${cols.carbs} | fibre=${colFibre} | sugar=${colSugar} | sodium=${colSodium}`,
  );

  const out: IngestRecord[] = [];
  for (const row of rows) {
    const id = toStr(row[cols.id]);
    const name = toStr(row[cols.name]);
    if (!id || !name) continue;

    const energyKj = toNum(row[cols.energy]);
    const protein = toNum(row[cols.protein]);
    if (energyKj == null && protein == null) continue;

    out.push(
      toRecord(
        'afcd',
        id,
        name,
        energyKj,
        protein,
        toNum(row[cols.fat]),
        toNum(row[cols.carbs]),
        colFibre ? toNum(row[colFibre]) : null,
        colSugar ? toNum(row[colSugar]) : null,
        colSodium ? toNum(row[colSodium]) : null,
      ),
    );
  }
  return out;
};

const buildAfcdRecords = (): IngestRecord[] => {
  const release3Path = findFirstExisting('AFCD Release 3 - Nutrient profiles.xlsx');
  if (release3Path) {
    console.log(`Using AFCD Release 3 workbook: ${release3Path}`);
    return buildAfcdRecordsRelease3(release3Path);
  }

  const legacyPath = findFirstExisting('afcd-release-2.xlsx', 'afcd-release-2.xls');
  if (legacyPath) {
    console.log(`Using legacy AFCD workbook: ${legacyPath}`);
    return buildAfcdRecordsLegacy(legacyPath);
  }

  throw new Error(
    'AFCD: expected either AFCD Release 3 - Nutrient profiles.xlsx or afcd-release-2.xlsx in data/',
  );
};

// ─── AUSNUT ──────────────────────────────────────────────────────────
const buildAusnutRecordsLegacy = (
  excludedNames: Set<string>,
): { records: IngestRecord[]; droppedDupes: number } => {
  const detailsPath = findFirstExisting(
    'ausnut-food-details.csv',
    'ausnut-food-details.xlsx',
    'ausnut-food-details.xls',
  );
  const nutrientPath = findFirstExisting(
    'ausnut-food-nutrient.csv',
    'ausnut-food-nutrient.xlsx',
    'ausnut-food-nutrient.xls',
  );
  const measurePath = findFirstExisting(
    'ausnut-food-measure.csv',
    'ausnut-food-measure.xlsx',
    'ausnut-food-measure.xls',
  );

  if (!detailsPath || !nutrientPath || !measurePath) {
    throw new Error('AUSNUT legacy: expected details, nutrient, and measure files');
  }

  const detailsRows = readSheet(detailsPath);
  const nutrientRows = readSheet(nutrientPath);
  const measureRows = readSheet(measurePath);

  const ds = detailsRows[0];
  const ns = nutrientRows[0];
  const ms = measureRows[0];
  if (!ds || !ns || !ms) {
    throw new Error('AUSNUT legacy: one or more input files is empty');
  }

  const detailCols = requireCols('AUSNUT legacy details', {
    code: findCol(ds, 'food code') ?? findCol(ds, 'food id') ?? findCol(ds, 'code'),
    name: findCol(ds, 'food name') ?? findCol(ds, 'survey food name'),
  });

  const nutrientCols = requireCols('AUSNUT legacy nutrient', {
    code: findCol(ns, 'food code') ?? findCol(ns, 'food id') ?? findCol(ns, 'code'),
    energy:
      findCol(ns, 'energy', 'with dietary') ??
      findCol(ns, 'energy', 'kj'),
    protein: findCol(ns, 'protein'),
    fat: findCol(ns, 'total fat'),
    carbs:
      findCol(ns, 'available carbohydrate') ?? findCol(ns, 'carbohydrate'),
  });
  const colNutFibre =
    findCol(ns, 'total dietary fibre') ?? findCol(ns, 'dietary fibre');
  const colNutSugar = findCol(ns, 'total sugars') ?? findCol(ns, 'sugars');
  const colNutSodium = findCol(ns, 'sodium');

  const measureCols = requireCols('AUSNUT legacy measures', {
    code: findCol(ms, 'food code') ?? findCol(ms, 'food id') ?? findCol(ms, 'code'),
    label:
      findCol(ms, 'measure description') ??
      findCol(ms, 'measure name') ??
      findCol(ms, 'description'),
    grams:
      findCol(ms, 'measure amount') ??
      findCol(ms, 'measure', 'gram') ??
      findCol(ms, 'gram') ??
      findCol(ms, 'amount'),
  });

  console.log(
    `AUSNUT legacy details columns: code=${detailCols.code} name=${detailCols.name}`,
  );
  console.log(
    `AUSNUT legacy nutrient columns: code=${nutrientCols.code} energy=${nutrientCols.energy} protein=${nutrientCols.protein} fat=${nutrientCols.fat} carbs=${nutrientCols.carbs} fibre=${colNutFibre} sugar=${colNutSugar} sodium=${colNutSodium}`,
  );
  console.log(
    `AUSNUT legacy measure columns: code=${measureCols.code} label=${measureCols.label} grams=${measureCols.grams}`,
  );

  const nutrientByCode = new Map<string, Row>();
  for (const r of nutrientRows) {
    const code = toStr(r[nutrientCols.code]);
    if (code) nutrientByCode.set(code, r);
  }

  const measuresByCode = new Map<string, { label: string; grams: number }[]>();
  for (const r of measureRows) {
    const code = toStr(r[measureCols.code]);
    const label = toStr(r[measureCols.label]);
    const grams = toNum(r[measureCols.grams]);
    if (!code || !label || grams == null || grams <= 0) continue;
    const arr = measuresByCode.get(code) ?? [];
    arr.push({ label, grams: round(grams, 1) });
    measuresByCode.set(code, arr);
  }

  const records: IngestRecord[] = [];
  let droppedDupes = 0;
  for (const r of detailsRows) {
    const code = toStr(r[detailCols.code]);
    const name = toStr(r[detailCols.name]);
    if (!code || !name) continue;
    if (excludedNames.has(name.toLowerCase().trim())) {
      droppedDupes++;
      continue;
    }

    const nut = nutrientByCode.get(code);
    if (!nut) continue;

    const energyKj = toNum(nut[nutrientCols.energy]);
    const protein = toNum(nut[nutrientCols.protein]);
    if (energyKj == null && protein == null) continue;

    const allMeasures = measuresByCode.get(code) ?? [];
    const sortedMeasures = [...allMeasures].sort((a, b) => a.grams - b.grams);
    const commonPortions = sortedMeasures.slice(0, 5);
    const defaultServingG = pickDefaultServing(sortedMeasures);

    records.push(
      toRecord(
        'ausnut',
        code,
        name,
        energyKj,
        protein,
        toNum(nut[nutrientCols.fat]),
        toNum(nut[nutrientCols.carbs]),
        colNutFibre ? toNum(nut[colNutFibre]) : null,
        colNutSugar ? toNum(nut[colNutSugar]) : null,
        colNutSodium ? toNum(nut[colNutSodium]) : null,
        defaultServingG,
        commonPortions,
      ),
    );
  }

  return { records, droppedDupes };
};

const buildAusnutRecords2023 = (
  excludedNames: Set<string>,
): { records: IngestRecord[]; droppedDupes: number } => {
  const path = findFirstExisting('AUSNUT 2023 - Food nutrient profiles.xlsx');
  if (!path) {
    throw new Error('AUSNUT 2023: missing Food nutrient profiles workbook');
  }

  const rows = readSheet(path, 'Food nutrient profiles', 3);
  if (rows.length === 0) {
    console.warn(`AUSNUT 2023: 0 rows from ${path}`);
    return { records: [], droppedDupes: 0 };
  }

  const sample = rows[0];
  const cols = requireCols('AUSNUT 2023', {
    id: findCol(sample, 'public food key') ?? findCol(sample, 'survey id'),
    name: findCol(sample, 'food name'),
    energy: findCol(sample, 'energy', 'with dietary'),
    protein: findCol(sample, 'protein'),
    fat: findCol(sample, 'total fat'),
    carbs:
      findCol(sample, 'available carbohydrate', 'with sugar alcohols') ??
      findCol(sample, 'available carbohydrate', 'without sugar alcohols') ??
      findCol(sample, 'carbohydrate'),
  });
  const colFibre =
    findCol(sample, 'dietary fibre', '(g)') ??
    findCol(sample, 'total dietary fibre') ??
    findCol(sample, 'dietary fibre');
  const colSugar = findCol(sample, 'total sugars') ?? findCol(sample, 'sugars');
  const colSodium =
    findCol(sample, 'sodium', '(na)') ?? findCol(sample, 'sodium');

  console.log(
    `AUSNUT 2023 columns: id=${cols.id} | name=${cols.name} | energy=${cols.energy} | protein=${cols.protein} | fat=${cols.fat} | carbs=${cols.carbs} | fibre=${colFibre} | sugar=${colSugar} | sodium=${colSodium}`,
  );

  const records: IngestRecord[] = [];
  let droppedDupes = 0;
  for (const row of rows) {
    const id = toStr(row[cols.id]);
    const name = toStr(row[cols.name]);
    if (!id || !name) continue;
    if (excludedNames.has(name.toLowerCase().trim())) {
      droppedDupes++;
      continue;
    }

    const energyKj = toNum(row[cols.energy]);
    const protein = toNum(row[cols.protein]);
    if (energyKj == null && protein == null) continue;

    records.push(
      toRecord(
        'ausnut',
        id,
        name,
        energyKj,
        protein,
        toNum(row[cols.fat]),
        toNum(row[cols.carbs]),
        colFibre ? toNum(row[colFibre]) : null,
        colSugar ? toNum(row[colSugar]) : null,
        colSodium ? toNum(row[colSodium]) : null,
        100,
        [],
      ),
    );
  }

  return { records, droppedDupes };
};

const buildAusnutRecords = (
  excludedNames: Set<string>,
): { records: IngestRecord[]; droppedDupes: number } => {
  const has2023 = !!findFirstExisting('AUSNUT 2023 - Food nutrient profiles.xlsx');
  if (has2023) {
    console.log('Using AUSNUT 2023 nutrient profiles workbook');
    return buildAusnutRecords2023(excludedNames);
  }

  console.log('Using legacy AUSNUT details/nutrient/measure files');
  return buildAusnutRecordsLegacy(excludedNames);
};

// ─── Main ─────────────────────────────────────────────────────────────
const main = () => {
  console.log('Reading AFCD…');
  const afcd = buildAfcdRecords();
  console.log(`  → ${afcd.length} AFCD records`);

  const afcdNames = new Set(afcd.map((r) => r.name.toLowerCase().trim()));

  console.log('Reading AUSNUT…');
  const { records: ausnut, droppedDupes } = buildAusnutRecords(afcdNames);
  console.log(
    `  → ${ausnut.length} AUSNUT records (dropped ${droppedDupes} dupes vs. AFCD)`,
  );

  const all = [...afcd, ...ausnut];

  // Sanity check: kJ → kcal conversion. A banana should be < 120 kcal/100g.
  const banana = all.find((r) => /^banana(,| ).*(raw|fresh)/i.test(r.name));
  if (banana) {
    if (banana.nutrientsPer100g.calories > 120) {
      throw new Error(
        `Sanity check failed: banana = ${banana.nutrientsPer100g.calories} kcal/100g (expected < 120). kJ → kcal conversion likely broken.`,
      );
    }
    console.log(
      `Sanity: ${banana.name} = ${banana.nutrientsPer100g.calories} kcal/100g ✓`,
    );
  } else {
    console.warn(
      'Sanity: no banana match in dataset — review nutrient unit handling manually.',
    );
  }

  writeFileSync(OUT, JSON.stringify(all));
  console.log(`Wrote ${all.length} records → ${OUT}`);
};

main();
