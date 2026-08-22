const test = require("node:test");
const assert = require("node:assert/strict");
const { filterSuggestionsByPreferences } = require("./preferenceFilter");

const suggestions = (...names) => ({
  suggestions: names.map((name) => ({ name })),
  mealIdeas: [],
});

test("vegetarische voorkeur blokkeert vlees en laat groenten toe", () => {
  const result = filterSuggestionsByPreferences(
    suggestions("Kipfilet", "Courgette", "Tonijn"),
    { dietTags: ["Vegetarisch"] }
  );
  assert.deepEqual(result.suggestions.map((item) => item.name), ["Courgette"]);
});

test("melkallergie blokkeert ook samengestelde melkproducten", () => {
  const result = filterSuggestionsByPreferences(
    suggestions("Chocolademelk", "Havermout"),
    { allergens: ["Melk"] }
  );
  assert.deepEqual(result.suggestions.map((item) => item.name), ["Havermout"]);
});

test("vrije uitsluitingen worden als harde filter gebruikt", () => {
  const result = filterSuggestionsByPreferences(
    suggestions("Verse koriander", "Paprika"),
    { excludedIngredients: ["koriander"] }
  );
  assert.deepEqual(result.suggestions.map((item) => item.name), ["Paprika"]);
});
