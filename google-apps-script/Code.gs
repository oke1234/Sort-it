/**
 * SortIt Google Sheets-archief.
 *
 * Dit script schrijft uitsluitend nieuwe regels naar de spreadsheet. Het
 * past nooit een bestaande regel aan en verwijdert er nooit een.
 */
const SPREADSHEET_ID = '1BrzyJoF1YakfMzGJc3ruHGIPlopDmF-OA0skIFwbGsc';
const INTERNAL_SHEET_NAME = '_SortIt event ids';
const HEADERS = [
  'ID',
  'Stores',
  'Items',
  'Completion',
  'Creation Time',
  'Completion Time',
  'Location',
  'Language',
  'Name',
  'Email',
];

function doGet() {
  return jsonResponse({ ok: true, message: 'SortIt archief is actief.' });
}

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents || '{}');
    const records = Array.isArray(payload.records) ? payload.records : [];
    const validRecords = records.filter(isValidRecord);

    if (validRecords.length === 0) {
      return jsonResponse({ ok: false, error: 'Geen geldige regels ontvangen.' });
    }

    // Het lock voorkomt dat twee telefoons tegelijk dezelfde regel toevoegen.
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      const sheet = getDataSheet();
      const internalSheet = getInternalSheet();
      const newRecords = validRecords.filter(
        (record) => !eventExists(internalSheet, record.eventId)
      );

      if (newRecords.length > 0) {
        sheet
          .getRange(sheet.getLastRow() + 1, 1, newRecords.length, HEADERS.length)
          .setValues(newRecords.map(toRow));

        internalSheet
          .getRange(internalSheet.getLastRow() + 1, 1, newRecords.length, 1)
          .setValues(newRecords.map((record) => [record.eventId]));
      }

      return jsonResponse({ ok: true, added: newRecords.length });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: String(error.message || error) });
  }
}

function isValidRecord(record) {
  return Boolean(
      record &&
      record.eventId &&
      record.userId &&
      record.product
  );
}

function eventExists(internalSheet, eventId) {
  return Boolean(
    internalSheet
      .getRange('A:A')
      .createTextFinder(eventId)
      .matchEntireCell(true)
      .findNext()
  );
}

function toRow(record) {
  return [
    record.userId,
    record.supermarkt || 'Onbekend',
    record.product,
    Boolean(record.completed),
    record.creationTime || '',
    record.completionTime || '',
    record.location || '',
    record.language || 'nl',
    record.name || '',
    record.email || '',
  ];
}

function getDataSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheets()[0];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  } else {
    // De eerste vier kolommen blijven op dezelfde plek, zodat bestaande data
    // geldig blijft. Alleen de nieuwe kolomnamen worden rechts toegevoegd.
    sheet
      .getRange(1, 1, 1, HEADERS.length)
      .setValues([HEADERS]);
  }

  return sheet;
}

function getInternalSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(INTERNAL_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(INTERNAL_SHEET_NAME);
    sheet.appendRow(['Event ID']);
    sheet.hideSheet();
  }

  return sheet;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
