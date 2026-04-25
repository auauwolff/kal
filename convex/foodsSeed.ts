// Hand-curated seed for the Phase 2 MVP food search. Replaced by the
// AUSNUT + AFCD ETL in a later slice — nutrition values here are typical
// approximations, not authoritative.

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

  // ── Whole foods (AUSNUT-style) ───────────────────────────────────
  {
    source: 'ausnut',
    sourceId: 'banana-fresh',
    name: 'Banana',
    defaultServingG: 120,
    nutrientsPer100g: { calories: 89, proteinG: 1.1, carbsG: 22.8, fatG: 0.3, fiberG: 2.6, sugarG: 12.2 },
    commonPortions: [
      { label: '1 small', grams: 90 },
      { label: '1 medium', grams: 120 },
      { label: '1 large', grams: 150 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'apple-fresh',
    name: 'Apple',
    defaultServingG: 180,
    nutrientsPer100g: { calories: 52, proteinG: 0.3, carbsG: 13.8, fatG: 0.2, fiberG: 2.4, sugarG: 10.4 },
    commonPortions: [
      { label: '1 small', grams: 130 },
      { label: '1 medium', grams: 180 },
      { label: '1 large', grams: 220 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'avocado',
    name: 'Avocado',
    defaultServingG: 100,
    nutrientsPer100g: { calories: 160, proteinG: 2, carbsG: 8.5, fatG: 14.7, fiberG: 6.7 },
    commonPortions: [
      { label: '¼ large', grams: 50 },
      { label: '½ large', grams: 100 },
      { label: '1 whole', grams: 200 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'broccoli-steamed',
    name: 'Broccoli, steamed',
    defaultServingG: 100,
    nutrientsPer100g: { calories: 35, proteinG: 2.4, carbsG: 7.2, fatG: 0.4, fiberG: 3.3 },
    commonPortions: [
      { label: '1 cup', grams: 90 },
      { label: '1 floret', grams: 30 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'carrot-raw',
    name: 'Carrot, raw',
    defaultServingG: 80,
    nutrientsPer100g: { calories: 41, proteinG: 0.9, carbsG: 9.6, fatG: 0.2, fiberG: 2.8, sugarG: 4.7 },
    commonPortions: [
      { label: '1 medium', grams: 80 },
      { label: '1 cup grated', grams: 110 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'mixed-salad',
    name: 'Mixed salad leaves',
    defaultServingG: 50,
    nutrientsPer100g: { calories: 15, proteinG: 1.4, carbsG: 2.9, fatG: 0.2, fiberG: 1.3 },
    commonPortions: [
      { label: '1 cup', grams: 30 },
      { label: '1 large bowl', grams: 100 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'cucumber',
    name: 'Cucumber',
    defaultServingG: 100,
    nutrientsPer100g: { calories: 15, proteinG: 0.7, carbsG: 3.6, fatG: 0.1, fiberG: 0.5 },
    commonPortions: [
      { label: '½ cup sliced', grams: 60 },
      { label: '1 whole', grams: 300 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'tomato',
    name: 'Tomato',
    defaultServingG: 120,
    nutrientsPer100g: { calories: 18, proteinG: 0.9, carbsG: 3.9, fatG: 0.2, fiberG: 1.2 },
    commonPortions: [
      { label: '1 medium', grams: 120 },
      { label: '1 cherry', grams: 17 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'potato-boiled',
    name: 'Potato, boiled',
    defaultServingG: 150,
    nutrientsPer100g: { calories: 87, proteinG: 1.9, carbsG: 20.1, fatG: 0.1, fiberG: 1.8 },
    commonPortions: [
      { label: '1 small', grams: 100 },
      { label: '1 medium', grams: 150 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'sweet-potato-baked',
    name: 'Sweet potato, baked',
    defaultServingG: 150,
    nutrientsPer100g: { calories: 90, proteinG: 2, carbsG: 20.7, fatG: 0.2, fiberG: 3.3, sugarG: 6.5 },
    commonPortions: [
      { label: '1 small', grams: 100 },
      { label: '1 medium', grams: 150 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'chicken-breast-grilled',
    name: 'Chicken breast, grilled',
    defaultServingG: 150,
    nutrientsPer100g: { calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6 },
    commonPortions: [
      { label: '1 small fillet', grams: 120 },
      { label: '1 medium fillet', grams: 150 },
      { label: '1 large fillet', grams: 200 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'beef-mince-cooked',
    name: 'Beef mince, cooked',
    defaultServingG: 150,
    nutrientsPer100g: { calories: 254, proteinG: 26, carbsG: 0, fatG: 17 },
    commonPortions: [
      { label: '100 g', grams: 100 },
      { label: '150 g', grams: 150 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'kangaroo-steak',
    name: 'Kangaroo steak, grilled',
    defaultServingG: 150,
    nutrientsPer100g: { calories: 119, proteinG: 24, carbsG: 0, fatG: 2.1 },
    commonPortions: [
      { label: '1 small steak', grams: 120 },
      { label: '1 large steak', grams: 200 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'barramundi-fillet',
    name: 'Barramundi fillet, baked',
    defaultServingG: 150,
    nutrientsPer100g: { calories: 110, proteinG: 20.5, carbsG: 0, fatG: 2.5 },
    commonPortions: [
      { label: '1 fillet', grams: 150 },
      { label: '1 large fillet', grams: 200 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'salmon-baked',
    name: 'Salmon fillet, baked',
    defaultServingG: 120,
    nutrientsPer100g: { calories: 208, proteinG: 20.4, carbsG: 0, fatG: 13.4 },
    commonPortions: [
      { label: '1 fillet', grams: 120 },
      { label: '1 large fillet', grams: 180 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'tuna-springwater',
    name: 'Tuna in springwater',
    defaultServingG: 95,
    nutrientsPer100g: { calories: 116, proteinG: 26, carbsG: 0, fatG: 1 },
    commonPortions: [
      { label: '1 small can (95 g)', grams: 95 },
      { label: '1 large can (185 g)', grams: 185 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'egg-boiled',
    name: 'Egg, boiled',
    defaultServingG: 50,
    nutrientsPer100g: { calories: 155, proteinG: 12.6, carbsG: 1.1, fatG: 10.6 },
    commonPortions: [
      { label: '1 large', grams: 50 },
      { label: '2 large', grams: 100 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'almonds',
    name: 'Almonds',
    defaultServingG: 30,
    nutrientsPer100g: { calories: 579, proteinG: 21, carbsG: 22, fatG: 50, fiberG: 12 },
    commonPortions: [
      { label: '1 small handful (30 g)', grams: 30 },
      { label: '10 almonds', grams: 12 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'macadamias',
    name: 'Macadamia nuts',
    defaultServingG: 20,
    nutrientsPer100g: { calories: 718, proteinG: 7.9, carbsG: 13.8, fatG: 75.8, fiberG: 8.6 },
    commonPortions: [
      { label: '1 small handful (20 g)', grams: 20 },
      { label: '10 nuts', grams: 20 },
    ],
  },

  // ── Dairy & pantry ───────────────────────────────────────────────
  {
    source: 'ausnut',
    sourceId: 'milk-full-cream',
    name: 'Milk, full cream',
    defaultServingG: 250,
    nutrientsPer100g: { calories: 66, proteinG: 3.4, carbsG: 4.7, fatG: 3.7, sugarG: 4.7 },
    commonPortions: [
      { label: '1 cup (250 mL)', grams: 258 },
      { label: '½ cup', grams: 129 },
      { label: '1 splash', grams: 30 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'cheddar-cheese',
    name: 'Cheddar cheese',
    defaultServingG: 30,
    nutrientsPer100g: { calories: 402, proteinG: 25, carbsG: 1.3, fatG: 33 },
    commonPortions: [
      { label: '1 slice', grams: 20 },
      { label: '1 matchbox', grams: 30 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'butter',
    name: 'Butter',
    defaultServingG: 10,
    nutrientsPer100g: { calories: 717, proteinG: 0.9, carbsG: 0.1, fatG: 81 },
    commonPortions: [
      { label: '1 tsp', grams: 5 },
      { label: '1 tbsp', grams: 14 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'olive-oil',
    name: 'Olive oil',
    defaultServingG: 14,
    nutrientsPer100g: { calories: 884, proteinG: 0, carbsG: 0, fatG: 100 },
    commonPortions: [
      { label: '1 tsp', grams: 5 },
      { label: '1 tbsp', grams: 14 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'peanut-butter',
    name: 'Peanut butter, smooth',
    defaultServingG: 20,
    nutrientsPer100g: { calories: 588, proteinG: 25, carbsG: 20, fatG: 50, fiberG: 6 },
    commonPortions: [
      { label: '1 tbsp', grams: 20 },
      { label: '2 tbsp', grams: 40 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'honey',
    name: 'Honey',
    defaultServingG: 21,
    nutrientsPer100g: { calories: 304, proteinG: 0.3, carbsG: 82, fatG: 0, sugarG: 82 },
    commonPortions: [
      { label: '1 tsp', grams: 7 },
      { label: '1 tbsp', grams: 21 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'dark-chocolate-70',
    name: 'Dark chocolate (70%)',
    defaultServingG: 25,
    nutrientsPer100g: { calories: 598, proteinG: 7.8, carbsG: 46, fatG: 43, fiberG: 11, sugarG: 24 },
    commonPortions: [
      { label: '2 squares', grams: 20 },
      { label: '4 squares', grams: 40 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'ice-cream-vanilla',
    name: 'Ice cream, vanilla',
    defaultServingG: 80,
    nutrientsPer100g: { calories: 207, proteinG: 3.5, carbsG: 24, fatG: 11 },
    commonPortions: [
      { label: '1 scoop', grams: 65 },
      { label: '2 scoops', grams: 130 },
    ],
  },

  // ── Breads & grains ──────────────────────────────────────────────
  {
    source: 'ausnut',
    sourceId: 'sourdough-bread',
    name: 'Sourdough bread',
    defaultServingG: 60,
    nutrientsPer100g: { calories: 270, proteinG: 10, carbsG: 53, fatG: 2, fiberG: 2.4 },
    commonPortions: [
      { label: '1 slice', grams: 30 },
      { label: '2 slices', grams: 60 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'white-bread',
    name: 'White bread',
    defaultServingG: 60,
    nutrientsPer100g: { calories: 265, proteinG: 9, carbsG: 49, fatG: 3.2, fiberG: 2.7 },
    commonPortions: [
      { label: '1 slice', grams: 30 },
      { label: '2 slices', grams: 60 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'jasmine-rice-cooked',
    name: 'Jasmine rice, cooked',
    defaultServingG: 200,
    nutrientsPer100g: { calories: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 },
    commonPortions: [
      { label: '½ cup cooked', grams: 100 },
      { label: '1 cup cooked', grams: 200 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'brown-rice-cooked',
    name: 'Brown rice, cooked',
    defaultServingG: 200,
    nutrientsPer100g: { calories: 123, proteinG: 2.7, carbsG: 25.6, fatG: 1, fiberG: 1.8 },
    commonPortions: [
      { label: '½ cup cooked', grams: 100 },
      { label: '1 cup cooked', grams: 200 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'pasta-cooked',
    name: 'Pasta, cooked',
    defaultServingG: 200,
    nutrientsPer100g: { calories: 157, proteinG: 5.8, carbsG: 30.7, fatG: 0.9, fiberG: 1.8 },
    commonPortions: [
      { label: '½ cup', grams: 100 },
      { label: '1 cup', grams: 200 },
      { label: '1 large bowl', grams: 300 },
    ],
  },
  {
    source: 'ausnut',
    sourceId: 'rolled-oats-dry',
    name: 'Rolled oats, dry',
    defaultServingG: 40,
    nutrientsPer100g: { calories: 379, proteinG: 13.2, carbsG: 67.7, fatG: 6.5, fiberG: 10 },
    commonPortions: [
      { label: '⅓ cup (30 g)', grams: 30 },
      { label: '½ cup (40 g)', grams: 40 },
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
