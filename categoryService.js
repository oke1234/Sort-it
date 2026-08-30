import {
  storeRoutes,
  categoryKeywords,
} from "./shoppingData";

const ROUTE_CATEGORY_ALIASES = {
  Drinken: ["Dranken"],
  "Pasta en rijst": ["Pasta, rijst en conserven"],
  Conserven: ["Pasta, rijst en conserven"],
};

const STRONG_CATEGORY_HINTS = [
  {
    category: "Diepvries",
    phrases: ["diepvries", "bevroren", "vriesvers", "uit de vriezer"],
  },
  {
    category: "Conserven",
    phrases: ["in blik", "uit blik", "conservenblik"],
  },
];

export const normalizeCategoryInput = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("nl")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const resolveRouteCategory = (category, categories) => {
  if (categories.includes(category)) return category;
  return (ROUTE_CATEGORY_ALIASES[category] ?? []).find((alias) =>
    categories.includes(alias)
  ) ?? null;
};

const containsPhrase = (normalizedItem, phrase) =>
  ` ${normalizedItem} `.includes(` ${normalizeCategoryInput(phrase)} `);

const getKeywordScore = (normalizedItem, tokens, keyword) => {
  const normalizedKeyword = normalizeCategoryInput(keyword);
  if (!normalizedKeyword) return 0;
  if (normalizedItem === normalizedKeyword) return 200 + normalizedKeyword.length;

  if (normalizedKeyword.includes(" ")) {
    return containsPhrase(normalizedItem, normalizedKeyword)
      ? 120 + normalizedKeyword.length
      : 0;
  }

  if (tokens.includes(normalizedKeyword)) return 100 + normalizedKeyword.length;

  // Lange woorden mogen onderdeel zijn van een samenstelling, zoals
  // volkorenbrood of kipfilet. Korte termen zoals "ui" en "ei" niet:
  // die veroorzaakten eerder matches in fruit en eiersalade.
  if (
    normalizedKeyword.length >= 4 &&
    tokens.some((token) => token.includes(normalizedKeyword))
  ) {
    return 30 + normalizedKeyword.length;
  }

  return 0;
};

export const getLocalCategory = (itemName, categories) => {
  const normalizedItem = normalizeCategoryInput(itemName);
  if (!normalizedItem) return null;

  for (const hint of STRONG_CATEGORY_HINTS) {
    const routeCategory = resolveRouteCategory(hint.category, categories);
    if (
      routeCategory &&
      hint.phrases.some((phrase) => containsPhrase(normalizedItem, phrase))
    ) {
      return routeCategory;
    }
  }

  const tokens = normalizedItem.split(" ");
  let bestMatch = null;

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    const routeCategory = resolveRouteCategory(category, categories);
    if (!routeCategory) continue;

    const score = keywords.reduce(
      (highest, keyword) =>
        Math.max(highest, getKeywordScore(normalizedItem, tokens, keyword)),
      0
    );

    if (score > (bestMatch?.score ?? 0)) {
      bestMatch = { category: routeCategory, score };
    }
  }

  return bestMatch?.category ?? null;
};

export const getCategory = async (
  itemName,
  selectedStore,
  { categories: providedCategories } = {}
) => {
  const categories =
    Array.isArray(providedCategories) &&
    providedCategories.length > 0
      ? providedCategories
      : storeRoutes[selectedStore] ?? storeRoutes.Lidl;

  return getLocalCategory(itemName, categories) ?? "Overig";
};
