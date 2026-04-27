// Curated list of foods to flag as `isPrimary: true`.
// Primary foods get a large boost in `searchFoods` so the canonical entry
// for common items (egg, milk, banana, etc.) surfaces above the long tail
// of variants in AUSNUT/AFCD.
//
// Two parts:
//   1. `slugFoods`: entries already in the DB with hand-rolled slug-style
//      sourceIds (e.g. "apple-fresh", "egg-boiled"). These were always the
//      intended canonical entries.
//   2. `pickedAusnutFoods`: AUSNUT/AFCD Fxxxx entries we selected to fill
//      gaps where no slug entry exists (protein powder, ricotta, raw steak,
//      etc.).
//
// Pairs are referenced by `(source, sourceId)` rather than `_id` so the list
// stays readable and survives a re-import.

import type { FoodSource } from './curatedFoods';

export interface PrimaryRef {
  source: FoodSource;
  sourceId: string;
}

const slug = (source: FoodSource, sourceId: string): PrimaryRef => ({ source, sourceId });

// All 59 existing slug-style entries already in the DB.
const slugFoods: PrimaryRef[] = [
  slug('chain', 'nandos-quarter-chicken-breast'),
  slug('ausnut', 'almonds'),
  slug('branded_au', 'anzac-biscuit'),
  slug('ausnut', 'apple-fresh'),
  slug('ausnut', 'avocado'),
  slug('branded_au', 'heinz-baked-beans'),
  slug('ausnut', 'banana-fresh'),
  slug('branded_au', 'banana-bread'),
  slug('ausnut', 'barramundi-fillet'),
  slug('ausnut', 'beef-mince-cooked'),
  slug('chain', 'mcd-big-mac'),
  slug('ausnut', 'broccoli-steamed'),
  slug('ausnut', 'brown-rice-cooked'),
  slug('ausnut', 'butter'),
  slug('ausnut', 'carrot-raw'),
  slug('ausnut', 'cheddar-cheese'),
  slug('ausnut', 'chicken-breast-grilled'),
  slug('chain', 'gyg-chicken-mini-burrito'),
  slug('chain', 'gyg-chicken-nachos'),
  slug('chain', 'subway-chicken-teriyaki-6'),
  slug('chain', 'zambrero-classic-chicken-burrito'),
  slug('branded_au', 'cruskits'),
  slug('ausnut', 'cucumber'),
  slug('ausnut', 'dark-chocolate-70'),
  slug('ausnut', 'egg-boiled'),
  slug('branded_au', 'chobani-greek-plain'),
  slug('ausnut', 'honey'),
  slug('ausnut', 'ice-cream-vanilla'),
  slug('ausnut', 'jasmine-rice-cooked'),
  slug('ausnut', 'kangaroo-steak'),
  slug('branded_au', 'lamington'),
  slug('ausnut', 'macadamias'),
  slug('ausnut', 'milk-full-cream'),
  slug('ausnut', 'mixed-salad'),
  slug('ausnut', 'olive-oil'),
  slug('branded_au', 'carmans-original-bar'),
  slug('chain', 'kfc-original-breast'),
  slug('ausnut', 'pasta-cooked'),
  slug('ausnut', 'peanut-butter'),
  slug('chain', 'dominos-pepperoni-slice'),
  slug('branded_au', 'plus-muesli'),
  slug('ausnut', 'potato-boiled'),
  slug('branded_au', 'promite'),
  slug('ausnut', 'rolled-oats-dry'),
  slug('ausnut', 'salmon-baked'),
  slug('branded_au', 'sao'),
  slug('branded_au', 'shapes-bbq'),
  slug('chain', 'grilld-simply-grilled'),
  slug('ausnut', 'sourdough-bread'),
  slug('ausnut', 'sweet-potato-baked'),
  slug('branded_au', 'tim-tam-original'),
  slug('ausnut', 'tomato'),
  slug('ausnut', 'tuna-springwater'),
  slug('branded_au', 'vegemite'),
  slug('branded_au', 'vita-brits'),
  slug('branded_au', 'vita-weat'),
  slug('branded_au', 'weetbix'),
  slug('ausnut', 'white-bread'),
  slug('chain', 'hj-whopper'),
];

// Selected AUSNUT / AFCD entries to fill gaps where no slug exists.
const pickedAusnutFoods: PrimaryRef[] = [
  slug('ausnut', 'F007493'), // Protein powder, whey based, >70% protein
  slug('afcd', 'F003729'), // Egg, chicken, whole, raw
  slug('ausnut', 'F000862'), // Beef, steak, lean, raw
  slug('ausnut', 'F010433'), // Spinach, baby, packaged, raw
  slug('ausnut', 'F006238'), // Onion, mature, peeled, raw
  slug('afcd', 'F004193'), // Garlic, peeled, raw
  slug('afcd', 'F002488'), // Cheese, ricotta
  slug('afcd', 'F002472'), // Cheese, mozzarella
  slug('afcd', 'F002435'), // Cheese, cottage
  slug('afcd', 'F002452'), // Cheese, fetta (feta)
  slug('afcd', 'F008952'), // Strawberry, raw
  slug('afcd', 'F001290'), // Blueberry, raw
  slug('afcd', 'F000233'), // Bagel, from white flour, commercial
  slug('ausnut', 'F009181'), // Tofu (soy bean curd), cooked
  slug('ausnut', 'F005177'), // Lentil, dried, cooked
  slug('afcd', 'F002880'), // Chickpea, canned, drained
  slug('afcd', 'F000448'), // Bean, red kidney, canned, drained
  slug('ausnut', 'F007596'), // Quinoa, cooked
  slug('ausnut', 'F003235'), // Couscous, cooked
  slug('afcd', 'F007864'), // Salmon, smoked, sliced
  slug('ausnut', 'F000231'), // Bacon, shortcut, cooked
  slug('ausnut', 'F008143'), // Sausage, pork, cooked
  slug('afcd', 'F004299'), // Ham, leg, lean
  slug('afcd', 'F003321'), // Cucumber, Lebanese, unpeeled, raw
  slug('ausnut', 'F003305'), // Croissant, plain, unfilled
  slug('ausnut', 'F001553'), // Bread, wholemeal, commercial
  slug('ausnut', 'F002001'), // Cabbage, raw
  slug('ausnut', 'F002247'), // Capsicum, red, raw
  slug('ausnut', 'F005946'), // Mushroom, common, raw
  slug('afcd', 'F005191'), // Lettuce, cos, raw
  slug('afcd', 'F007535'), // Pumpkin, butternut, peeled, raw
  slug('ausnut', 'F009775'), // Zucchini, green skin, raw
  slug('afcd', 'F006116'), // Walnut, raw
  slug('afcd', 'F006090'), // Cashew, roasted, salted
  slug('afcd', 'F006107'), // Peanut, with skin, raw
  slug('ausnut', 'F009655'), // Yoghurt, natural, greek style (~10% fat)
  slug('ausnut', 'F002991'), // Coconut milk, canned
  slug('ausnut', 'F009969'), // Almond beverage, unfortified
  slug('afcd', 'F007878'), // Salt, table, iodised
  slug('afcd', 'F006618'), // Pepper, black, ground
];

// New foods we insert via `seedCuratedFoods`. Their sourceIds are listed
// here so they get the primary boost too.
const newCuratedFoods: PrimaryRef[] = [
  slug('ausnut', 'mashed-potato'),
  // GYG burritos
  slug('chain', 'gyg-burrito-grilled-chicken'),
  slug('chain', 'gyg-burrito-beef-brisket'),
  slug('chain', 'gyg-burrito-pulled-pork'),
  slug('chain', 'gyg-burrito-shredded-mushroom'),
  // GYG burrito bowls
  slug('chain', 'gyg-burrito-bowl-grilled-chicken'),
  slug('chain', 'gyg-burrito-bowl-beef-brisket'),
  slug('chain', 'gyg-burrito-bowl-pulled-pork'),
  slug('chain', 'gyg-burrito-bowl-slow-cooked-beef'),
  slug('chain', 'gyg-burrito-bowl-barramundi'),
  slug('chain', 'gyg-burrito-bowl-steak'),
  slug('chain', 'gyg-burrito-bowl-beef-guerrero'),
  slug('chain', 'gyg-burrito-bowl-shredded-mushroom'),
  // GYG cali burritos
  slug('chain', 'gyg-cali-burrito-grilled-chicken'),
  slug('chain', 'gyg-cali-burrito-pulled-pork'),
  slug('chain', 'gyg-mini-cali-burrito-grilled-chicken'),
  // GYG mini bowls
  slug('chain', 'gyg-mini-bowl-grilled-chicken'),
  slug('chain', 'gyg-mini-bowl-ground-beef'),
  // GYG tacos
  slug('chain', 'gyg-soft-taco-grilled-chicken'),
  slug('chain', 'gyg-soft-taco-ground-beef'),
  slug('chain', 'gyg-hard-taco-grilled-chicken'),
  slug('chain', 'gyg-hard-taco-ground-beef'),
  slug('chain', 'gyg-soft-tender-taco'),
  slug('chain', 'gyg-3-dollar-taco-ground-beef'),
  // GYG nachos
  slug('chain', 'gyg-nachos-ground-beef'),
  // GYG quesadillas
  slug('chain', 'gyg-quesadilla-grilled-chicken'),
  slug('chain', 'gyg-quesadilla-ground-beef'),
  // GYG sides
  slug('chain', 'gyg-fries-chipotle-medium'),
  slug('chain', 'gyg-fries-chipotle-large'),
  slug('chain', 'gyg-guacamole'),
  slug('chain', 'gyg-salad-chipotle-mayo-grilled-chicken'),
  // GYG breakfast
  slug('chain', 'gyg-breakfast-burrito-bacon'),
  slug('chain', 'gyg-breakfast-burrito-chicken-chorizo'),
  // GYG desserts
  slug('chain', 'gyg-churros-chocolate'),
  // GYG kids — Little G's
  slug('chain', 'gyg-kids-burrito-grilled-chicken'),
  slug('chain', 'gyg-kids-burrito-ground-beef'),
  slug('chain', 'gyg-kids-nachos-grilled-chicken'),
  slug('chain', 'gyg-kids-fries'),
];

export const primaryFoods: PrimaryRef[] = [
  ...slugFoods,
  ...pickedAusnutFoods,
  ...newCuratedFoods,
];
