# SortIt koppelen aan Google Sheets

De app schrijft iedere productwijziging als een nieuwe regel naar het eerste
tabblad van de online Google Sheet. Bestaande regels worden nooit gewijzigd of
verwijderd. De zichtbare kolommen zijn `ID`, `Stores`, `Items`, `Completion`,
`Creation Time`, `Completion Time`, `Location`, `Language`, `Name` en `Email`.
Naam, e-mail en locatie blijven leeg tenzij de gebruiker ze afzonderlijk in
het profiel toestaat.

## 1. Apps Script maken

1. Open de spreadsheet en kies **Extensies > Apps Script**.
2. Verwijder de voorbeeldcode in `Code.gs`.
3. Kopieer de inhoud van `google-apps-script/Code.gs` uit dit project en plak
   die in de editor.
4. Klik op **Opslaan** en geef het project bijvoorbeeld de naam `SortIt archief`.

De code gebruikt al de juiste spreadsheet-id en zet de kolomnamen automatisch
in het eerste tabblad. Een verborgen intern tabblad voorkomt dubbele regels na
een netwerkfout.

## 2. Als web-app publiceren

1. Klik rechtsboven op **Implementeren > Nieuwe implementatie**.
2. Klik op het tandwiel bij **Type selecteren** en kies **Web-app**.
3. Kies bij **Uitvoeren als**: **Ik**.
4. Kies bij **Wie heeft toegang** de optie waarmee de mobiele app zonder een
   Google-inlogscherm kan posten (vaak **Iedereen**). Google vraagt eventueel
   eerst om toestemming om deze spreadsheet te beheren.
5. Klik op **Implementeren** en kopieer de eind-URL. Deze eindigt op `/exec`.
   Gebruik nooit de editor-URL die op `/edit` eindigt.

## 3. URL lokaal instellen

1. Maak naast `package.json` een bestand genaamd `.env` als dat nog niet bestaat.
2. Kopieer deze regel en vervang de URL door jouw gekopieerde `/exec`-URL:

   ```env
   EXPO_PUBLIC_GOOGLE_SHEETS_WEB_APP_URL=https://script.google.com/macros/s/JOUW_DEPLOYMENT_ID/exec
   ```

3. Stop Expo volledig en start opnieuw met `npm start`, zodat de omgevingswaarde
   wordt ingelezen.

## 4. Testen

1. Voeg in SortIt een product toe, bijvoorbeeld `Melk`.
2. Wacht een paar seconden en open de spreadsheet.
3. In het eerste tabblad staat een nieuwe regel met gebruiker-ID, supermarkt,
   product, completion-status, tijden, taal en de toegestane profielgegevens.

Als de app tijdelijk geen internet heeft of Google Sheets onbereikbaar is,
blijft de Firebase-actie in de bestaande synchronisatiewachtrij. De app probeert
later opnieuw. Door het unieke event-id komt een herhaalde poging niet dubbel in
de sheet.

## Belangrijk over toegang

Een Apps Script-web-app die direct vanuit een mobiele app wordt aangeroepen
moet toegankelijk zijn voor die app. Deze eenvoudige koppeling is prima voor
een persoonlijke of kleine, vertrouwde app. Voor een publieke app met veel
onbekende gebruikers is een beveiligde server tussen Firebase en Google Sheets
nodig, zodat niemand de web-app-URL kan misbruiken om regels toe te voegen.
