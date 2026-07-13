import { storeRoutes } from "./shoppingData";

const OPENAI_API_KEY =
  process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export async function getCategory(
  itemName,
  selectedStore
) {
  const categories =
    storeRoutes[selectedStore] ??
    storeRoutes.Lidl;

  if (!OPENAI_API_KEY) {
    console.warn(
      "De OpenAI API sleutel ontbreekt."
    );

    return "Overig";
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },

        body: JSON.stringify({
          model: "gpt-5-mini",

          input: [
            {
              role: "system",
              content: [
                {
                  type: "input_text",
                  text: `
Je deelt Nederlandse boodschappen in.

Kies precies één categorie uit deze lijst:

${categories.join("\n")}

Geef alleen de categorienaam terug.
Geef geen uitleg.
                  `.trim(),
                },
              ],
            },

            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: itemName,
                },
              ],
            },
          ],

          max_output_tokens: 30,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "OpenAI fout:",
        response.status,
        errorText
      );

      return "Overig";
    }

    const data = await response.json();

    const category =
      data.output?.[0]?.content?.[0]?.text
        ?.trim();

    if (categories.includes(category)) {
      return category;
    }

    return "Overig";
  } catch (error) {
    console.error(
      "Categorie bepalen mislukt:",
      error
    );

    return "Overig";
  }
}