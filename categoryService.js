import {
  storeRoutes,
  categoryKeywords,
} from "./shoppingData";

const OPENAI_API_KEY =
  process.env.EXPO_PUBLIC_OPENAI_API_KEY;

function getLocalCategory(itemName, categories) {
  const normalizedItem = itemName
    .toLowerCase()
    .trim();

  for (const [
    category,
    keywords,
  ] of Object.entries(categoryKeywords)) {
    if (!categories.includes(category)) {
      continue;
    }

    const hasMatch = keywords.some((keyword) =>
      normalizedItem.includes(
        keyword.toLowerCase()
      )
    );

    if (hasMatch) {
      return category;
    }
  }

  return null;
}

export async function getCategory(
  itemName,
  selectedStore,
  { useApi = true } = {}
) {
  const categories =
    storeRoutes[selectedStore] ??
    storeRoutes.Lidl;

  const localCategory = getLocalCategory(
    itemName,
    categories
  );

  // Zonder wifi uitsluitend de lokale category-keywords gebruiken.
  if (!useApi) {
    return localCategory ?? "Overig";
  }

  if (!OPENAI_API_KEY) {
    console.warn(
      "De OpenAI API sleutel ontbreekt."
    );

    return localCategory ?? "Overig";
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        signal: controller.signal,

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },

        body: JSON.stringify({
          model: "gpt-5-mini",

          instructions: `
          Je bent een boodschappenordener voor een supermarkt.

          Jouw taak is om een boodschappenitem in te delen in de categorie waar een klant het item in de supermarkt zou vinden.

          Denk zoals een medewerker die de winkel kent.

          Voorbeelden:
          - Kipfilet → Koeling
          - Melk → Zuivel
          - Boter → Zuivel
          - Diepvriespizza → Diepvries
          - Brood → Brood
          - Appel → Groente & Fruit
          - Cola → Frisdrank
          - Chips → Chips
          - Tandpasta → Drogisterij

          Kies ALTIJD de categorie waar het product fysiek in de supermarkt ligt, niet op basis van het soort product.

          Gebruik uitsluitend één categorie uit deze lijst:

          ${categories.join("\n")}

          Regels:
          - Geef precies één categorienaam terug.
          - Gebruik exact de naam uit de lijst.
          - Geef geen uitleg, geen leestekens en geen extra tekst.
          - Weet je het niet zeker? Kies de meest logische categorie waar een klant het product zou zoeken.
          `.trim(),

          input: itemName,

          max_output_tokens: 30,
        }),
      }
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "OpenAI fout:",
        response.status,
        errorText
      );

      return localCategory ?? "Overig";
    }

    const data = await response.json();

    console.log(
      "OpenAI antwoord:",
      JSON.stringify(data, null, 2)
    );

    const message = data.output?.find(
      (outputItem) =>
        outputItem.type === "message"
    );

    const textContent =
      message?.content?.find(
        (contentItem) =>
          contentItem.type ===
          "output_text"
      );

    const category =
      textContent?.text?.trim();

    console.log(
      "Gevonden categorie:",
      category
    );

    if (categories.includes(category)) {
      return category;
    }

    return localCategory ?? "Overig";
  } catch (error) {
    console.error(
      "Categorie bepalen mislukt:",
      error
    );

    return localCategory ?? "Overig";
  } finally {
    clearTimeout(timeoutId);
  }
}
