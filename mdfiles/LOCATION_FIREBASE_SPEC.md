# Specificatie: snelle productacties met locatie en Firebase

## 1. Doel

Toevoegen, afvinken en opnieuw openen mogen nooit wachten op GPS. Locatie blijft optioneel beschikbaar voor Firebase-data, met maximaal één nieuwe locatiebepaling per uur.

## 2. Locatietoestemming

- De app vraagt alleen toestemming wanneer de gebruiker **Locatie bij product opslaan** inschakelt.
- Er verschijnt geen locatievraag tijdens het toevoegen of afvinken.
- Alleen voorgrondlocatie wordt gebruikt.
- Bij uitschakelen worden de lokale locatiecache en geplande locatieverzoeken verwijderd.

## 3. Locatiecache

Per gebruiker bewaart de app lokaal:

```json
{
  "latitude": 52.123456,
  "longitude": 4.123456,
  "accuracyMeters": 120,
  "capturedAt": 1785840000000
}
```

Regels:

- De cache is maximaal 60 minuten geldig.
- Alle productacties binnen dat uur gebruiken dezelfde locatie.
- De cache wordt zowel in het geheugen als in AsyncStorage bewaard.
- De cache is gekoppeld aan de ingelogde gebruiker.
- Locaties met een slechte nauwkeurigheid, bijvoorbeeld meer dan 1.000 meter, worden niet gebruikt.

## 4. Verwerking van productacties

Bij toevoegen, afvinken of heropenen:

1. De gebruikersinterface wordt onmiddellijk bijgewerkt.
2. De actuele productwijziging gaat onmiddellijk naar de Firebase-wachtrij.
3. De app controleert de locatiecache zonder GPS te starten.
4. Bij een geldige cache wordt deze locatie aan het archiefrecord toegevoegd.
5. Zonder geldige cache wordt het archiefrecord lokaal bewaard met status `waiting_for_location`.
6. De productactie is hiermee klaar; nergens wordt op locatie gewacht.

## 5. Nieuwe locatie ophalen

Wanneer een nieuwe locatie nodig is:

1. De app wacht vijf seconden na de laatste productactie.
2. Iedere nieuwe actie binnen die periode start de vijf seconden opnieuw.
3. Alle wachtende acties worden in één groep verzameld.
4. De app probeert eerst een geschikte laatst bekende locatie te gebruiken.
5. Alleen als die ontbreekt, wordt één nieuwe GPS-locatie met gebalanceerde nauwkeurigheid aangevraagd.
6. Het resultaat wordt maximaal één uur gecachet en aan alle wachtende archiefrecords toegevoegd.

Er mag nooit meer dan één locatieaanvraag tegelijk lopen.

## 6. Actie tijdens een lopende locatieaanvraag

Als de gebruiker tijdens een GPS-aanvraag iets toevoegt of afvinkt:

- De productactie blijft onmiddellijk werken.
- De GPS-aanvraag wordt niet opnieuw gestart.
- Expo kan een actieve `getCurrentPositionAsync()` niet echt annuleren.
- De nieuwe productactie wordt toegevoegd aan dezelfde wachtende groep.
- Zodra GPS klaar is, ontvangen alle relevante acties dezelfde locatie.

De GPS-aanvraag mag dus doorgaan, maar wordt nergens met `await` gekoppeld aan een productactie.

## 7. Firebase-wachtrij

De wachtrij krijgt twee soorten operaties:

- `shoppingList`: hoge prioriteit en direct synchroniseren.
- `productArchive`: normale prioriteit en eventueel kort wachten op locatie.

Een archiefoperatie met `waiting_for_location` mag andere Firebase-operaties niet blokkeren. De synchronisatie moet wachtende locatie-operaties kunnen overslaan.

Na een succesvolle locatiebepaling wordt het archiefrecord volledig en éénmalig geschreven. Daardoor blijven de bestaande append-only Firebase-regels geldig.

## 8. Firebase-locatiegegevens

Aanbevolen locatieobject:

```json
{
  "latitude": 52.123456,
  "longitude": 4.123456,
  "accuracyMeters": 120,
  "capturedAt": 1785840000000,
  "source": "cached"
}
```

`source` is:

- `cached`: locatie was al lokaal beschikbaar.
- `fresh`: locatie is na de productactie opgehaald.
- `last_known`: Expo leverde een geschikte laatst bekende positie.

Wanneer geen locatie beschikbaar is:

```json
{
  "location": "",
  "locationStatus": "unavailable"
}
```

## 9. Maximale wachttijd en fouten

- Een locatiepoging krijgt logisch maximaal ongeveer 15–20 seconden.
- Bij een fout wordt het archiefrecord zonder locatie vrijgegeven voor synchronisatie.
- Een GPS-fout mag Firebase nooit blokkeren.
- Een eventueel later GPS-resultaat mag alleen voor toekomstige acties worden gecachet.
- Bij uitloggen, wisselen van gebruiker of intrekken van toestemming worden late resultaten genegeerd.

## 10. Bescherming tegen verouderde updates

Iedere productactie krijgt een uniek `eventId` of `lastActionId`.

Een later gevonden locatie mag het actuele product alleen bijwerken wanneer dat product nog dezelfde actie vertegenwoordigt. Daardoor kan een late locatie:

- een verwijderd product niet terugmaken;
- een heropend product niet opnieuw afvinken;
- een nieuwere locatie of actie niet overschrijven.

Het append-only archiefrecord van de oorspronkelijke actie blijft wel behouden.

## 11. Acceptatiecriteria

- Toevoegen, afvinken en heropenen bevatten geen `await` op locatie.
- Het vinkje verandert onmiddellijk, ook met slechte GPS.
- Tien snelle acties veroorzaken maximaal één locatieaanvraag.
- Acties binnen 60 minuten starten geen nieuwe GPS-aanvraag.
- Na 60 minuten start GPS pas na vijf seconden rust.
- Een productactie tijdens GPS blijft direct reageren.
- Een GPS-fout blokkeert de Firebase-wachtrij niet.
- Offline acties en wachtende locatiegegevens blijven lokaal bewaard.
- Productarchiefrecords worden maar één keer naar Firebase geschreven.
- Uitschakelen van locatietoestemming stopt nieuwe locatieverzameling.

## 12. Samenvatting

De aanbevolen oplossing combineert een locatiecache van één uur, een rustperiode van vijf seconden, één gedeelde locatieaanvraag en een Firebase-wachtrij waarin actuele productupdates altijd voorrang hebben.
