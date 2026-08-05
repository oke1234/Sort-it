# Privacybeleid SortIt

SortIt gebruikt Firebase Authentication voor accounts en Firebase Realtime Database om appgegevens per ingelogde gebruiker op te slaan.

## Account- en lijstgegevens

SortIt verwerkt het Firebase-account-ID, de naam, het e-mailadres en de inhoud van boodschappenlijsten om accounts en opgeslagen lijsten te laten functioneren.

Voor productacties kunnen de volgende gegevens in het Firebase-account worden opgeslagen:

- Firebase-gebruikers-ID, product-ID en lijst-ID;
- soort actie, zoals aangemaakt, afgerond, heropend of verwijderd;
- productnaam en categorie;
- afrondstatus;
- aanmaakmoment, afrondmoment en archiefmoment;
- de op dat moment gekozen supermarkt;
- antwoorden op de optionele vraag of de gebruiker bij de geselecteerde winkel is;
- na een bevestigend antwoord eventueel de bevestigde winkelnaam, het leesbare adres, de bevestigingstijd en een technisch bevestigings-ID bij het actuele product en de bijbehorende producthistorie.

Productacties worden als historie bewaard, ook wanneer het zichtbare product of de zichtbare lijst later wordt verwijderd. Dit voorkomt dat normale apphandelingen de historie wissen.

## Optionele winkelherkenning

De instelling **Winkelbezoek herkennen** staat standaard uit. Bij inschakelen vraagt SortIt toestemming voor locatiegebruik terwijl de app geopend is. SortIt gebruikt geen achtergrondlocatie.

Na een productactie kan SortIt locatie lokaal gebruiken om te bepalen of binnen 150 meter en één uur al antwoord is gegeven en om een leesbaar adres te bepalen. Daarna kan de app vragen of de gebruiker bij de geselecteerde winkel is. De GPS-coördinaten blijven op het apparaat en worden niet naar Firebase gestuurd.

Na **Ja** kan Firebase de gekozen winkelnaam, het gevonden adres, het antwoord, het antwoordtijdstip, de gebruikte straal en een technisch bevestigings-ID ontvangen. De winkelnaam, het adres, de bevestigingstijd en het bevestigings-ID kunnen gedurende maximaal één uur worden gekoppeld aan producten die op precies dezelfde boodschappenlijst en bij dezelfde geselecteerde winkel worden afgevinkt. Deze gegevens worden dan zowel bij het actuele product als in de blijvende producthistorie (`productArchive`) opgeslagen. Als de bevestiging kort na het afvinken wordt gegeven, kan hiervoor een aanvullend historisch `location_attached`-record worden aangemaakt. Ook deze records bevatten geen GPS-coördinaten.

Bij **Nee** wordt geen adres aan producten of producthistorie gekoppeld en wordt geen adres als winkeladres opgeslagen.

Het uitschakelen van de instelling stopt nieuwe locatieopvragingen en verwijdert de lokale antwoordposities. Coördinaten die door een oudere appversie al in Firebase zijn opgeslagen, worden hierdoor niet automatisch verwijderd.

## Productcategorisatie

Producten worden lokaal op het apparaat ingedeeld met ingebouwde productregels. Productnamen worden hiervoor niet naar een externe AI-dienst gestuurd.

## Beveiliging en toegang

Firebase-beveiligingsregels moeten ervoor zorgen dat een ingelogde gebruiker alleen gegevens onder het eigen account-ID kan lezen en schrijven. Het productarchief hoort append-only te zijn: de app mag nieuwe records toevoegen, maar bestaande records niet wijzigen of verwijderen.

## Keuzes en verwijderverzoeken

De keuze voor winkelherkenning kan op ieder moment in het profiel worden gewijzigd. Een wettelijk verzoek om accountgegevens te bekijken of te verwijderen staat los van de normale appfunctie die historie bewaart en moet via de verantwoordelijke voor SortIt worden afgehandeld.

Dit beleid moet vóór publicatie worden aangevuld met de identiteit en contactgegevens van de verantwoordelijke, de ingangsdatum, de bewaartermijnen en een openbare contactmogelijkheid voor privacy- en verwijderverzoeken.
