import type { Doc } from '../../../convex/_generated/dataModel';

export interface PortionOption {
  label: string;
  grams: number;
  helper?: string;
}

export interface ScaledNutrition {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export const SOURCE_LABELS: Record<Doc<'foods'>['source'], string> = {
  afcd: 'AFCD',
  ausnut: 'AUSNUT',
  branded_au: 'Brand',
  chain: 'Chain',
  usda: 'USDA',
  user_contributed: 'Custom',
  openfoodfacts_cache: 'Barcode',
};

const round1 = (n: number) => Math.round(n * 10) / 10;

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();

const hasAny = (value: string, terms: string[]) =>
  terms.some((term) => value.includes(term));

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b[a-z][a-z'’-]*/g, (word) =>
      word.length <= 2 && word !== 'ai'
        ? word
        : `${word[0].toUpperCase()}${word.slice(1)}`,
    )
    .replace(/\bAu\b/g, 'AU')
    .replace(/\bBbq\b/g, 'BBQ');

const compact = (value: string) => value.replace(/\s+/g, ' ').trim();

export const friendlyFoodName = (food: Pick<Doc<'foods'>, 'name'>): string => {
  const original = compact(food.name);
  const name = normalize(original).replace(/&/g, 'and');
  if (!original) return 'Food';

  if (name.includes('croissant')) {
    if (name.includes('ham') && name.includes('cheese')) {
      return 'Ham & cheese croissant';
    }
    return 'Croissant';
  }

  if (name.includes('protein')) {
    if (
      hasAny(name, [
        'shake',
        'smoothie',
        'ready to drink',
        'prepared with water',
        'drink',
        'beverage',
      ])
    ) {
      return 'Protein shake';
    }
    if (hasAny(name, ['powder', 'whey'])) return 'Protein powder';
  }

  if (
    name.includes('coffee') ||
    hasAny(name, ['latte', 'flat white', 'cappuccino', 'espresso', 'long black', 'mocha'])
  ) {
    if (hasAny(name, ['dry powder', 'granules'])) {
      return name.includes('mix') ? 'Coffee mix powder' : 'Instant coffee powder';
    }
    if (name.includes('flat white')) return 'Flat white';
    if (name.includes('cappuccino')) return 'Cappuccino';
    if (name.includes('latte')) return 'Latte';
    if (name.includes('mocha')) return 'Mocha';
    if (name.includes('long black')) return 'Long black';
    if (name.includes('espresso')) return 'Espresso';
    if (name.includes('iced')) return 'Iced coffee';
    if (name.includes('milk')) return 'Coffee with milk';
    return 'Coffee';
  }

  if (original.length <= 48) return original;

  const withoutNutritionClaims = original
    .replace(/\s*,?\s*protein\s*[><=].*$/i, '')
    .replace(/\s*,?\s*fat\s*[><=].*$/i, '')
    .replace(/\s*,?\s*carbohydrate\s*[><=].*$/i, '');
  const parts = withoutNutritionClaims
    .split(/\s*[,;]\s*/)
    .map(compact)
    .filter(Boolean);
  const usefulPart =
    parts.find(
      (part) =>
        !/^(food|foods|beverage|beverages|drink|drinks|commercial|homemade|prepared|miscellaneous)$/i.test(
          part,
        ),
    ) ?? parts[0] ?? withoutNutritionClaims;
  const shortened = usefulPart.length > 48 ? `${usefulPart.slice(0, 45).trim()}…` : usefulPart;

  return titleCase(shortened);
};

const basePortionOptions = (food: Doc<'foods'>): PortionOption[] => [
  ...food.commonPortions.map((portion) => ({
    label: portion.label,
    grams: portion.grams,
  })),
  {
    label: `${food.defaultServingG} g`,
    grams: food.defaultServingG,
    helper: 'default',
  },
  { label: '100 g', grams: 100, helper: 'weighed' },
];

const friendlyPortionOptions = (food: Doc<'foods'>): PortionOption[] => {
  const name = normalize(`${food.brand ?? ''} ${food.name}`).replace(/&/g, 'and');
  const options: PortionOption[] = [];

  const isProteinPowder =
    name.includes('protein') && hasAny(name, ['powder', 'whey']);
  const isProteinShake =
    name.includes('protein') &&
    hasAny(name, [
      'shake',
      'smoothie',
      'ready to drink',
      'prepared with water',
      'drink',
      'beverage',
    ]);

  if (isProteinShake) {
    options.push(
      { label: 'Small shake', grams: 250 },
      { label: '1 shake', grams: 330 },
      { label: 'Large shake', grams: 500 },
    );
  } else if (isProteinPowder) {
    const scoopGrams =
      food.defaultServingG >= 20 && food.defaultServingG <= 45
        ? food.defaultServingG
        : 30;
    options.push(
      { label: '1 scoop', grams: scoopGrams },
      { label: '2 scoops', grams: scoopGrams * 2 },
    );
  }

  if (
    name.includes('coffee') ||
    hasAny(name, ['latte', 'flat white', 'cappuccino', 'espresso', 'long black', 'mocha'])
  ) {
    if (hasAny(name, ['dry powder', 'granules'])) {
      options.push(
        { label: '1 tsp', grams: 2 },
        { label: '2 tsp', grams: 4 },
        { label: '1 sachet', grams: 15 },
      );
    } else {
      if (name.includes('espresso')) {
        options.push(
          { label: '1 shot', grams: 30 },
          { label: 'Double shot', grams: 60 },
        );
      }
      options.push(
        { label: 'Small', grams: 180 },
        { label: '1 cup', grams: 250 },
        { label: '1 mug', grams: 300 },
        { label: 'Large', grams: 400 },
      );
    }
  }

  if (name.includes('croissant')) {
    const croissantGrams = name.includes('ham') || name.includes('cheese') ? 120 : 70;
    options.push(
      { label: '1 croissant', grams: croissantGrams },
      { label: '2 croissants', grams: croissantGrams * 2 },
    );
  }

  if (name.includes('pizza')) {
    options.push(
      { label: '1 slice', grams: 107 },
      { label: '2 slices', grams: 214 },
      { label: '1/2 pizza', grams: 400 },
      { label: 'Whole pizza', grams: 800 },
    );
  }

  if (name.includes('bread') || name.includes('toast') || name.includes('sourdough')) {
    options.push(
      { label: '1 slice', grams: 35 },
      { label: '2 slices', grams: 70 },
    );
  }

  if (name.includes('cake') || name.includes('cheesecake') || name.includes('brownie')) {
    options.push(
      { label: 'Small slice', grams: 75 },
      { label: '1 slice', grams: 100 },
      { label: 'Large slice', grams: 150 },
    );
  }

  if (name.includes('sandwich')) {
    options.push(
      { label: '1/2 sandwich', grams: 100 },
      { label: '1 sandwich', grams: 200 },
    );
  }

  if (name.includes('burger')) {
    options.push({
      label: '1 burger',
      grams: Math.max(food.defaultServingG, 220),
    });
  }

  if (name.includes('wrap') || name.includes('burrito')) {
    options.push(
      { label: '1/2 wrap', grams: 150 },
      { label: '1 wrap', grams: 300 },
    );
  }

  if (name.includes('banana')) {
    options.push(
      { label: 'Small banana', grams: 100 },
      { label: 'Medium banana', grams: 118 },
      { label: 'Large banana', grams: 136 },
    );
  }

  if (name.includes('apple')) {
    options.push(
      { label: 'Small apple', grams: 150 },
      { label: 'Medium apple', grams: 180 },
      { label: 'Large apple', grams: 220 },
    );
  }

  if (name.includes('rice')) {
    options.push(
      { label: '1/2 cup cooked', grams: 80 },
      { label: '1 cup cooked', grams: 160 },
      { label: '2 cups cooked', grams: 320 },
    );
  }

  if (name.includes('pasta') || name.includes('spaghetti')) {
    options.push(
      { label: '1 cup cooked', grams: 140 },
      { label: '2 cups cooked', grams: 280 },
    );
  }

  return options;
};

export const portionOptionsForFood = (food: Doc<'foods'>): PortionOption[] => {
  const seen = new Set<string>();
  const seenGrams = new Set<number>();
  const options: PortionOption[] = [];

  const addUnique = (option: PortionOption) => {
    if (!Number.isFinite(option.grams) || option.grams <= 0) return;
    const roundedGrams = Math.round(option.grams);
    const key = `${option.label.toLowerCase()}-${roundedGrams}`;
    if (seen.has(key) || seenGrams.has(roundedGrams)) return;
    seen.add(key);
    seenGrams.add(roundedGrams);
    options.push({ ...option, grams: roundedGrams });
  };

  for (const option of friendlyPortionOptions(food)) addUnique(option);
  for (const option of basePortionOptions(food)) addUnique(option);

  return options.slice(0, 10);
};

export const servingCaloriesForFood = (
  food: Doc<'foods'>,
  quantityG = food.defaultServingG,
): number => Math.round((food.nutrientsPer100g.calories * quantityG) / 100);

export const scaledNutritionForQuantity = (
  food: Doc<'foods'> | null,
  quantityG: number,
): ScaledNutrition | null => {
  if (!food || quantityG <= 0) return null;

  const scale = quantityG / 100;
  return {
    calories: Math.round(food.nutrientsPer100g.calories * scale),
    proteinG: round1(food.nutrientsPer100g.proteinG * scale),
    carbsG: round1(food.nutrientsPer100g.carbsG * scale),
    fatG: round1(food.nutrientsPer100g.fatG * scale),
  };
};
