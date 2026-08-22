# Privacybeleid SortIt

**Verantwoordelijke:** Casper Rutten<br>
**Privacycontact:** ruttencasper@gmail.com<br>
**Laatst bijgewerkt:** 14 augustus 2026

SortIt gebruikt Firebase Authentication voor accounts en Firebase Realtime Database om appgegevens per ingelogde gebruiker op te slaan.

## Account- en lijstgegevens

SortIt verwerkt het Firebase-account-ID, de naam, het e-mailadres en de inhoud van boodschappenlijsten om accounts en opgeslagen lijsten te laten functioneren. Een door de gebruiker gekozen afbeelding voor een Custom-winkel wordt eveneens binnen het account opgeslagen.

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

Deze gegevens worden niet verkocht. Firebase verwerkt de online gegevens als technische dienstverlener van SortIt.

## Optionele winkelherkenning

De instelling **Winkelbezoek herkennen** staat standaard uit. Bij inschakelen vraagt SortIt toestemming voor locatiegebruik terwijl de app geopend is. SortIt gebruikt geen achtergrondlocatie.

Na een productactie kan SortIt locatie lokaal gebruiken om te bepalen of binnen 150 meter en één uur al antwoord is gegeven en om een leesbaar adres te bepalen. Daarna kan de app vragen of de gebruiker bij de geselecteerde winkel is. De GPS-coördinaten blijven op het apparaat en worden niet naar Firebase gestuurd.

Na **Ja** kan Firebase de gekozen winkelnaam, het gevonden adres, het antwoord, het antwoordtijdstip, de gebruikte straal en een technisch bevestigings-ID ontvangen. De winkelnaam, het adres, de bevestigingstijd en het bevestigings-ID kunnen gedurende maximaal één uur worden gekoppeld aan producten die op precies dezelfde boodschappenlijst en bij dezelfde geselecteerde winkel worden afgevinkt. Deze gegevens worden dan zowel bij het actuele product als in de blijvende producthistorie (`productArchive`) opgeslagen. Als de bevestiging kort na het afvinken wordt gegeven, kan hiervoor een aanvullend historisch `location_attached`-record worden aangemaakt. Ook deze records bevatten geen GPS-coördinaten.

Bij **Nee** wordt geen adres aan producten of producthistorie gekoppeld en wordt geen adres als winkeladres opgeslagen.

Het uitschakelen van de instelling stopt nieuwe locatieopvragingen en verwijdert de lokaal bewaarde antwoordposities. SortIt bewaart lokaal maximaal twintig recente antwoorden voor de herhaalcontrole. Oudere antwoorden worden bij nieuw gebruik opgeschoond. Coördinaten die door een oudere appversie al in Firebase zijn opgeslagen, worden hierdoor niet automatisch verwijderd.

## Productcategorisatie

Producten worden lokaal op het apparaat ingedeeld met ingebouwde productregels. Productnamen worden voor deze gratis categorisatiefunctie niet naar een externe AI-dienst gestuurd.

## SortIt Premium, profilering en AI

SortIt Premium is een optioneel betaald abonnement. De betaling en abonnementsstatus worden verwerkt door Apple App Store of Google Play en RevenueCat. SortIt ontvangt geen volledige betaalkaartgegevens. Voor abonnementsbeheer kunnen account-ID, product-ID, store, aankoopstatus en vervaldatum worden verwerkt.

Na afzonderlijke, intrekbare toestemming kan SortIt de eigen afgeronde producthistorie analyseren om een kook- en boodschappengedragsprofiel te maken. Dit profiel kan herhaalritmes, veelgekochte categorieën, samen gekochte producten, winkelvoorkeur en gemiddelde lijstgrootte bevatten. SortIt leidt geen gezondheid, religie, etniciteit, zwangerschap of andere gevoelige kenmerken uit aankopen af. Dieetwensen, allergieën en uitgesloten ingrediënten worden alleen gebruikt wanneer de gebruiker ze zelf invult.

Voor slimme lijstvoorstellen kan een beperkte selectie van genormaliseerde productnamen, actuele lijstproducten, geaggregeerde profielsignalen en zelf ingevulde voorkeuren via een beveiligde SortIt-server aan een AI-dienst worden verstrekt. E-mailadres, Firebase-account-ID, adressen, GPS-coördinaten en de volledige ruwe producthistorie worden niet aan het AI-model verstrekt. Modeluitvoer wordt gecontroleerd en verandert nooit automatisch een boodschappenlijst; de gebruiker kiest zelf welke suggesties worden toegevoegd.

Suggesties worden technisch maximaal dertig dagen bewaard en feedback maximaal twaalf maanden, tenzij een kortere wettelijke of operationele termijn geldt. De gebruiker kan personalisatie in Premium uitschakelen; dan worden het afgeleide profiel, suggesties en feedback verwijderd. De gewone boodschappenlijsten en bestaande producthistorie blijven behouden totdat de gebruiker het account verwijdert.

## Beveiliging en toegang

Firebase-beveiligingsregels moeten ervoor zorgen dat een ingelogde gebruiker alleen gegevens onder het eigen account-ID kan lezen en schrijven. Het productarchief hoort append-only te zijn: de app mag nieuwe records toevoegen, maar bestaande records niet wijzigen of verwijderen, behalve wanneer de gebruiker het volledige account en alle gekoppelde gegevens verwijdert.

Gegevens worden tijdens transport versleuteld. Geen enkele internetdienst kan absolute beveiliging garanderen; SortIt beperkt de opgeslagen gegevens en gebruikt accountgebonden toegangsregels.

## Bewaartermijnen

Accountgegevens, lijsten en producthistorie worden bewaard zolang het SortIt-account bestaat. Lokale voorkeuren en tijdelijke synchronisatiegegevens blijven op het apparaat totdat de gebruiker ze uitschakelt, het account verwijdert of de appgegevens wist. Na een voltooide accountverwijdering bewaart SortIt geen appinhoud uit het verwijderde account. Correspondentie over een handmatig verwijderverzoek kan maximaal dertig dagen worden bewaard om het verzoek af te handelen.

## Keuzes, inzage en verwijdering

De keuze voor winkelherkenning kan op ieder moment in het profiel worden gewijzigd. De gebruiker kan onder **Mijn profiel → Verwijder account** na bevestiging met het huidige wachtwoord het Firebase-account en alle gekoppelde lijstgegevens, producthistorie, winkelbevestigingen en Custom-winkelafbeeldingen definitief verwijderen.

Wie geen toegang meer heeft tot de app kan verwijdering aanvragen via [de openbare verwijderpagina](https://oke1234.github.io/Sort-it/delete-account.html) of via ruttencasper@gmail.com. Vermeld het e-mailadres van het SortIt-account. SortIt kan om verificatie vragen om te voorkomen dat iemand anders het account laat verwijderen. Geldige handmatige verzoeken worden binnen dertig dagen afgehandeld.

Voor vragen, inzage- of correctieverzoeken kan de gebruiker contact opnemen via ruttencasper@gmail.com.
