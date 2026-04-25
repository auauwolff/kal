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

const normalize = (value: string) => value.toLowerCase();

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
  const name = normalize(`${food.brand ?? ''} ${food.name}`);
  const options: PortionOption[] = [];

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
  const options: PortionOption[] = [];

  const addUnique = (option: PortionOption) => {
    if (!Number.isFinite(option.grams) || option.grams <= 0) return;
    const roundedGrams = Math.round(option.grams);
    const key = `${option.label.toLowerCase()}-${roundedGrams}`;
    if (seen.has(key)) return;
    seen.add(key);
    options.push({ ...option, grams: roundedGrams });
  };

  for (const option of friendlyPortionOptions(food)) addUnique(option);
  for (const option of basePortionOptions(food)) addUnique(option);

  return options.slice(0, 10);
};

export const servingCaloriesForFood = (food: Doc<'foods'>): number =>
  Math.round((food.nutrientsPer100g.calories * food.defaultServingG) / 100);

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
