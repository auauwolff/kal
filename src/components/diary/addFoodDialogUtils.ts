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

const isEggFood = (value: string) => /\beggs?\b/.test(value);

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

const countPortions = (
  singular: string,
  plural: string,
  gramsEach: number,
  maxCount = 3,
): PortionOption[] =>
  Array.from({ length: maxCount }, (_, index) => {
    const count = index + 1;
    return {
      label: `${count} ${count === 1 ? singular : plural}`,
      grams: gramsEach * count,
    };
  });

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

  if (isEggFood(name)) {
    if (name.includes('benedict')) return 'Eggs benedict';
    if (name.includes('scotch')) return 'Scotch egg';
    if (hasAny(name, ['white', 'albumen'])) return 'Egg white';
    if (name.includes('yolk')) return 'Egg yolk';
    if (hasAny(name, ['hard-boiled', 'hard boiled'])) return 'Hard-boiled egg';
    if (name.includes('boiled')) return 'Boiled egg';
    if (name.includes('poached')) return 'Poached egg';
    if (name.includes('fried')) return 'Fried egg';
    if (name.includes('scrambled')) return 'Scrambled egg';
    if (hasAny(name, ['omelette', 'omelet'])) return 'Omelette';
    if (name.includes('whole')) return 'Egg';
  }

  if (name.includes('crumpet')) {
    return name.includes('wholemeal') ? 'Wholemeal crumpet' : 'Crumpet';
  }

  if (name.includes('sourdough')) return 'Sourdough bread';

  if (name.includes('bread') && !name.includes('breadcrumbs')) {
    if (name.includes('banana')) return 'Banana bread';
    if (name.includes('brioche')) return 'Brioche bread';
    if (name.includes('naan')) return 'Naan bread';
    if (name.includes('gluten free')) return 'Gluten-free bread';
    if (hasAny(name, ['mixed grain', 'multigrain'])) return 'Multigrain bread';
    if (name.includes('wholemeal')) return 'Wholemeal bread';
    if (name.includes('white')) return 'White bread';
    if (name.includes('rye')) return 'Rye bread';
    if (name.includes('spelt')) return 'Spelt bread';
    if (name.includes('roll')) return 'Bread roll';
    if (name.includes('organic')) return 'Organic bread';
  }

  if (name.includes('cheese') && !name.includes('cheese fruit')) {
    const isGratedOrShredded = hasAny(name, ['grated', 'shredded']);
    if (name.includes('cream cheese') || name.includes('cheese spread')) return 'Cream cheese';
    if (name.includes('cottage')) return 'Cottage cheese';
    if (name.includes('ricotta')) return 'Ricotta cheese';
    if (name.includes('bocconcini')) return 'Bocconcini';
    if (name.includes('brie')) return 'Brie';
    if (name.includes('camembert')) return 'Camembert';
    if (name.includes('parmesan')) {
      return isGratedOrShredded ? 'Grated parmesan' : 'Parmesan cheese';
    }
    if (name.includes('mozzarella')) {
      return isGratedOrShredded ? 'Shredded mozzarella' : 'Mozzarella cheese';
    }
    if (name.includes('cheddar')) {
      if (isGratedOrShredded) return 'Shredded cheddar cheese';
      if (name.includes('reduced fat')) return 'Reduced-fat cheddar cheese';
      return 'Cheddar cheese';
    }
    if (isGratedOrShredded) return 'Shredded cheese';
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

  if (isEggFood(name) && !hasAny(name, ['benedict', 'scotch'])) {
    if (hasAny(name, ['white', 'albumen'])) {
      options.push(...countPortions('egg white', 'egg whites', 33));
    } else if (name.includes('yolk')) {
      options.push(...countPortions('egg yolk', 'egg yolks', 17));
    } else {
      options.push(...countPortions('egg', 'eggs', 50));
    }
  }

  if (hasAny(name, ['omelette', 'omelet'])) {
    options.push(
      { label: 'Small omelette', grams: 100 },
      { label: '1 omelette', grams: 150 },
      { label: 'Large omelette', grams: 220 },
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

  if (name.includes('crumpet')) {
    options.push(...countPortions('crumpet', 'crumpets', 55));
  }

  if (
    (name.includes('bread') || name.includes('toast') || name.includes('sourdough')) &&
    !name.includes('breadcrumbs')
  ) {
    if (name.includes('naan')) {
      options.push(
        { label: '1/2 naan', grams: 65 },
        { label: '1 naan', grams: 130 },
      );
    } else if (name.includes('roll')) {
      options.push(...countPortions('roll', 'rolls', 75, 2));
    } else {
      const sliceGrams = name.includes('sourdough')
        ? 45
        : name.includes('banana')
          ? 60
          : 40;
      options.push(...countPortions('slice', 'slices', sliceGrams));
    }
  }

  if (name.includes('cheese') && !name.includes('cheese fruit')) {
    const isGratedOrShredded = hasAny(name, ['grated', 'shredded']);
    const isSoftCheese = hasAny(name, ['cottage', 'ricotta', 'cream cheese', 'cheese spread']);

    if (isGratedOrShredded) {
      options.push(
        { label: '1 tbsp', grams: name.includes('parmesan') ? 5 : 7 },
        { label: '1/4 cup', grams: 28 },
        { label: '1/2 cup', grams: 56 },
        { label: '1 portion', grams: 25 },
      );
    } else if (isSoftCheese) {
      options.push(
        { label: '1 tbsp', grams: 15 },
        { label: '2 tbsp', grams: 30 },
        { label: '1/4 cup', grams: 60 },
        { label: '1/2 cup', grams: 120 },
      );
    } else {
      options.push(
        { label: '1 slice', grams: 20 },
        { label: '2 slices', grams: 40 },
        { label: '1 portion', grams: 30 },
        { label: '2 portions', grams: 60 },
      );
    }
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

  if (name.includes('pasta') || name.includes('spaghetti') || name.includes('noodle')) {
    options.push(
      { label: '1 cup cooked', grams: 140 },
      { label: '2 cups cooked', grams: 280 },
    );
  }

  if (hasAny(name, ['oats', 'oatmeal', 'porridge', 'cereal', 'granola', 'muesli'])) {
    options.push(
      { label: '1/2 cup', grams: 40 },
      { label: '1 cup', grams: 80 },
      { label: '1 bowl', grams: 120 },
    );
  }

  if (hasAny(name, ['milk']) && !name.includes('coffee')) {
    options.push(
      { label: '1/2 cup', grams: 125 },
      { label: '1 cup', grams: 250 },
      { label: '1 glass', grams: 250 },
    );
  }

  if (hasAny(name, ['yoghurt', 'yogurt'])) {
    options.push(
      { label: 'Small tub', grams: 100 },
      { label: '1 tub', grams: 170 },
      { label: '1 cup', grams: 245 },
    );
  }

  if (
    hasAny(name, ['butter', 'margarine', 'oil']) &&
    !hasAny(name, ['peanut butter', 'almond butter'])
  ) {
    options.push(
      { label: '1 tsp', grams: 5 },
      { label: '1 tbsp', grams: 15 },
    );
  }

  if (hasAny(name, ['peanut butter', 'almond butter', 'nutella', 'jam', 'honey'])) {
    options.push(
      { label: '1 tsp', grams: 7 },
      { label: '1 tbsp', grams: 20 },
    );
  }

  if (hasAny(name, ['bacon'])) {
    options.push(...countPortions('rasher', 'rashers', 25));
  }

  if (hasAny(name, ['sausage'])) {
    options.push(...countPortions('sausage', 'sausages', 75, 2));
  }

  if (hasAny(name, ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'fish', 'salmon', 'tuna'])) {
    options.push(
      { label: 'Small portion', grams: 100 },
      { label: '1 portion', grams: 150 },
      { label: 'Large portion', grams: 200 },
    );
  }

  if (name.includes('avocado')) {
    options.push(
      { label: '1/2 avocado', grams: 75 },
      { label: '1 avocado', grams: 150 },
    );
  }

  if (name.includes('potato') && !name.includes('sweet potato')) {
    options.push(
      { label: 'Small potato', grams: 120 },
      { label: 'Medium potato', grams: 170 },
      { label: 'Large potato', grams: 250 },
    );
  }

  if (name.includes('sweet potato')) {
    options.push(
      { label: 'Small sweet potato', grams: 130 },
      { label: 'Medium sweet potato', grams: 180 },
      { label: 'Large sweet potato', grams: 250 },
    );
  }

  if (hasAny(name, ['broccoli', 'cauliflower', 'carrot', 'peas', 'beans', 'corn'])) {
    options.push(
      { label: '1/2 cup', grams: 75 },
      { label: '1 cup', grams: 150 },
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
