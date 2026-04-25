// Hand-curated seed for AU items not covered by AUSNUT/AFCD: AU-specific
// branded products and restaurant chains. Whole-food nutrition is loaded by
// the AUSNUT + AFCD ETL (`scripts/seedFoods.ts`), not by this file.

export type FoodSeedItem = {
  source:
    | 'ausnut'
    | 'afcd'
    | 'branded_au'
    | 'usda'
    | 'chain'
    | 'user_contributed'
    | 'openfoodfacts_cache';
  sourceId: string;
  name: string;
  brand?: string;
  barcode?: string;
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
  // Extra tokens baked into `searchText` at insert time so users can find
  // a food by informal names (e.g. "GYG", "Maccas", "HJ"). Not surfaced in UI.
  aliases?: string[];
};

export const AU_FOODS_SEED: FoodSeedItem[] = [
  // ── Australian branded pantry ────────────────────────────────────
  {
    source: 'branded_au',
    sourceId: 'weetbix',
    name: 'Weet-Bix',
    brand: 'Sanitarium',
    defaultServingG: 30,
    nutrientsPer100g: { calories: 348, proteinG: 12, carbsG: 67, fatG: 1.4, fiberG: 11, sugarG: 3.3, sodiumMg: 270 },
    commonPortions: [
      { label: '1 biscuit', grams: 15 },
      { label: '2 biscuits', grams: 30 },
      { label: '3 biscuits', grams: 45 },
    ],
  },
  {
    source: 'branded_au',
    sourceId: 'vegemite',
    name: 'Vegemite',
    brand: 'Bega',
    defaultServingG: 5,
    nutrientsPer100g: { calories: 173, proteinG: 25, carbsG: 19, fatG: 0.9, sodiumMg: 3450 },
    commonPortions: [
      { label: '1 tsp (scrape)', grams: 5 },
      { label: '1 tbsp (thick)', grams: 15 },
    ],
  },
  {
    source: 'branded_au',
    sourceId: 'promite',
    name: 'Promite',
    brand: 'Masterfoods',
    defaultServingG: 5,
    nutrientsPer100g: { calories: 205, proteinG: 7, carbsG: 41, fatG: 0.5, sodiumMg: 2900 },
    commonPortions: [
      { label: '1 tsp', grams: 5 },
      { label: '1 tbsp', grams: 15 },
    ],
  },
  {
    source: 'branded_au',
    sourceId: 'tim-tam-original',
    name: 'Tim Tam Original',
    brand: "Arnott's",
    defaultServingG: 18,
    nutrientsPer100g: { calories: 517, proteinG: 5.6, carbsG: 65, fatG: 26, fiberG: 2.1, sugarG: 41 },
    commonPortions: [
      { label: '1 biscuit', grams: 18 },
      { label: '2 biscuits', grams: 36 },
      { label: '1 full pack (11)', grams: 200 },
    ],
  },
  {
    source: 'branded_au',
    sourceId: 'shapes-bbq',
    name: 'Shapes BBQ',
    brand: "Arnott's",
    defaultServingG: 25,
    nutrientsPer100g: { calories: 495, proteinG: 7.4, carbsG: 61, fatG: 23, sodiumMg: 870 },
    commonPortions: [
      { label: '1 handful (~7)', grams: 25 },
      { label: 'Half pack', grams: 87 },
    ],
  },
  {
    source: 'branded_au',
    sourceId: 'sao',
    name: 'Sao cracker',
    brand: "Arnott's",
    defaultServingG: 13,
    nutrientsPer100g: { calories: 430, proteinG: 10, carbsG: 73, fatG: 10, sodiumMg: 700 },
    commonPortions: [
      { label: '1 cracker', grams: 13 },
      { label: '2 crackers', grams: 26 },
    ],
  },
  {
    source: 'branded_au',
    sourceId: 'vita-weat',
    name: 'Vita-Weat Original',
    brand: 'Arnott\'s',
    defaultServingG: 9,
    nutrientsPer100g: { calories: 361, proteinG: 12, carbsG: 64, fatG: 3.8, fiberG: 12, sodiumMg: 560 },
    commonPortions: [
      { label: '1 cracker', grams: 9 },
      { label: '3 crackers', grams: 27 },
    ],
  },
  {
    source: 'branded_au',
    sourceId: 'cruskits',
    name: 'Cruskits Original',
    brand: 'Arnott\'s',
    defaultServingG: 6,
    nutrientsPer100g: { calories: 397, proteinG: 10, carbsG: 78, fatG: 3.8, sodiumMg: 540 },
    commonPortions: [
      { label: '1 cruskit', grams: 6 },
      { label: '2 cruskits', grams: 12 },
    ],
  },
  {
    source: 'branded_au',
    sourceId: 'vita-brits',
    name: 'Vita Brits',
    brand: 'Uncle Tobys',
    defaultServingG: 30,
    nutrientsPer100g: { calories: 353, proteinG: 11, carbsG: 68, fatG: 1.9, fiberG: 11, sugarG: 2.7 },
    commonPortions: [
      { label: '1 biscuit', grams: 15 },
      { label: '2 biscuits', grams: 30 },
    ],
  },
  {
    source: 'branded_au',
    sourceId: 'plus-muesli',
    name: 'Plus Protein Muesli',
    brand: 'Uncle Tobys',
    defaultServingG: 45,
    nutrientsPer100g: { calories: 420, proteinG: 16, carbsG: 54, fatG: 12, fiberG: 10, sugarG: 17 },
    commonPortions: [
      { label: '45 g (¼ cup)', grams: 45 },
      { label: '60 g (⅓ cup)', grams: 60 },
    ],
  },
  {
    source: 'branded_au',
    sourceId: 'carmans-original-bar',
    name: 'Original Fruit-Free Muesli Bar',
    brand: "Carman's",
    defaultServingG: 45,
    nutrientsPer100g: { calories: 433, proteinG: 9.5, carbsG: 54, fatG: 19, fiberG: 5.6, sugarG: 23 },
    commonPortions: [{ label: '1 bar', grams: 45 }],
  },
  {
    source: 'branded_au',
    sourceId: 'anzac-biscuit',
    name: 'Anzac biscuit',
    defaultServingG: 25,
    nutrientsPer100g: { calories: 460, proteinG: 5.3, carbsG: 66, fatG: 19, fiberG: 2.6, sugarG: 34 },
    commonPortions: [
      { label: '1 biscuit', grams: 25 },
      { label: '2 biscuits', grams: 50 },
    ],
  },
  {
    source: 'branded_au',
    sourceId: 'lamington',
    name: 'Lamington',
    defaultServingG: 60,
    nutrientsPer100g: { calories: 370, proteinG: 4.5, carbsG: 52, fatG: 16, sugarG: 39 },
    commonPortions: [{ label: '1 lamington', grams: 60 }],
  },
  {
    source: 'branded_au',
    sourceId: 'banana-bread',
    name: 'Banana bread',
    defaultServingG: 100,
    nutrientsPer100g: { calories: 326, proteinG: 4.3, carbsG: 54, fatG: 10, fiberG: 1.9, sugarG: 28 },
    commonPortions: [
      { label: '1 slice', grams: 100 },
      { label: '½ slice', grams: 50 },
    ],
  },
  {
    source: 'branded_au',
    sourceId: 'heinz-baked-beans',
    name: 'Baked beans in tomato sauce',
    brand: 'Heinz',
    defaultServingG: 220,
    nutrientsPer100g: { calories: 80, proteinG: 5, carbsG: 11, fatG: 0.3, fiberG: 4.3, sugarG: 4.7, sodiumMg: 400 },
    commonPortions: [
      { label: '½ can (220 g)', grams: 220 },
      { label: '1 can (420 g)', grams: 420 },
    ],
  },
  {
    source: 'branded_au',
    sourceId: 'chobani-greek-plain',
    name: 'Greek yogurt, plain',
    brand: 'Chobani',
    defaultServingG: 170,
    nutrientsPer100g: { calories: 59, proteinG: 10, carbsG: 3.6, fatG: 0.4, sugarG: 3.6 },
    commonPortions: [
      { label: '1 tub (170 g)', grams: 170 },
      { label: '½ cup', grams: 125 },
    ],
  },

  // ── Chains ───────────────────────────────────────────────────────
  {
    source: 'chain',
    sourceId: 'gyg-chicken-mini-burrito',
    name: 'Chicken Mini Burrito',
    brand: 'Guzman y Gomez',
    defaultServingG: 280,
    nutrientsPer100g: { calories: 193, proteinG: 12.1, carbsG: 20.7, fatG: 6.4 },
    commonPortions: [{ label: '1 mini burrito', grams: 280 }],
    aliases: ['GYG'],
  },
  {
    source: 'chain',
    sourceId: 'gyg-chicken-nachos',
    name: 'Chicken Nachos (regular)',
    brand: 'Guzman y Gomez',
    defaultServingG: 450,
    nutrientsPer100g: { calories: 180, proteinG: 8.4, carbsG: 14.2, fatG: 9.6 },
    commonPortions: [{ label: '1 regular', grams: 450 }],
    aliases: ['GYG'],
  },
  {
    source: 'chain',
    sourceId: 'zambrero-classic-chicken-burrito',
    name: 'Classic Chicken Burrito',
    brand: 'Zambrero',
    defaultServingG: 320,
    nutrientsPer100g: { calories: 183, proteinG: 11, carbsG: 24.5, fatG: 4.2 },
    commonPortions: [
      { label: '1 regular', grams: 320 },
      { label: '1 large', grams: 440 },
    ],
  },
  {
    source: 'chain',
    sourceId: 'grilld-simply-grilled',
    name: 'Simply Grilled chicken burger',
    brand: "Grill'd",
    defaultServingG: 280,
    nutrientsPer100g: { calories: 186, proteinG: 13.2, carbsG: 17.9, fatG: 6.4 },
    commonPortions: [{ label: '1 burger', grams: 280 }],
  },
  {
    source: 'chain',
    sourceId: 'nandos-quarter-chicken-breast',
    name: '¼ Chicken (breast)',
    brand: "Nando's",
    defaultServingG: 180,
    nutrientsPer100g: { calories: 172, proteinG: 28, carbsG: 0.5, fatG: 6.5 },
    commonPortions: [{ label: '¼ chicken', grams: 180 }],
  },
  {
    source: 'chain',
    sourceId: 'hj-whopper',
    name: 'Whopper',
    brand: "Hungry Jack's",
    defaultServingG: 270,
    nutrientsPer100g: { calories: 244, proteinG: 11.4, carbsG: 19.9, fatG: 13.5 },
    commonPortions: [{ label: '1 whopper', grams: 270 }],
    aliases: ['HJ', 'Hungry Jacks'],
  },
  {
    source: 'chain',
    sourceId: 'mcd-big-mac',
    name: 'Big Mac',
    brand: "McDonald's",
    defaultServingG: 215,
    nutrientsPer100g: { calories: 257, proteinG: 12.4, carbsG: 20.4, fatG: 14 },
    commonPortions: [{ label: '1 Big Mac', grams: 215 }],
    aliases: ['Maccas', 'McDonalds', 'McDs'],
  },
  {
    source: 'chain',
    sourceId: 'kfc-original-breast',
    name: 'Original Recipe piece (breast)',
    brand: 'KFC',
    defaultServingG: 150,
    nutrientsPer100g: { calories: 253, proteinG: 23, carbsG: 8.7, fatG: 14 },
    commonPortions: [{ label: '1 piece', grams: 150 }],
  },
  {
    source: 'chain',
    sourceId: 'subway-chicken-teriyaki-6',
    name: 'Chicken Teriyaki 6-inch',
    brand: 'Subway',
    defaultServingG: 230,
    nutrientsPer100g: { calories: 162, proteinG: 11.7, carbsG: 21.3, fatG: 2.8 },
    commonPortions: [
      { label: '6-inch', grams: 230 },
      { label: 'Footlong', grams: 460 },
    ],
  },
  {
    source: 'chain',
    sourceId: 'dominos-pepperoni-slice',
    name: 'Pepperoni pizza slice',
    brand: "Domino's",
    defaultServingG: 100,
    nutrientsPer100g: { calories: 266, proteinG: 11, carbsG: 29, fatG: 11.5 },
    commonPortions: [
      { label: '1 slice', grams: 100 },
      { label: '2 slices', grams: 200 },
    ],
  },
];
