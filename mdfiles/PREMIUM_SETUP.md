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
   - `yearly_3999`: subscription van één jaar voor USD 39.99;
   - `monthly_399`: subscription van één maand voor USD 3.99.
2. Maak één entitlement:
   - identifier: `premium_ai`;
   - zichtbare naam/omschrijving: `SORTIT Pro`.
3. Koppel alle drie producten aan `premium_ai`.
4. Maak Offering `default` en markeer die als de huidige/default Offering.
5. Voeg packages toe:
   - Lifetime (`$rc_lifetime`) → `lifetime`;
   - Annual (`$rc_annual`) → `yearly_3999`;
   - Monthly (`$rc_monthly`) → `monthly_399`.
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

| Product | Apple | Google | Europrijs | Type |
| --- | --- | --- | --- | --- |
| Lifetime | `lifetime` | `lifetime` | € 99,99 | non-consumable / one-time |
| Yearly | `yearly` | `yearly` | € 39,99 | auto-renewable / subscription base plan |
| Monthly | `monthly` | `monthly` | € 3,99 | auto-renewable / subscription base plan |

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

Voor de Apple-koppeling in RevenueCat is daarnaast een App Store Connect In-App
Purchase-sleutel (`SubscriptionKey_*.p8`) nodig. Alleen een Account Holder of Admin
met de juiste toegang kan deze sleutel aanmaken. Voor echte Google Play-verkopen moet
eerst een Google Payments/merchant-profiel aan de Play Console-account zijn gekoppeld;
pas daarna kunnen de subscriptions, base plans en eenmalige aankoop worden aangemaakt.

## 5. Cloudflare Worker Free en webhook

De betaalde Firebase Functions-laag wordt niet gebruikt. Firebase blijft op Spark
voor Authentication en Realtime Database. De beveiligde Premium-API draait als
Cloudflare Worker met D1-opslag in `worker/`.

De app stuurt voor iedere API-aanroep het Firebase ID-token. De Worker valideert dit
token bij Firebase, leest de boodschappenhistorie uitsluitend met de rechten van die
gebruiker en bewaart Premiumstatus, toestemming, profielen en feedback in D1.

Zet secrets uitsluitend als versleutelde Cloudflare Worker-secrets:

```powershell
cd worker
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put REVENUECAT_SECRET_KEY
npx wrangler secret put REVENUECAT_WEBHOOK_SECRET
```

Maak D1 aan, vul de echte `database_id` in `worker/wrangler.jsonc` in en deploy:

```powershell
npx wrangler d1 create sortit-premium
npx wrangler d1 migrations apply sortit-premium --remote
npx wrangler deploy
```

Zet de gedeployde basis-URL in EAS development en production als:

```text
EXPO_PUBLIC_PREMIUM_API_URL=https://sortit-premium-api.<account>.workers.dev
```

Configureer in RevenueCat een webhook naar:

```text
https://sortit-premium-api.<account>.workers.dev/webhooks/revenuecat
```

met header:

```text
Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>
```

Selecteer eerst sandbox én production events tijdens het testen. De webhook verwerkt
alleen events voor `premium_ai` en geïdentificeerde Firebase-gebruikers. De oude code
in `functions/` blijft alleen als referentie en voor de bestaande domeintests; hij staat
niet meer in `firebase.json` en wordt niet gedeployd.

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
- Gebruik een afzonderlijk OpenAI-project met budgetlimiet; de OpenAI-key blijft als
  Cloudflare-secret server-only.
