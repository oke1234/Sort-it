import {
  storeRoutes,
  categoryKeywords,
} from "./shoppingData";

const getLocalCategory = (itemName, categories) => {
  const normalizedItem = itemName.toLowerCase().trim();

  for (const [category, keywords] of Object.entries(
    categoryKeywords
  )) {
    if (!categories.includes(category)) continue;

    const hasMatch = keywords.some((keyword) =>
      normalizedItem.includes(keyword.toLowerCase())
    );

    if (hasMatch) return category;
  }

  return null;
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
