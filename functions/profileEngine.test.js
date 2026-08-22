const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildCookingProfile,
  generateDeterministicCandidates,
  normalizeProductName,
} = require("./profileEngine");

const NOW = Date.UTC(2026, 7, 13);
const day = (daysAgo) => NOW - daysAgo * 86400000;

test("normaliseert veilige bekende productaliassen", () => {
  assert.equal(normalizeProductName("  Spaghetti! "), "pasta");
  assert.equal(normalizeProductName("Kidney-bonen"), "kidney-bonen");
});

test("telt dubbele completion-events niet dubbel", () => {
  const event = {
    eventId: "event-1",
    itemId: "item-1",
    listId: "lijst",
    action: "completed",
    name: "Pasta",
    category: "Pasta",
    completionTime: day(2),
  };
  const profile = buildCookingProfile([event, event], NOW);
  assert.equal(profile.sampleSize, 1);
  assert.equal(profile.topProducts[0].count, 1);
});

test("berekent herhaalritme en samen-aankopen", () => {
  const archive = [21, 14, 7].flatMap((daysAgo, index) => [
    {
      eventId: `pasta-${index}`,
      itemId: `pasta-${index}`,
      listId: `list-${index}`,
      action: "completed",
      name: "Pasta",
      category: "Pasta",
      completionTime: day(daysAgo),
    },
    {
      eventId: `tomaat-${index}`,
      itemId: `tomaat-${index}`,
      listId: `list-${index}`,
      action: "completed",
      name: "Tomaten",
      category: "Groente",
      completionTime: day(daysAgo),
    },
  ]);
  const profile = buildCookingProfile(archive, NOW);
  assert.equal(profile.sufficientData, true);
  assert.equal(profile.topProducts[0].repeatEveryDays, 7);
  assert.equal(profile.coPurchases[0].count, 3);
});

test("stelt nooit een bestaand product opnieuw voor", () => {
  const result = generateDeterministicCandidates({
    profile: {
      topProducts: [
        {
          name: "Pasta",
          normalizedName: "pasta",
          category: "Pasta",
          count: 4,
          confidence: 0.8,
        },
      ],
      coPurchases: [],
    },
    currentItems: [{ name: "Spaghetti" }],
    mode: "full_list",
    now: NOW,
  });
  assert.equal(result.suggestions.some((item) => item.normalizedName === "pasta"), false);
});

test("geeft bij te weinig historie geen harde profielconclusie", () => {
  const profile = buildCookingProfile(
    [
      {
        eventId: "single",
        itemId: "single",
        listId: "list",
        action: "completed",
        name: "Melk",
        category: "Zuivel",
        completionTime: day(1),
      },
    ],
    NOW
  );
  assert.equal(profile.sufficientData, false);
  assert.match(profile.summary, /minimaal 3/i);
});
