const GOOGLE_SHEETS_WEB_APP_URL =
  process.env.EXPO_PUBLIC_GOOGLE_SHEETS_WEB_APP_URL;

export const appendToGoogleSheetsArchive = async (records) => {
  if (!records?.length) return;

  if (!GOOGLE_SHEETS_WEB_APP_URL) {
    throw new Error(
      "EXPO_PUBLIC_GOOGLE_SHEETS_WEB_APP_URL ontbreekt."
    );
  }

  const response = await fetch(
    GOOGLE_SHEETS_WEB_APP_URL,
    {
      method: "POST",
      // text/plain voorkomt een onnodige browser-preflight en Apps Script
      // leest de JSON alsnog via event.postData.contents.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ records }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Google Sheets-archief gaf HTTP ${response.status}.`
    );
  }

  const result = await response.json();

  if (!result?.ok) {
    throw new Error(
      result?.error ?? "Google Sheets-archief kon niet schrijven."
    );
  }
};
