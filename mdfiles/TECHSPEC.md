# SortIt technische specificatie

## 1. Doel

SortIt is een Expo/React Native-app voor boodschappenlijsten. Producten worden per supermarkt in een bruikbare loopvolgorde gezet. Firebase is de enige online gegevensopslag.

De app heeft twee verschillende Firebase-datasets:

1. `shoppingList`: de actuele, bewerkbare toestand van de app;
2. `productArchive`: append-only historie van productacties.

## 2. Functionele scope

- Registreren, inloggen, uitloggen en wachtwoord herstellen.
- Meerdere boodschappenlijsten maken, selecteren en verwijderen.
- Producten toevoegen, categoriseren, verslepen, afvinken en verwijderen.
- Afgeronde producten of een volledige lijst opruimen.
- Een notitieblok op de plaats van de productlijst tonen.
- Personen aan categorieën koppelen.
- Een land kiezen: Nederland, België of Duitsland.
- Alleen supermarkten van het gekozen land tonen.
- Eigen supermarkten en categorievolgordes beheren.
- Offline wijzigingen lokaal in een wachtrij bewaren.
- Bij herstel van de verbinding naar Firebase synchroniseren.
- Elke productactie blijvend in Firebase archiveren.
- Optioneel de huidige voorgrondlocatie bij een productactie opslaan.

## 3. Architectuur

```mermaid
flowchart LR
    UI["Expo React Native UI"] --> LOCAL["AsyncStorage en offline wachtrij"]
    UI --> AUTH["Firebase Authentication"]
    LOCAL --> DB["Firebase Realtime Database"]
    UI --> DB
    UI --> LOC["Expo foreground location"]
    LOC --> DB
```

Er is geen tweede online datastore. Alle online app- en archiefgegevens staan in Firebase.

## 4. Belangrijkste componenten

| Bestand | Verantwoordelijkheid |
| --- | --- |
| `App.js` | Navigatie en authenticatiestatus. |
| `Pages/HomeScreen.js` | Lijsten, producten, offline wachtrij en Firebase-archief. |
| `Pages/ProfielScreen.js` | Profiel, landkeuze en locatietoestemming. |
| `Pages/CreateAccount.js` | Accountregistratie. |
| `Pages/LoginScreen.js` | Inloggen en wachtwoordherstel. |
| `dataSharing.js` | Lokale locatievoorkeur en veilige voorgrondlocatie. |
| `categoryService.js` | Lokale productcategorisatie. |
| `shoppingData.js` | Landen, supermarkten, categorieën en looproutes. |
| `firebaseConfig.js` | Firebase-clientconfiguratie. |

## 5. Firebase-datamodel

### 5.1 Hoofdstructuur

```text
users/
  {uid}/
    shoppingList/
      activeListId
      lists/
      customStores/
      people/
    productArchive/
      {eventId}/
```

### 5.2 Actueel product

Pad:

```text
users/{uid}/shoppingList/lists/{listId}/items/{itemId}
```

Voorbeeld:

```json
{
  "id": "item-1785751200000abc123",
  "name": "Melk",
  "category": "Zuivel",
  "completed": false,
  "createdAt": 1785751200000,
  "completionTime": "",
  "currentStore": "Lidl",
  "location": ""
}
```

`completionTime` is een Unix-tijd in milliseconden zodra het product is afgerond en anders een lege string. `location` is leeg of bevat:

```json
{
  "latitude": 52.090737,
  "longitude": 5.12142
}
```

### 5.3 Productarchief

Pad:

```text
users/{uid}/productArchive/{eventId}
```

Voorbeeld:

```json
{
  "userId": "firebase-user-id",
  "itemId": "item-1785751200000abc123",
  "listId": "default",
  "action": "completed",
  "name": "Melk",
  "category": "Zuivel",
  "completed": true,
  "createdAt": 1785751200000,
  "completionTime": 1785754800000,
  "currentStore": "Lidl",
  "location": {
    "latitude": 52.090737,
    "longitude": 5.12142
  },
  "archivedAt": 1785754800000
}
```

Mogelijke acties:

- `created`
- `category_changed`
- `completed`
- `reopened`
- `deleted`
- `cleared_completed`
- `list_cleared`
- `list_deleted`
- `completion_location_captured`

Een actie krijgt altijd een nieuw `eventId`. De app werkt bestaande archiefrecords niet bij en verwijdert ze niet.

## 6. Schrijfvolgorde en offline gedrag

Voor een productactie maakt de app twee wachtrijoperaties:

1. een append-only write naar `productArchive/{eventId}`;
2. de actuele wijziging onder `shoppingList`.

Het archiefrecord staat bewust eerst. Bij een verwijderactie wordt de historie daardoor opgeslagen voordat het actuele product verdwijnt.

De volledige wachtrij staat in AsyncStorage onder `SHOPPING_LISTS_PENDING_SYNC_V2`. Alleen operaties van de ingelogde gebruiker worden uitgevoerd. Na een succesvolle Firebase-write wordt uitsluitend die operatie uit de lokale wachtrij gehaald. Bij een netwerkfout blijft ze staan voor een latere retry.

Archiefoperaties worden niet over de actuele lokale lijst geprojecteerd wanneer een Firebase-snapshot binnenkomt.

## 7. Tijden

- `createdAt`: moment waarop het product is aangemaakt.
- `completionTime`: meest recente moment waarop het product werd afgerond; leeg na heropenen.
- `archivedAt`: moment waarop de archiefactie lokaal werd gemaakt.

Alle tijden zijn Unix-tijden in milliseconden. Hierdoor blijven sorteren en locale weergave eenduidig.

## 8. Winkel

`currentStore` bevat de geselecteerde winkel op het moment van de productactie. De lijst bewaart daarnaast zijn eigen `selectedStore`, zodat de UI na opnieuw openen dezelfde winkel toont.

Bij een landwijziging toont de app de bijbehorende standaardwinkels:

- Nederland: Lidl, Jumbo, Albert Heijn, Plus, Aldi en Spar.
- België: Colruyt, Delhaize, Carrefour en Aldi.
- Duitsland: Edeka, Rewe, Aldi, Lidl en Kaufland.

## 9. Locatie en toestemming

De profielschakelaar `allowProductLocation` staat standaard uit en wordt per gebruiker lokaal opgeslagen.

Wanneer de gebruiker de schakelaar aanzet:

1. vraagt de app toestemming voor locatie tijdens appgebruik;
2. verwerkt de app een afgevinkt product en de gewone Firebase-sync direct, zonder op locatie te wachten;
3. wacht de app na het laatste vinkje vijf seconden op een rustig moment;
4. gebruikt de app dan eerst een recente laatst bekende locatie;
5. vraagt de app anders een nieuwe gebalanceerde locatie op;
6. rondt de coördinaten af op zes decimalen;
7. werkt de app het actuele product bij als dezelfde afronding nog actueel is en schrijft altijd een nieuw append-only `completion_location_captured`-event voor de gevonden locatie.

Er is geen achtergrondlocatie. Bij ontbrekende toestemming, een fout of een uitgeschakelde voorkeur wordt `location` leeg opgeslagen.

Een eerdere locatietoestemming voor een ander doel wordt niet automatisch omgezet naar toestemming om coördinaten op te slaan.

## 10. Beveiligingsregels

Minimale aanbevolen Realtime Database-regels:

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

De regel voor `productArchive` staat alleen een nieuwe, niet-lege waarde toe op een nog niet bestaand eventpad. Daarmee kan de gewone app bestaande historie niet wijzigen of verwijderen.

## 11. Acceptatiecriteria

- Een nieuw product staat in de actuele lijst en als `created`-event in Firebase.
- Een afgerond product heeft `completed: true` en een gevulde `completionTime` in beide relevante records.
- Heropenen maakt `completionTime` in het actuele product leeg en schrijft een nieuw `reopened`-event.
- Categorie wijzigen schrijft het hele bijgewerkte product en een `category_changed`-event.
- Product verwijderen schrijft eerst een `deleted`-event en verwijdert daarna alleen het actuele product.
- Lijst opruimen en lijst verwijderen bewaren voor elk geraakt product een eigen event.
- `currentStore` komt overeen met de op dat moment gekozen winkel.
- Zonder locatie-opt-in is `location` leeg.
- Met toestemming bevat `location` latitude en longitude.
- Afvinken en de gewone Firebase-write wachten niet op het ophalen van locatie.
- Na offline gebruik worden alle operaties na netwerkherstel in volgorde verstuurd.
- Een bestaand archiefrecord kan via de clientregels niet worden gewijzigd of verwijderd.

## 12. Testgevallen

1. Voeg online een product toe en controleer beide Firebase-paden.
2. Voeg offline een product toe, herstel internet en controleer de schrijfvolgorde.
3. Vink een product af en controleer `completionTime`.
4. Heropen het product en controleer de lege actuele `completionTime` plus het nieuwe event.
5. Verwijder een product en controleer dat het archief blijft bestaan.
6. Verwijder een lijst met meerdere producten en controleer één event per product.
7. Weiger locatietoestemming en controleer een lege locatie.
8. Sta locatie toe en controleer coördinaten zonder achtergrondtoegang.
9. Log in met een tweede gebruiker en controleer dat accounts elkaars gegevens niet kunnen lezen.
10. Probeer een bestaand archiefrecord te overschrijven en verwacht `PERMISSION_DENIED`.
