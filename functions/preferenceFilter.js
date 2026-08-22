const { normalizeProductName } = require("./profileEngine");

const ALLERGEN_TERMS = {
  pinda: ["pinda"],
  noten: ["noot", "noten", "amandel", "cashew", "hazelnoot", "walnoot", "pecan", "pistache"],
  melk: ["melk", "kaas", "yoghurt", "room", "boter", "lactose"],
  ei: ["ei", "eier"],
  gluten: ["tarwe", "brood", "pasta", "couscous", "noedel", "bloem"],
  soja: ["soja", "tofu", "tempeh"],
  vis: ["vis", "zalm", "tonijn", "kabeljauw", "makreel"],
  schaaldieren: ["garnaal", "krab", "kreeft", "scampi"],
};

const DIET_TERMS = {
  vegetarisch: ["kip", "vlees", "gehakt", "worst", "ham", "bacon", "spek", "vis", "zalm", "tonijn"],
  vegan: [
    "kip", "vlees", "gehakt", "worst", "ham", "bacon", "spek", "vis", "zalm", "tonijn",
    "melk", "kaas", "yoghurt", "room", "boter", "ei", "eier", "honing",
  ],
  halal: ["varken", "ham", "bacon", "spek"],
  glutenvrij: ["tarwe", "brood", "pasta", "couscous", "noedel", "bloem"],
  lactosevrij: ["melk", "kaas", "yoghurt", "room", "boter", "lactose"],
};

const matchesTerm = (name, term) => {
  if (!term) return false;
  if (term.length <= 3) {
    return name.split(/[\s-]+/).includes(term) || name.startsWith(term);
  }
  return name.includes(term);
};

const createPreferenceExclusion = (preferences = {}) => {
  const terms = new Set(
    (preferences.allergens ?? []).flatMap((value) => {
      const normalized = normalizeProductName(value);
      return ALLERGEN_TERMS[normalized] ?? [normalized];
    })
  );
  for (const diet of preferences.dietTags ?? []) {
    const key = normalizeProductName(diet).replace(/\s/g, "");
    for (const term of DIET_TERMS[key] ?? []) terms.add(term);
  }
  for (const ingredient of preferences.excludedIngredients ?? []) {
    terms.add(normalizeProductName(ingredient));
  }

  return (value) => {
    const name = normalizeProductName(value);
    return [...terms].some((term) => matchesTerm(name, term));
  };
};

const filterSuggestionsByPreferences = (result, preferences) => {
  const isExcluded = createPreferenceExclusion(preferences);
  return {
    suggestions: (result.suggestions ?? []).filter(
      (item) => !isExcluded(item.name)
    ),
    mealIdeas: (result.mealIdeas ?? [])
      .map((idea) => ({
        ...idea,
        missingProducts: (idea.missingProducts ?? []).filter(
          (item) => !isExcluded(item)
        ),
      }))
      .filter((idea) => !idea.usesExisting?.some(isExcluded)),
  };
};

module.exports = {
  createPreferenceExclusion,
  filterSuggestionsByPreferences,
};
