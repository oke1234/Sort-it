# Google Play Store metadata-preview — SortIt

> Concept voor de Nederlandse Play Store-vermelding. Velden met `NOG INVULLEN` moeten vóór publicatie worden afgerond.

## Preview van de store-vermelding

### SortIt

**Categorie:** Winkelen  
**Leeftijdsclassificatie:** Iedereen (verwacht; definitief na de vragenlijst)  
**Prijs:** Gratis

**Korte beschrijving** *(maximaal 80 tekens)*

> Slim boodschappen doen met lijsten op winkelroute, categorieën en offline sync.

**Volledige beschrijving** *(maximaal 4.000 tekens)*

> Maak boodschappen doen overzichtelijker met SortIt. De app deelt producten automatisch in categorieën in en zet deze in de volgorde van de gekozen supermarkt. Zo loop je logisch door de winkel en hoef je minder heen en weer.
>
> MEER OVERZICHT IN DE WINKEL
>
> Voeg je boodschappen toe en SortIt kiest lokaal de passende categorie. Je lijst volgt de winkelroute van bekende supermarkten in Nederland, België en Duitsland. Je kunt ook een eigen winkel maken en zelf de volgorde van de categorieën bepalen.
>
> ALLES VOOR JOUW BOODSCHAPPENLIJST
>
> - Maak en beheer meerdere boodschappenlijsten
> - Orden producten automatisch per categorie
> - Kies per lijst een supermarkt
> - Maak een eigen winkelroute
> - Voeg notities aan een lijst toe
> - Wijs categorieën toe aan personen
> - Sleep producten naar een andere categorie
> - Vink boodschappen eenvoudig af
> - Gebruik je lijsten ook tijdelijk zonder internet
>
> VEILIG GESYNCHRONISEERD
>
> Met een account worden je actuele lijsten via Firebase opgeslagen. Wijzigingen die je zonder internet maakt, worden gesynchroniseerd zodra de verbinding terug is.
>
> OPTIONELE WINKELHERKENNING
>
> Als je deze functie zelf inschakelt, kan SortIt na een productactie vragen of je bij de gekozen winkel bent. GPS-coördinaten blijven op je apparaat. Alleen na jouw bevestiging kan een leesbaar winkeladres aan relevante boodschappen en de producthistorie worden gekoppeld.
>
> SortIt houdt boodschappen doen eenvoudig: één duidelijke lijst, in een logische volgorde.

## Algemene metadata

| Veld | Waarde |
|---|---|
| App-naam | SortIt |
| Package name | `com.casper.sortit` |
| Versie | `1.0.0` |
| Version code | `1` |
| Primaire taal | Nederlands (`nl-NL`) |
| Voorgestelde categorie | Winkelen |
| Bevat advertenties | Nee |
| Primaire doelgroep | Algemene gebruikers |

## Contact en beleid

| Veld | Waarde |
|---|---|
| Contactnaam | NOG INVULLEN |
| Support-e-mail | NOG INVULLEN |
| Website | NOG INVULLEN |
| Privacybeleid-URL | NOG INVULLEN — moet een openbare URL zijn |
| Accountverwijdering-URL | NOG INVULLEN — verplicht wegens accountregistratie |

De accountverwijderingspagina moet SortIt of de ontwikkelaarsnaam noemen, duidelijk uitleggen hoe een verwijderverzoek wordt ingediend en vermelden welke accountgegevens worden verwijderd of eventueel tijdelijk worden bewaard.

## Data safety — voorgestelde antwoorden

### Data collection and security

| Vraag | Antwoord |
|---|---|
| Verzamelt of deelt de app vereiste gebruikersgegevens? | Ja |
| Zijn alle verzamelde gegevens versleuteld tijdens transport? | Ja |
| Methode voor accountaanmaak | Username and password |
| Verwijdering van sommige of alle gegevens zonder accountverwijdering | Nee |
| Onafhankelijke beveiligingsreview | Niet selecteren |
| UPI payments verified | Niet selecteren |

### Te declareren gegevenstypen

Deze lijst is een invulvoorstel en moet bij iedere release opnieuw met de app en gebruikte SDK's worden gecontroleerd.

| Gegevenstype | Verzameld | Gedeeld | Doel |
|---|---:|---:|---|
| Naam | Ja | Nee | Accountbeheer en appfunctionaliteit |
| E-mailadres | Ja | Nee | Accountbeheer en authenticatie |
| Gebruikers-ID | Ja | Nee | Accountbeheer en synchronisatie |
| Precieze locatie | Nee naar Firebase; alleen lokale verwerking | Nee | Optionele winkelherkenning |
| Benaderde locatie | Nee naar Firebase; alleen lokale verwerking | Nee | Optionele winkelherkenning |
| Adres/winkelgegevens na bevestiging | Ja, optioneel | Nee | Appfunctionaliteit en producthistorie |
| Door gebruikers ingevoerde boodschappen en notities | Ja | Nee | Appfunctionaliteit en synchronisatie |
| Door gebruikers gekozen winkelafbeelding | Ja, wanneer gebruikt | Nee | Eigen winkel instellen |

Firebase verwerkt gegevens als dienstverlener voor SortIt. Dit is normaal gesproken geen “delen” binnen de Data safety-definitie, mits het gebruik onder de toepasselijke uitzondering voor dienstverleners valt.

## Grafische materialen

| Onderdeel | Status | Benodigd |
|---|---|---|
| App-icoon | Aanwezig in `assets/icon.png` | Controleer 512 × 512 px en maximaal 1 MB |
| Functieafbeelding | NOG MAKEN | 1024 × 500 px, PNG of JPEG |
| Telefoonscreenshots | NOG MAKEN | Minimaal 2; bij voorkeur 4–8 |
| 7-inch tabletscreenshots | NOG MAKEN | Alleen indien tabletweergave wordt gepubliceerd |
| 10-inch tabletscreenshots | NOG MAKEN | Alleen indien tabletweergave wordt gepubliceerd |

### Voorgestelde screenshotvolgorde

1. Boodschappen automatisch geordend volgens de winkelroute.
2. Meerdere lijsten met een eigen supermarkt en notitie.
3. Categorieën aan personen toewijzen.
4. Een eigen winkel en categorievolgorde maken.
5. Offline wijzigingen later automatisch synchroniseren.
6. Optionele winkelherkenning met duidelijke privacykeuze.

## Openstaande publicatiepunten

- Voeg een werkende accountverwijderingsfunctie of duidelijke verwijderroute in de app toe.
- Publiceer een externe accountverwijderingspagina en vul de URL in.
- Publiceer het privacybeleid op een openbare, niet-bewerkbare webpagina.
- Vul ontwikkelaarsnaam, support-e-mailadres, ingangsdatum en bewaartermijnen in.
- Controleer de Data safety-antwoorden ook tegen de definitieve Firebase-configuratie en alle SDK's in de releasebuild.
- Maak de functieafbeelding en screenshots zonder tijdelijke of testgegevens.
