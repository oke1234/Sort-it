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
- Optionele voorgrondlocatie bij nieuwe productacties.

## Firebase-opslag

De actuele appgegevens staan onder:

```text
users/{uid}/shoppingList
```

Elke productactie krijgt daarnaast eerst een eigen record onder:

```text
users/{uid}/productArchive/{eventId}
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
  "location": "",
  "archivedAt": 1785751200000
}
```

Als de gebruiker locatieopslag in het profiel toestaat, is `location` een object met `latitude` en `longitude`. De app vraagt alleen voorgrondlocatie op. Als toestemming uitstaat of niet beschikbaar is, blijft `location` leeg.

De app verwijdert geen records uit `productArchive`. Het verwijderen van een zichtbaar product of een zichtbare lijst maakt juist eerst een nieuw archiefrecord en verwijdert daarna alleen het actuele lijstrecord.

## Firebase instellen

1. Maak een project aan in de [Firebase Console](https://console.firebase.google.com/).
2. Schakel bij **Authentication → Sign-in method** de provider **E-mail/wachtwoord** in.
3. Maak een **Realtime Database** aan.
4. Zet de Firebase-webconfiguratie in `firebaseConfig.js`.
5. Gebruik regels die gebruikers alleen hun eigen gegevens laten lezen en schrijven en die het archief append-only houden.

Voorbeeldregels:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        "shoppingList": {
          ".write": "$uid === auth.uid"
        },
        "productArchive": {
          "$eventId": {
            ".write": "$uid === auth.uid && !data.exists() && newData.exists()"
          }
        }
      }
    }
  }
}
```

Met deze regels kan de app een bestaand archiefrecord niet wijzigen of verwijderen. Maak voor een wettelijk verwijderverzoek een afzonderlijk beheerd proces buiten de gewone appflow.

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
Pages/ProfielScreen.js Profiel, land en locatietoestemming
categoryService.js     Lokale productcategorisatie
dataSharing.js         Lokale locatievoorkeur en voorgrondlocatie
shoppingData.js        Landen, supermarkten en categorievolgordes
firebaseConfig.js      Firebase-configuratie
```

## Privacy

Productnamen, categorieën, statussen, tijden, winkelkeuze en eventueel toegestane coördinaten worden alleen binnen het Firebase-account van de ingelogde gebruiker opgeslagen. Productcategorisatie gebeurt lokaal. Zie [privacy-policy.md](privacy-policy.md) voor details.
