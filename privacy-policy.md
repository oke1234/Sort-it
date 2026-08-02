# Privacybeleid SortIt

SortIt gebruikt Firebase Authentication voor het account en Firebase Realtime
Database voor boodschappenlijsten. Productacties kunnen daarnaast worden
opgeslagen in het ingestelde Google Sheets-archief. Zo'n archiefregel bevat de
Firebase-gebruiker-ID, supermarkt, productnaam, completion-status, creation
time, completion time en de gebruikte app-taal.

## Optionele persoonsgegevens

In het profiel staan afzonderlijke schakelaars voor het delen van naam,
e-mailadres en locatie. Deze staan standaard uit en worden per account op het
apparaat bewaard.

- Naam wordt alleen toegevoegd aan nieuwe sheetregels als **Naam toestaan**
  aanstaat.
- E-mailadres wordt alleen toegevoegd als **E-mail toestaan** aanstaat.
- Locatie wordt alleen opgevraagd en toegevoegd als **Locatie toestaan**
  aanstaat en de gebruiker ook de systeemtoestemming voor foreground-locatie
  heeft gegeven. Er wordt geen achtergrondlocatie gevolgd.

Een schakelaar uitschakelen stopt het toevoegen van die gegevens aan nieuwe
regels. Omdat het Google Sheets-archief append-only is, worden eerder opgeslagen
regels niet automatisch verwijderd.

## AI-categorisatie

Als optionele AI-categorisatie is ingeschakeld, kan de ingevoerde productnaam
naar de OpenAI API worden gestuurd om een winkelcategorie te bepalen.

## Beheer

De gebruiker kan de toestemming voor naam, e-mail en locatie op ieder moment in
het profiel wijzigen. Systeemtoestemming voor locatie kan daarnaast via de
instellingen van het apparaat worden ingetrokken. Toegang tot en bewaring van
de Google Sheet worden beheerd door de eigenaar van het gekoppelde Google-account.
