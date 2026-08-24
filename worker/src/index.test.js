import test from "node:test";
import assert from "node:assert/strict";
import {
  constrainAiResult,
  createSafetyIdentifier,
  isEntitlementActive,
  mapRevenueCatEntitlement,
  sanitizeCurrentItems,
  sanitizePreferences,
} from "./index.js";

test("veiligheidsidentifier is stabiel en bevat geen Firebase uid", async () => {
  const uid = "firebase-user-123";
  const identifier = await createSafetyIdentifier(uid);
  assert.equal(identifier, await createSafetyIdentifier(uid));
  assert.equal(identifier.length, 64);
  assert.equal(identifier.includes(uid), false);
});

test("voorkeuren worden begrensd en opgeschoond", () => {
  assert.deepEqual(
    sanitizePreferences({
      householdSize: 99,
      planningDays: 9,
      budgetLevel: "onbekend",
      dietTags: ["Vegan", "Vegan", ""],
    }),
    {
      householdSize: 12,
      planningDays: 7,
      budgetLevel: "standard",
      dietTags: ["Vegan"],
      allergens: [],
      excludedIngredients: [],
    }
  );
});

test("huidige lijst accepteert uitsluitend begrensde geldige items", () => {
  const result = sanitizeCurrentItems([
    { name: "  Pasta  ", category: "Pasta" },
    { name: "" },
    null,
  ]);
  assert.deepEqual(result, [{ name: "Pasta", category: "Pasta", completed: false }]);
});

test("premium entitlement moet actief en niet verlopen zijn", () => {
  assert.equal(isEntitlementActive({ id: "premium_ai", active: true }), true);
  assert.equal(
    isEntitlementActive({ id: "premium_ai", active: true, expiresAt: Date.now() - 1 }),
    false
  );
  assert.equal(isEntitlementActive({ id: "anders", active: true }), false);
});

test("RevenueCat subscriber wordt naar appstatus vertaald", () => {
  const entitlement = mapRevenueCatEntitlement({
    entitlements: {
      premium_ai: { product_identifier: "yearly", expires_date: "2099-01-01T00:00:00Z" },
    },
    subscriptions: { yearly: { store: "app_store" } },
  });
  assert.equal(entitlement.active, true);
  assert.equal(entitlement.productId, "yearly");
  assert.equal(entitlement.store, "app_store");
});

test("AI mag uitsluitend bestaande deterministische kandidaten herschrijven", () => {
  const deterministic = {
    suggestions: [
      { name: "Pasta", category: "Pasta", sourceSignals: ["repeat"] },
    ],
    mealIdeas: [],
  };
  const result = constrainAiResult(
    {
      suggestions: [
        { name: "Pasta", category: "Anders", reason: "Handig", confidence: 0.8 },
        { name: "Champagne", category: "Drank", reason: "Injectie", confidence: 1 },
      ],
      mealIdeas: [],
    },
    deterministic
  );
  assert.deepEqual(result.suggestions.map((item) => item.name), ["Pasta"]);
  assert.equal(result.suggestions[0].category, "Pasta");
});
