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
- locatiecoördinaten, maar alleen als de gebruiker dit afzonderlijk toestaat.

Productacties worden als historie bewaard, ook wanneer het zichtbare product of de zichtbare lijst later wordt verwijderd. Dit voorkomt dat normale apphandelingen de historie wissen.

## Optionele locatie

De instelling **Locatie bij product opslaan** staat standaard uit. Bij inschakelen vraagt SortIt toestemming voor locatiegebruik terwijl de app geopend is. SortIt gebruikt geen achtergrondlocatie.

Na toestemming kan de huidige breedte- en lengtegraad bij nieuwe productacties in Firebase worden opgeslagen. Als de instelling uitstaat, toestemming ontbreekt of geen locatie beschikbaar is, wordt een lege locatiewaarde opgeslagen.

Het uitschakelen van de instelling stopt nieuwe locatieopvragingen. Eerder met toestemming opgeslagen archiefgegevens worden daardoor niet automatisch verwijderd.

## Productcategorisatie

Producten worden lokaal op het apparaat ingedeeld met ingebouwde productregels. Productnamen worden hiervoor niet naar een externe AI-dienst gestuurd.

## Beveiliging en toegang

Firebase-beveiligingsregels moeten ervoor zorgen dat een ingelogde gebruiker alleen gegevens onder het eigen account-ID kan lezen en schrijven. Het productarchief hoort append-only te zijn: de app mag nieuwe records toevoegen, maar bestaande records niet wijzigen of verwijderen.

## Keuzes en verwijderverzoeken

De locatiekeuze kan op ieder moment in het profiel worden gewijzigd. Een wettelijk verzoek om accountgegevens te bekijken of te verwijderen staat los van de normale appfunctie die historie bewaart en moet via de verantwoordelijke voor SortIt worden afgehandeld.

Dit beleid moet vóór publicatie worden aangevuld met de identiteit en contactgegevens van de verantwoordelijke, de ingangsdatum, de bewaartermijnen en een openbare contactmogelijkheid voor privacy- en verwijderverzoeken.
