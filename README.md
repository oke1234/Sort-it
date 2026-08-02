# SortIt

SortIt is een mobiele boodschappenlijst-app die producten ordent in de logische looproute van jouw supermarkt. Voeg producten toe, vink ze af en houd je lijst overzichtelijk terwijl je winkelt.

## Wat kan de app?

- Account aanmaken en inloggen met e-mailadres en wachtwoord.
- Wachtwoord vergeten: vanuit het inlogscherm wordt een veilige resetlink per e-mail verstuurd.
- Producten toevoegen, afvinken en verwijderde/afgeronde producten opruimen.
- Producten automatisch in een supermarkt-categorie plaatsen.
  - Eerst gebeurt dit lokaal op basis van bekende productnamen.
  - Als er geen lokale match is, kan de app optioneel OpenAI gebruiken als categorisatiehulp.
- Producten handmatig naar een andere categorie slepen.
- De categorievolgorde aanpassen aan de gekozen supermarkt.
- Keuze uit Lidl, Jumbo, Albert Heijn, Plus, Aldi en Spar.
- De boodschappenlijst veilig per ingelogde gebruiker opslaan in Firebase Realtime Database.
- Geselecteerde supermarkt en lokale lijstgegevens bewaren op het toestel met AsyncStorage.
- Elke productwijziging die naar Firebase gaat ook opslaan in een online,
  append-only Google Sheet met gebruiker-ID, supermarkt, productnaam,
  completion-status, tijden en taal. Naam, e-mail en locatie worden uitsluitend
  toegevoegd na afzonderlijke toestemming in het profiel.
- Profiel beheren: naam wijzigen, e-mailadres wijzigen via een bevestigingslink en een wachtwoord-resetlink aanvragen.
- Uitloggen.

## Techniek

- Expo / React Native
- React Navigation
- Firebase Authentication
- Firebase Realtime Database
- AsyncStorage
- Optioneel: OpenAI Responses API voor productcategorisatie

## Lokaal starten

1. Installeer [Node.js](https://nodejs.org/).
2. Installeer de packages:

   ```bash
   npm install
   ```

3. Start de ontwikkelserver:

   ```bash
   npm start
   ```

4. Open de app met Expo Go, een Android-emulator of een iOS-simulator.

Handige opdrachten:

```bash
npm run android
npm run ios
npm run web
```

## Firebase instellen

De app verwacht een Firebase-project. Vul de gegevens van je eigen project in in `firebaseConfig.js`.

1. Maak een project aan in de [Firebase Console](https://console.firebase.google.com/).
2. Zet bij **Authentication → Sign-in method** de provider **E-mail/wachtwoord** aan.
3. Maak een **Realtime Database** aan en stel de passende beveiligingsregels in.
4. Kopieer de webconfiguratie van Firebase naar `firebaseConfig.js`.
5. Controleer bij **Authentication → Templates** de e-mails voor wachtwoordherstel en e-mailadreswijzigingen.

### Account-e-mails

Firebase verstuurt de links voor wachtwoordherstel en e-mailadreswijzigingen. In **Authentication → Templates** kun je de afzendernaam, onderwerpregel en tekst aanpassen. Laat in een template altijd `%LINK%` staan; Firebase vervangt dit door de persoonlijke, eenmalige beveiligde link.

## Optionele AI-categorisatie

Zonder API-sleutel categoriseert SortIt bekende producten lokaal. Onbekende producten komen dan in **Overig** terecht.

Voor de optionele AI-terugval maak je lokaal een `.env`-bestand aan:

```env
EXPO_PUBLIC_OPENAI_API_KEY=jouw_api_sleutel
```

> Let op: variabelen met `EXPO_PUBLIC_` worden opgenomen in de app en zijn dus niet geheim. Gebruik voor een productie-app geen geheime OpenAI-sleutel rechtstreeks in de mobiele client; laat zulke verzoeken via een eigen beveiligde server lopen.

## Google Sheets-archief

Volg de complete stappen in [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md).
De app voegt iedere regel alleen toe; bestaande regels worden nooit gewijzigd
of verwijderd.

## Projectstructuur

```text
App.js                 Navigatie en inlogstatus
Pages/
  HomeScreen.js        Boodschappenlijst, categorieën en supermarktkeuze
  LoginScreen.js       Inloggen en wachtwoord vergeten
  CreateAccount.js     Account aanmaken
  ProfielScreen.js     Profiel- en accountbeheer
categoryService.js     Lokale en optionele AI-categorisatie
shoppingData.js        Supermarkten, looproutes en categorieën
firebaseConfig.js      Firebase-configuratie
```

## Privacy en gegevens

De app gebruikt Firebase Authentication voor accounts en Firebase Realtime
Database voor boodschappenlijsten. Productacties worden append-only opgeslagen
in de ingestelde Google Sheet. De app-taal wordt daarbij opgeslagen. Naam,
e-mail en foreground-locatie worden alleen aan nieuwe regels toegevoegd als de
gebruiker iedere gegevenssoort afzonderlijk in het profiel toestaat. Als
AI-categorisatie is ingeschakeld, wordt de ingevoerde productnaam naar de
OpenAI API gestuurd om een categorie te bepalen.
