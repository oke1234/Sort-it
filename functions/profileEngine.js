const PROFILE_WINDOW_MS = 12 * 7 * 24 * 60 * 60 * 1000;

const PRODUCT_ALIASES = new Map([
  ["spaghetti", "pasta"],
  ["penne", "pasta"],
  ["macaroni", "pasta"],
  ["tomaten", "tomaat"],
  ["aardappelen", "aardappel"],
  ["bananen", "banaan"],
  ["appels", "appel"],
  ["eieren", "ei"],
]);

const normalizeProductName = (value) => {
  const normalized = String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("nl")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

  return PRODUCT_ALIASES.get(normalized) ?? normalized;
};

const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};

const round = (value, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const toEventArray = (archive) =>
  Array.isArray(archive)
    ? archive.filter(Boolean)
    : Object.entries(archive ?? {}).map(([eventId, event]) => ({
        eventId,
        ...event,
      }));

const dedupeCompletedEvents = (archive, now = Date.now()) => {
  const start = now - PROFILE_WINDOW_MS;
  const seenEvents = new Set();
  const seenCompletions = new Set();

  return toEventArray(archive)
    .filter((event) => {
      const occurredAt = Number(
        event.completionTime || event.archivedAt || event.createdAt
      );
      if (
        event.action !== "completed" ||
        !event.name ||
        !Number.isFinite(occurredAt) ||
        occurredAt < start ||
        occurredAt > now
      ) {
        return false;
      }

      const eventKey = String(event.eventId ?? "");
      if (eventKey && seenEvents.has(eventKey)) return false;
      if (eventKey) seenEvents.add(eventKey);

      const lifecycleKey = [
        event.itemId ?? normalizeProductName(event.name),
        event.listId ?? "",
        occurredAt,
      ].join(":");
      if (seenCompletions.has(lifecycleKey)) return false;
      seenCompletions.add(lifecycleKey);
      return true;
    })
    .map((event) => ({
      name: String(event.name).trim().slice(0, 80),
      normalizedName: normalizeProductName(event.name),
      category: String(event.category || "Overig").slice(0, 50),
      store: String(event.currentStore || "").slice(0, 80),
      listId: String(event.listId || "onbekend").slice(0, 100),
      occurredAt: Number(
        event.completionTime || event.archivedAt || event.createdAt
      ),
    }))
    .filter((event) => event.normalizedName);
};

const buildCookingProfile = (archive, now = Date.now()) => {
  const events = dedupeCompletedEvents(archive, now);
  const productStats = new Map();
  const categoryCounts = new Map();
  const storeCounts = new Map();
  const listProducts = new Map();

  for (const event of events) {
    const existing = productStats.get(event.normalizedName) ?? {
      name: event.name,
      normalizedName: event.normalizedName,
      category: event.category,
      count: 0,
      timestamps: [],
    };
    existing.count += 1;
    existing.timestamps.push(event.occurredAt);
    productStats.set(event.normalizedName, existing);
    categoryCounts.set(
      event.category,
      (categoryCounts.get(event.category) ?? 0) + 1
    );
    if (event.store) {
      storeCounts.set(event.store, (storeCounts.get(event.store) ?? 0) + 1);
    }
    const bucket = `${event.listId}:${new Date(event.occurredAt)
      .toISOString()
      .slice(0, 10)}`;
    const names = listProducts.get(bucket) ?? new Set();
    names.add(event.normalizedName);
    listProducts.set(bucket, names);
  }

  const topProducts = [...productStats.values()]
    .map((product) => {
      const sortedTimes = [...product.timestamps].sort((a, b) => a - b);
      const intervals = sortedTimes.slice(1).map((time, index) =>
        round((time - sortedTimes[index]) / 86400000, 1)
      );
      const repeatEveryDays = median(intervals);
      const lastPurchasedAt = sortedTimes.at(-1) ?? null;
      return {
        name: product.name,
        normalizedName: product.normalizedName,
        category: product.category,
        count: product.count,
        repeatEveryDays:
          repeatEveryDays == null ? null : round(repeatEveryDays, 1),
        lastPurchasedAt,
        nextExpectedAt:
          repeatEveryDays == null
            ? null
            : Math.round(lastPurchasedAt + repeatEveryDays * 86400000),
        confidence: round(Math.min(0.95, 0.25 + product.count * 0.12)),
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "nl"))
    .slice(0, 20);

  const topCategories = [...categoryCounts.entries()]
    .map(([name, count]) => ({
      name,
      count,
      share: events.length ? round(count / events.length) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const pairCounts = new Map();
  for (const names of listProducts.values()) {
    const sorted = [...names].sort();
    for (let left = 0; left < sorted.length; left += 1) {
      for (let right = left + 1; right < sorted.length; right += 1) {
        const key = `${sorted[left]}|${sorted[right]}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }

  const coPurchases = [...pairCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([key, count]) => ({ products: key.split("|"), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const favoriteStore = [...storeCounts.entries()].sort(
    (a, b) => b[1] - a[1]
  )[0];
  const observedLists = new Set(events.map((event) => event.listId)).size;
  const averageListSize = observedLists
    ? round(events.length / observedLists, 1)
    : 0;

  return {
    version: now,
    sourceWindowStart: now - PROFILE_WINDOW_MS,
    sourceWindowEnd: now,
    generatedAt: now,
    sampleSize: events.length,
    sufficientData: events.length >= 3,
    summary:
      events.length >= 3
        ? `Gebaseerd op ${events.length} afgeronde producten in de afgelopen 12 weken.`
        : "Vink minimaal 3 producten af om een betrouwbaar kookprofiel op te bouwen.",
    topProducts,
    topCategories,
    coPurchases,
    favoriteStore: favoriteStore
      ? { name: favoriteStore[0], count: favoriteStore[1] }
      : null,
    averageListSize,
  };
};

const RECIPE_PATTERNS = [
  {
    title: "Pasta met groenten",
    matches: ["pasta", "tomaat"],
    additions: ["courgette", "parmezaanse kaas"],
  },
  {
    title: "Groentetaco's",
    matches: ["tortilla", "paprika"],
    additions: ["kidneybonen", "mais"],
  },
  {
    title: "Rijstgerecht",
    matches: ["rijst"],
    additions: ["broccoli", "sojasaus"],
  },
  {
    title: "Ontbijt met yoghurt",
    matches: ["yoghurt"],
    additions: ["banaan", "havermout"],
  },
];

const generateDeterministicCandidates = ({
  profile,
  currentItems = [],
  mode = "contextual",
  now = Date.now(),
}) => {
  const existing = new Set(
    currentItems.map((item) => normalizeProductName(item?.name ?? item))
  );
  const candidates = [];
  const addCandidate = (candidate) => {
    const normalizedName = normalizeProductName(candidate.name);
    if (!normalizedName || existing.has(normalizedName)) return;
    if (candidates.some((item) => item.normalizedName === normalizedName)) return;
    candidates.push({ ...candidate, normalizedName });
  };

  for (const product of profile?.topProducts ?? []) {
    const due = product.nextExpectedAt && product.nextExpectedAt <= now + 2 * 86400000;
    if (mode === "full_list" ? product.count >= 2 : due) {
      addCandidate({
        name: product.name,
        category: product.category || "Overig",
        reason: due
          ? `Je koopt dit meestal elke ${Math.max(
              1,
              Math.round(product.repeatEveryDays)
            )} dagen.`
          : `Dit is een van je meest gekozen producten (${product.count} keer).`,
        confidence: product.confidence,
        sourceSignals: [due ? "recurrence_due" : "frequent_product"],
      });
    }
  }

  for (const pair of profile?.coPurchases ?? []) {
    const [left, right] = pair.products;
    if (existing.has(left) && !existing.has(right)) {
      addCandidate({
        name: right,
        category: "Overig",
        reason: `Je koos dit eerder vaak samen met ${left}.`,
        confidence: Math.min(0.9, 0.45 + pair.count * 0.08),
        sourceSignals: ["co_purchase"],
      });
    } else if (existing.has(right) && !existing.has(left)) {
      addCandidate({
        name: left,
        category: "Overig",
        reason: `Je koos dit eerder vaak samen met ${right}.`,
        confidence: Math.min(0.9, 0.45 + pair.count * 0.08),
        sourceSignals: ["co_purchase"],
      });
    }
  }

  const mealIdeas = [];
  for (const recipe of RECIPE_PATTERNS) {
    const matched = recipe.matches.filter((name) => existing.has(name));
    if (!matched.length) continue;
    const missingProducts = recipe.additions.filter((name) => !existing.has(name));
    missingProducts.forEach((name) =>
      addCandidate({
        name,
        category: "Overig",
        reason: `Past bij het maaltijdidee ${recipe.title}.`,
        confidence: 0.62,
        sourceSignals: ["meal_pattern"],
      })
    );
    mealIdeas.push({
      title: recipe.title,
      usesExisting: matched,
      missingProducts,
      reason: `Gebruikt ${matched.length} product${matched.length === 1 ? "" : "en"} van je lijst.`,
    });
  }

  return {
    suggestions: candidates.slice(0, mode === "full_list" ? 12 : 5),
    mealIdeas: mealIdeas.slice(0, 3),
  };
};

module.exports = {
  PROFILE_WINDOW_MS,
  buildCookingProfile,
  dedupeCompletedEvents,
  generateDeterministicCandidates,
  normalizeProductName,
};
