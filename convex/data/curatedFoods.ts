// New foods to insert via the `seedCuratedFoods` admin mutation.
// Sources for nutrition data are noted inline.

export type FoodSource =
  | 'ausnut'
  | 'afcd'
  | 'branded_au'
  | 'usda'
  | 'chain'
  | 'user_contributed'
  | 'openfoodfacts_cache';

export interface CuratedFood {
  source: FoodSource;
  sourceId: string;
  name: string;
  brand?: string;
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
}

// Convert a per-serving value to per-100g.
const per100 = (value: number, servingG: number): number =>
  Math.round((value * 100) / servingG * 10) / 10;

const calPer100 = (cal: number, servingG: number): number =>
  Math.round((cal * 100) / servingG);

const GYG = 'Guzman y Gomez';

// Helper for GYG entries — per-serving values are converted to per-100g.
const gyg = (
  sourceId: string,
  name: string,
  servingG: number,
  cal: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
  portionLabel: string,
): CuratedFood => ({
  source: 'chain',
  sourceId,
  name,
  brand: GYG,
  defaultServingG: servingG,
  nutrientsPer100g: {
    calories: calPer100(cal, servingG),
    proteinG: per100(proteinG, servingG),
    carbsG: per100(carbsG, servingG),
    fatG: per100(fatG, servingG),
  },
  commonPortions: [{ label: portionLabel, grams: servingG }],
});

// Sources for all GYG nutrition: CalorieKing AU per-item pages and
// FatSecret AU listing for Guzman y Gomez. Where only kcal was available
// from a single source, macros are taken from the closest variant on the
// official 2024 nutrition guide.
export const curatedFoods: CuratedFood[] = [
  // Mashed potato (slug version of AUSNUT F007335 with friendlier name).
  // Source: AUSNUT 2011-13 "Potato, mashed, with cow's milk & butter or
  // dairy blend" (F007335).
  {
    source: 'ausnut',
    sourceId: 'mashed-potato',
    name: 'Mashed potato',
    defaultServingG: 150,
    nutrientsPer100g: {
      calories: 100,
      proteinG: 2.1,
      carbsG: 11,
      fatG: 4.9,
      fiberG: 1.6,
      sugarG: 1.3,
      sodiumMg: 45,
    },
    commonPortions: [
      { label: '1/2 cup', grams: 100 },
      { label: '1 cup', grams: 200 },
      { label: '1 scoop', grams: 80 },
    ],
  },

  // ====================== Guzman y Gomez — Burritos (480g) ======================
  gyg('gyg-burrito-grilled-chicken', 'Burrito (Mild Grilled Chicken)', 480, 777, 47.2, 87.9, 26, '1 burrito'),
  gyg('gyg-burrito-beef-brisket', 'Burrito (Mild Shredded Beef Brisket)', 480, 802, 49.3, 87.9, 27.8, '1 burrito'),
  gyg('gyg-burrito-pulled-pork', 'Burrito (Mild Pulled Pork)', 480, 860, 47.4, 88.4, 35, '1 burrito'),
  gyg('gyg-burrito-shredded-mushroom', 'Burrito (Mild Shredded Mushroom)', 480, 798, 26, 95, 34, '1 burrito'),

  // ====================== Burrito Bowls (455g) ======================
  gyg('gyg-burrito-bowl-grilled-chicken', 'Burrito Bowl (Mild Grilled Chicken)', 455, 664, 62.7, 71, 23, '1 bowl'),
  gyg('gyg-burrito-bowl-beef-brisket', 'Burrito Bowl (Mild Shredded Beef Brisket)', 455, 692, 50, 71, 26, '1 bowl'),
  gyg('gyg-burrito-bowl-pulled-pork', 'Burrito Bowl (Mild Pulled Pork)', 455, 746, 42.9, 71.5, 32, '1 bowl'),
  gyg('gyg-burrito-bowl-slow-cooked-beef', 'Burrito Bowl (Mild Slow Cooked Beef)', 455, 688, 47, 71, 24, '1 bowl'),
  gyg('gyg-burrito-bowl-barramundi', 'Burrito Bowl (Mild Seared Barramundi)', 455, 669, 38.1, 71.7, 25.6, '1 bowl'),
  gyg('gyg-burrito-bowl-steak', 'Burrito Bowl (Mild Steak)', 455, 655, 50, 60, 22, '1 bowl'),
  gyg('gyg-burrito-bowl-beef-guerrero', 'Burrito Bowl (Mild Beef Guerrero)', 455, 740, 31, 83, 34, '1 bowl'),
  gyg('gyg-burrito-bowl-shredded-mushroom', 'Burrito Bowl (Mild Shredded Mushroom)', 455, 730, 19, 90, 32, '1 bowl'),

  // ====================== Cali Burritos (470g) ======================
  gyg('gyg-cali-burrito-grilled-chicken', 'Cali Burrito (Mild Grilled Chicken)', 470, 973, 46, 75, 53, '1 cali burrito'),
  gyg('gyg-cali-burrito-pulled-pork', 'Cali Burrito (Spicy Pulled Pork)', 470, 910, 39, 102, 45, '1 cali burrito'),

  // ====================== Mini Burritos (260g) ======================
  // Note: existing chain entry "gyg-chicken-mini-burrito" (280g, 193cal/100g)
  // remains as the searchable Mini Burrito. The 260g Mild Grilled Chicken
  // variant from CalorieKing is captured by that entry.

  // ====================== Mini Cali Burritos (290g) ======================
  gyg('gyg-mini-cali-burrito-grilled-chicken', 'Mini Cali Burrito (Mild Grilled Chicken)', 290, 610, 20, 59, 31, '1 mini cali burrito'),

  // ====================== Mini Bowls (264g) ======================
  // Source: FatSecret AU listing — 264g, 413 cal. Macros derived from full
  // bowl ratio (chicken bowl 455g→264g ≈ 0.58×).
  gyg('gyg-mini-bowl-grilled-chicken', 'Mini Bowl (Mild Grilled Chicken)', 264, 413, 36, 41, 13, '1 mini bowl'),
  gyg('gyg-mini-bowl-ground-beef', 'Mini Bowl (Mild Ground Beef)', 264, 433, 23, 40, 19, '1 mini bowl'),

  // ====================== Tacos ======================
  gyg('gyg-soft-taco-grilled-chicken', 'Soft Flour Taco (Mild Grilled Chicken)', 118, 194, 15.3, 14.5, 8.1, '1 taco'),
  gyg('gyg-soft-taco-ground-beef', 'Soft Flour Taco (Mild Ground Beef)', 118, 213, 11.5, 15.8, 11.2, '1 taco'),
  gyg('gyg-hard-taco-grilled-chicken', 'Hard Taco (Mild Grilled Chicken)', 109, 193, 14.5, 12.8, 8.8, '1 taco'),
  gyg('gyg-hard-taco-ground-beef', 'Hard Taco (Mild Ground Beef)', 109, 211, 11, 13, 11.5, '1 taco'),
  gyg('gyg-soft-tender-taco', 'Soft Tender Taco', 99, 277, 12, 20, 17, '1 taco'),
  gyg('gyg-3-dollar-taco-ground-beef', '$3 Taco (Mild Ground Beef)', 74, 161, 8.5, 10.5, 9, '1 taco'),

  // ====================== Nachos (regular ~500g) ======================
  gyg('gyg-nachos-ground-beef', 'Nachos (Mild Ground Beef)', 500, 1154, 42.4, 75.2, 75.2, '1 regular nachos'),
  // Existing slug "gyg-chicken-nachos" (450g, 180cal/100g) covers chicken.

  // ====================== Quesadillas (160g) ======================
  // Source: FatSecret AU — 160g, 462 cal (chicken) / 485 cal (beef). Macros
  // estimated from cheese-quesadilla ratio.
  gyg('gyg-quesadilla-grilled-chicken', 'Quesadilla (Mild Grilled Chicken)', 160, 462, 27, 32, 24, '1 quesadilla'),
  gyg('gyg-quesadilla-ground-beef', 'Quesadilla (Mild Ground Beef)', 160, 485, 23, 33, 28, '1 quesadilla'),

  // ====================== Sides ======================
  gyg('gyg-fries-chipotle-medium', 'Fries Chipotle (Medium)', 120, 359, 5.3, 40.7, 18.5, '1 medium'),
  gyg('gyg-fries-chipotle-large', 'Fries Chipotle (Large)', 180, 538, 7.9, 61, 27.7, '1 large'),
  gyg('gyg-guacamole', 'Guacamole', 70, 126, 1.5, 7, 11, '1 side'),
  // Source: FatSecret AU — 284g, 289 cal. Macros estimated from grilled
  // chicken bowl protein ratio.
  gyg('gyg-salad-chipotle-mayo-grilled-chicken', 'Salad with Chipotle Mayo (Mild Grilled Chicken)', 284, 289, 25, 14, 14, '1 salad'),

  // ====================== Breakfast Burritos (240g) ======================
  // Source: FatSecret AU — 587 cal (bacon) / 577 cal (chicken chorizo).
  // Macros estimated from bacon breakfast burrito published values.
  gyg('gyg-breakfast-burrito-bacon', 'Breakfast Burrito (Mild Bacon)', 240, 587, 25, 51, 30, '1 breakfast burrito'),
  gyg('gyg-breakfast-burrito-chicken-chorizo', 'Breakfast Burrito (Free Range Chicken Chorizo)', 240, 577, 27, 50, 28, '1 breakfast burrito'),

  // ====================== Desserts ======================
  gyg('gyg-churros-chocolate', 'Churros with Chocolate Sauce', 108, 400, 5.8, 45.4, 21.3, '1 serve'),

  // ====================== Kids — Little G's ======================
  gyg('gyg-kids-burrito-grilled-chicken', "Little G's Burrito (Mild Grilled Chicken)", 175, 416, 24.4, 44.1, 15.4, '1 kids burrito'),
  gyg('gyg-kids-burrito-ground-beef', "Little G's Burrito (Mild Ground Beef)", 175, 440, 19.5, 45.7, 19.4, '1 kids burrito'),
  // Source: caloriecounter.com.au — 1730 kJ ≈ 413 cal. Macros estimated
  // from kids burrito ratio.
  gyg('gyg-kids-nachos-grilled-chicken', "Little G's Nachos (Mild Grilled Chicken)", 240, 413, 22, 36, 19, '1 kids nachos'),
  // Source: gygcalories.com — kids fries portion ~80g, derived from
  // medium-fries macros at smaller serving.
  gyg('gyg-kids-fries', "Little G's Fries", 80, 240, 3.5, 27, 12.3, '1 kids fries'),
];
