# Specificatie: winkelbevestiging zonder coördinaten in Firebase

## 1. Doel

SortIt gebruikt locatie uitsluitend om op het apparaat te bepalen of opnieuw vragen zinvol is. Firebase ontvangt geen GPS-coördinaten. Na een productactie kan de gebruiker bevestigen of die bij de geselecteerde winkel is, zonder vertraging bij toevoegen, afvinken of heropenen.

## 2. Gebruikerservaring

Bij het toevoegen, afvinken of heropenen van een product:

1. werkt de app de interface onmiddellijk bij;
2. zet de app de productwijziging onmiddellijk in de Firebase-wachtrij;
3. start of herstart alleen een lokale rusttimer van vijf seconden;
4. voert de app pas na die rustperiode een locatiecontrole uit;
5. toont de app, indien nodig, een niet-blokkerende vraag: **Ben je nu bij [geselecteerde winkel]?**

De vraag verschijnt als een kleine banner met **Ja** en **Nee**. Het is geen modal en de boodschappenlijst blijft bruikbaar.

## 3. Toestemming en privacy

- De functie staat standaard uit.
- De gebruiker schakelt **Winkelbezoek herkennen** in het profiel in.
- Alleen voorgrondlocatie wordt gevraagd.
- De app gebruikt geen achtergrondlocatie.
- Coördinaten worden alleen lokaal in AsyncStorage bewaard.
- Coördinaten komen niet in `shoppingList`, `productArchive` of `storeConfirmations` terecht.
- De eerdere toestemming om coördinaten naar Firebase te sturen wordt niet automatisch hergebruikt.
- Bij uitschakelen verwijdert de app de lokaal opgeslagen winkelposities en antwoordgeschiedenis.

## 4. Geselecteerde winkel

De app gebruikt de winkel die al voor de actieve boodschappenlijst is geselecteerd. Er is daarom geen externe Places-API nodig.

Voorbeeld:

- geselecteerde winkel: `Lidl`;
- getoonde vraag: `Ben je nu bij Lidl?`.

De locatie bepaalt dus niet automatisch de winkelnaam. De gebruiker bevestigt of de gekozen winkel klopt.

## 5. Rustperiode en prioriteit

De locatiecontrole start vijf seconden na de laatste relevante productactie. Iedere nieuwe toevoeging, afvinking of heropening binnen die vijf seconden start de timer opnieuw.

Productacties bevatten geen `await` op:

- locatietoestemming;
- AsyncStorage voor winkelherkenning;
- `getLastKnownPositionAsync()`;
- `getCurrentPositionAsync()`;
- het antwoord op de winkelvraag.

Hierdoor kunnen locatie en de winkelvraag de productinterface en de gewone Firebase-sync niet blokkeren.

## 6. Locatiecontrole

Na de rustperiode:

1. controleert de app of de gebruiker toestemming heeft gegeven;
2. probeert de app een locatie van maximaal vijf minuten oud en maximaal 150 meter onnauwkeurig te gebruiken;
3. vraagt de app alleen bij ontbreken daarvan een nieuwe locatie met gebalanceerde nauwkeurigheid;
4. start de app maximaal één actieve GPS-aanvraag per gebruiker per uur;
5. draait er nooit meer dan één actieve GPS-aanvraag tegelijk voor dezelfde gebruiker.

Een reeds gestarte `getCurrentPositionAsync()` kan door Expo niet werkelijk worden geannuleerd. Een nieuwere productactie maakt het oude UI-resultaat daarom ongeldig, maar de productactie zelf blijft direct werken.

## 7. Straal en herhaalonderdrukking

Na een antwoord bewaart de app lokaal:

```json
{
  "storeName": "Lidl",
  "latitude": 52.123456,
  "longitude": 4.123456,
  "answeredAt": 1785840000000,
  "confirmed": true
}
```

Deze coördinaten zijn uitsluitend lokaal en worden gebruikt om afstand te berekenen.

Dezelfde vraag wordt gedurende één uur niet opnieuw getoond wanneer:

- de geselecteerde winkel hetzelfde is; en
- de gebruiker maximaal 150 meter van de eerder beantwoorde positie is.

Dit geldt voor zowel **Ja** als **Nee**, zodat de app niet blijft vragen wanneer de gebruiker door de supermarkt loopt of bij de winkel in de buurt blijft.

## 8. Firebase-gegevens

Een antwoord wordt append-only opgeslagen onder:

```text
users/{uid}/storeConfirmations/{confirmationId}
```

Voorbeeld:

```json
{
  "userId": "firebase-user-id",
  "confirmationId": "store-confirmation-...",
  "storeName": "Lidl",
  "storeAddress": "Voorbeeldstraat 12, 1234 AB Utrecht, Nederland",
  "confirmed": true,
  "answeredAt": 1785840000000,
  "radiusMeters": 150
}
```

Firebase ontvangt alleen:

- de gekozen winkelnaam;
- het via lokale omgekeerde geocodering gevonden adres, maar alleen na een bevestiging met **Ja**;
- het antwoord `true` of `false`;
- het tijdstip van antwoorden;
- de gebruikte lokale herhaalstraal;
- technische identificatievelden.

Firebase ontvangt geen latitude of longitude. Bij **Nee** of wanneer geen adres beschikbaar is, blijft `storeAddress` leeg.

## 9. Offline gedrag

- Productwijzigingen blijven de bestaande offline wachtrij gebruiken.
- Winkelantwoorden krijgen een eigen wachtrijoperatie en blokkeren productwijzigingen niet.
- Bij herstel van internet worden antwoorden naar `storeConfirmations` gestuurd.
- Een winkelantwoord wordt maar één keer geschreven en niet later aangepast.

## 10. Locatie bij afgevinkte producten

- Na **Ja** is het bevestigde adres één uur geldig voor dezelfde lijst en winkel.
- Een binnen dat uur afgevinkt product krijgt een veilig `location`-object in het actuele item en het append-only archief.
- Volgt de bevestiging na het afvinken, dan worden passende items uit het voorafgaande uur gekoppeld met een nieuw `location_attached`-event.
- `location` bevat alleen `storeName`, `address`, `confirmedAt` en `confirmationId`; latitude en longitude blijven lokaal.
- Oude lokale wachtrij- en itemlocaties worden vóór synchronisatie naar deze veilige vorm gesanitized of verwijderd.
- Historische coördinaten die al in een append-only Firebase-archief staan, vereisen een afzonderlijke beheerdersmigratie als ze verwijderd moeten worden.

## 11. Aanbevolen Firebase-regels

```json
{
  "rules": {
    "users": {
      "$uid": {
        "storeConfirmations": {
          ".read": "$uid === auth.uid",
          "$confirmationId": {
            ".write": "$uid === auth.uid && !data.exists() && newData.exists()"
          }
        }
      }
    }
  }
}
```

## 12. Acceptatiecriteria

- Toevoegen, afvinken en heropenen wachten nooit op locatie.
- De gewone Firebase-productwrite start vóór de locatiecontrole.
- De winkelvraag is niet-blokkerend.
- De vraag gebruikt de geselecteerde winkelnaam.
- Binnen 150 meter en één uur wordt dezelfde vraag niet herhaald.
- Er start maximaal één actieve GPS-fix per uur.
- Firebase bevat geen nieuwe GPS-coördinaten.
- Zowel bevestigingen als afwijzingen worden zonder coördinaten opgeslagen.
- Uitschakelen van de functie verwijdert lokale winkelpositiegegevens.
