# SORTIT Pro: RevenueCat-configuratie en livegang

De app gebruikt Expo met `react-native-purchases` en `react-native-purchases-ui`. De
Firebase `uid` is de RevenueCat App User ID. De server vertrouwt niet alleen op de
client, maar verifieert entitlement `premium_ai` via RevenueCat en webhooks.

## 1. SDK en lokale Test Store

De packages zijn geïnstalleerd met:

```powershell
npx expo install react-native-purchases react-native-purchases-ui
```

Voor lokale development staat de aangeleverde `test_...`-sleutel in `.env.local`.
Dit bestand wordt door Git genegeerd. De code gebruikt deze sleutel uitsluitend als
`__DEV__` waar is. Stop nooit een `test_`-sleutel in een productieprofiel.

Voor een nieuwe machine:

```text
EXPO_PUBLIC_REVENUECAT_TEST_KEY=test_...
```

De relevante implementatie staat in:

- `premiumService.js`: configuratie, Offerings, purchases, CustomerInfo, Paywall en Customer Center;
- `PremiumContext.js`: app-brede status, Firebase-gebruiker en CustomerInfo-listener;
- `Pages/PremiumScreen.js`: Premium-UI, paywall, restore en beheer.

## 2. RevenueCat Test Store configureren

Ga in RevenueCat naar **Product catalog**.

1. Maak in de Test Store drie producten:
   - `lifetime`: one-time/lifetime;
   - `yearly`: subscription van één jaar;
   - `monthly`: subscription van één maand.
2. Maak één entitlement:
   - identifier: `premium_ai`;
   - zichtbare naam/omschrijving: `SORTIT Pro`.
3. Koppel alle drie producten aan `premium_ai`.
4. Maak Offering `default` en markeer die als de huidige/default Offering.
5. Voeg packages toe:
   - Lifetime (`$rc_lifetime`) → `lifetime`;
   - Annual (`$rc_annual`) → `yearly`;
   - Monthly (`$rc_monthly`) → `monthly`.
6. Maak in RevenueCat bij **Paywalls** een paywall voor Offering `default`. Kies een
   template dat drie packages ondersteunt, toon een sluitknop, restore, privacybeleid
   en voorwaarden en publiceer de paywall.

De code leest `offerings.current`; prijzen en periodes komen altijd uit de store en
worden niet hardcoded.

## 3. Customer Center

Configureer **Customer Center** in RevenueCat als gebruikers zelf aankopen moeten
kunnen herstellen, abonnementen beheren/opzeggen en supportinformatie moeten zien.
SORTIT toont Customer Center via de knop **Premium beheren** zodra Premium actief is.
Dit is nuttig voor maand- en jaarabonnementen; ook lifetime-klanten kunnen er hun
aankoopstatus en herstelopties zien.

## 4. Apple en Google voor productie

Maak dezelfde logische producten in beide stores. Product-ID's zijn:

| Product | Apple | Google | Type |
| --- | --- | --- | --- |
| Lifetime | `lifetime` | `lifetime` | non-consumable / one-time |
| Yearly | `yearly` | `yearly` | auto-renewable / subscription base plan |
| Monthly | `monthly` | `monthly` | auto-renewable / subscription base plan |

Voor Apple horen Monthly en Yearly bij dezelfde subscription group. Configureer in
Google Play de juiste subscription/base plans. Importeer daarna de storeproducten in
RevenueCat, koppel ze aan dezelfde packages en aan entitlement `premium_ai`.

Voeg de publieke productie-SDK-sleutels toe aan de EAS-buildomgeving:

```text
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_...
```

Publieke SDK-sleutels mogen in de app staan. RevenueCat secret keys en webhooksecrets
mogen dat nooit.

## 5. Firebase Functions en webhook

Zet secrets uitsluitend in Firebase Secret Manager:

```powershell
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set REVENUECAT_SECRET_KEY
firebase functions:secrets:set REVENUECAT_WEBHOOK_SECRET
```

Deploy backend en regels:

```powershell
firebase deploy --only functions,database
```

Configureer in RevenueCat een webhook naar de gedeployde HTTPS-functie
`revenueCatWebhook` met header:

```text
Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>
```

Selecteer eerst sandbox én production events tijdens het testen. De webhook schrijft
alleen events voor `premium_ai` en geïdentificeerde Firebase-gebruikers weg.

## 6. Builds en testen

Expo Go gebruikt RevenueCat Preview API Mode: de schermen en logica kunnen laden, maar
echte aankopen werken daar niet. Gebruik voor Test Store en echte storeflows een nieuwe
development build:

```powershell
eas build --profile development --platform android
eas build --profile development --platform ios
```

Test minimaal:

1. Test Store: succes, annulering en mislukte betaling voor alle drie packages;
2. Apple Sandbox en Google Play internal testing met productieplatformsleutels;
3. restore na herinstallatie;
4. opzeggen, verlopen, refund, grace period en billing issue;
5. lifetime blijft actief zonder vervaldatum;
6. uitloggen en inloggen met een andere Firebase-gebruiker;
7. gratis gebruiker kan Premium Firebase-endpoints niet rechtstreeks gebruiken;
8. Customer Center opent en synchroniseert wijzigingen;
9. webhook retry en dubbele events veroorzaken geen dubbele verwerking.

## 7. Store-review

- Toon storeprijzen, abonnementsperiode en automatische verlenging op de paywall.
- Toon herstel, privacybeleid en gebruiksvoorwaarden.
- Leg in review-notities uit waar Paywall, restore en Customer Center staan.
- Controleer dat release builds `appl_...`/`goog_...` gebruiken en nooit `test_...`.
- Gebruik een afzonderlijk OpenAI-project met budgetlimiet; de OpenAI-key blijft server-only.
