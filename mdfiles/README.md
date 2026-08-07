# SortIt

SortIt is een mobiele boodschappenlijst-app die producten ordent volgens de looproute van de gekozen supermarkt.

## Belangrijkste functies

- Accounts via Firebase Authentication.
- Meerdere boodschappenlijsten met notities, personen en categorieën.
- Automatische lokale productcategorisatie.
- Supermarkten voor Nederland, België en Duitsland.
- Offline wijzigingen die bij de volgende verbinding met Firebase synchroniseren.
- Actuele lijsten in Firebase Realtime Database.
- Een blijvend productarchief per gebruiker in Firebase.
- Optionele lokale winkelherkenning met een niet-blokkerende bevestigingsvraag.

## Firebase-opslag

De actuele appgegevens staan onder:

```text
users/{uid}/shoppingList
```

Elke productactie krijgt daarnaast eerst een eigen record onder:

```text
users/{uid}/productArchive/{eventId}
```

Antwoorden op de winkelvraag staan zonder coördinaten onder:

```text
users/{uid}/storeConfirmations/{confirmationId}
```

Een archiefrecord bevat onder andere:

```json
{
  "userId": "firebase-user-id",
  "itemId": "item-id",
  "listId": "list-id",
  "action": "created",
  "name": "Melk",
  "category": "Zuivel",
  "completed": false,
  "createdAt": 1785751200000,
  "completionTime": "",
  "currentStore": "Lidl",
  "location": {
    "storeName": "Lidl",
    "address": "Voorbeeldstraat 12, 1234 AB Utrecht, Nederland",
    "confirmedAt": 1785751000000,
    "confirmationId": "store-confirmation-1785751000000abc123"
  },
  "archivedAt": 1785751200000
}
```

Als de gebruiker winkelherkenning toestaat, gebruikt de app voorgrondlocatie uitsluitend lokaal om een straal van 150 meter te herkennen en een leesbaar adres te bepalen. Firebase ontvangt de gekozen winkelnaam, alleen na **Ja** het gevonden winkeladres, het antwoord en het antwoordtijdstip. Coördinaten worden niet verstuurd.

Een bevestigde adreslocatie kan gedurende één uur worden gekoppeld aan afgevinkte producten op precies dezelfde lijst en bij dezelfde winkel. Die veilige locatie staat dan zowel bij het actuele item als in `productArchive`. Als de bevestiging vlak na het afvinken komt, schrijft de app daarvoor een extra append-only `location_attached`-event.

De app verwijdert geen records uit `productArchive`. Het verwijderen van een zichtbaar product of een zichtbare lijst maakt juist eerst een nieuw archiefrecord en verwijdert daarna alleen het actuele lijstrecord.

## Firebase instellen

1. Maak een project aan in de [Firebase Console](https://console.firebase.google.com/).
2. Schakel bij **Authentication → Sign-in method** de provider **E-mail/wachtwoord** in.
3. Maak een **Realtime Database** aan.
4. Zet de Firebase-webconfiguratie in `firebaseConfig.js`.
5. Gebruik regels die gebruikers alleen hun eigen gegevens laten lezen en schrijven en die het archief append-only houden.

Het bestand `database.rules.json` bevat de actuele regels, inclusief de gecontroleerde volledige verwijdering van `users/{uid}` na een accountverwijderingsverzoek. Publiceer deze regels met Firebase CLI of kopieer ze naar de Realtime Database-console voordat je de accountverwijderknop test.

Voorbeeldregels:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid && !newData.exists() && data.child('accountDeletionRequested').val() === true",
        "accountDeletionRequested": {
          ".write": "$uid === auth.uid && (newData.val() === true || !newData.exists())"
        },
        "shoppingList": {
          ".write": "$uid === auth.uid"
        },
        "productArchive": {
          "$eventId": {
            ".write": "$uid === auth.uid && !data.exists() && newData.exists()"
          }
        },
        "storeConfirmations": {
          "$confirmationId": {
            ".write": "$uid === auth.uid && !data.exists() && newData.exists()"
          }
        }
      }
    }
  }
}
```

Met deze regels kan de app een bestaand archiefrecord niet afzonderlijk wijzigen of verwijderen. Alleen nadat de opnieuw geauthenticeerde gebruiker `accountDeletionRequested` heeft gezet, kan de volledige gebruikersboom als onderdeel van accountverwijdering worden verwijderd.

## Lokaal starten

```bash
npm install
npm start
```

Andere opdrachten:

```bash
npm run android
npm run ios
npm run web
```

## Projectstructuur

```text
App.js                 Navigatie en inlogstatus
Pages/HomeScreen.js    Lijsten, Firebase-sync en productarchief
Pages/LoginScreen.js   Inloggen en wachtwoordherstel
Pages/CreateAccount.js Account aanmaken
Pages/ProfielScreen.js Profiel, land en toestemming voor winkelherkenning
categoryService.js     Lokale productcategorisatie
dataSharing.js         Lokale toestemming voor winkelherkenning
storePresence.js       Lokale 150-metercontrole en antwoordcache
shoppingData.js        Landen, supermarkten en categorievolgordes
firebaseConfig.js      Firebase-configuratie
```

## Privacy

Productnamen, categorieën, statussen, tijden, winkelkeuze en winkelbevestigingen worden binnen het Firebase-account van de ingelogde gebruiker opgeslagen. GPS-coördinaten voor de 150-metercontrole blijven lokaal op het apparaat. Productcategorisatie gebeurt lokaal. Zie [privacy-policy.md](privacy-policy.md) voor details.
