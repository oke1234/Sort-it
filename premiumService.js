import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import { auth } from "./firebaseConfig";

// Keep this identifier in sync with RevenueCat and the Firebase Functions backend.
// "SORTIT Pro" is the customer-facing entitlement name in the dashboard.
export const PREMIUM_ENTITLEMENT_ID = "premium_ai";
export const PREMIUM_ENTITLEMENT_NAME = "SORTIT Pro";
export const PREMIUM_PRODUCT_IDS = {
  lifetime: "lifetime",
  yearly: "yearly",
  monthly: "monthly",
};
export const PREMIUM_FALLBACK_PRICE = "Prijs in de appstore";

let purchasesConfigured = false;
let configuredUserId = null;

const getRevenueCatApiKey = () => {
  // RevenueCat Test Store keys are for development builds only.
  if (__DEV__ && process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY) {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY;
  }
  if (Platform.OS === "ios") {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "";
  }
  if (Platform.OS === "android") {
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "";
  }
  return "";
};

export const isRevenueCatConfigured = () =>
  Platform.OS !== "web" && Boolean(getRevenueCatApiKey());

export const configurePurchasesForUser = async (userId) => {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey || !userId || Platform.OS === "web") {
    return { configured: false };
  }

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.WARN);

  if (!purchasesConfigured) {
    Purchases.configure({ apiKey, appUserID: userId });
    purchasesConfigured = true;
    configuredUserId = userId;
  } else if (configuredUserId !== userId) {
    await Purchases.logIn(userId);
    configuredUserId = userId;
  }

  return { configured: true };
};

export const getCustomerInfo = async () => {
  if (!purchasesConfigured) throw new Error("revenuecat-not-configured");
  return Purchases.getCustomerInfo();
};

export const addCustomerInfoListener = (listener) => {
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
};

export const getPremiumOffering = async () => {
  if (!purchasesConfigured) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
};

export const getPremiumPackages = (offering) => {
  if (!offering) return { lifetime: null, yearly: null, monthly: null };
  const byProductId = (productId) =>
    offering.availablePackages.find(
      (item) => item.product.identifier === productId
    ) ?? null;
  return {
    lifetime: offering.lifetime ?? byProductId(PREMIUM_PRODUCT_IDS.lifetime),
    yearly: offering.annual ?? byProductId(PREMIUM_PRODUCT_IDS.yearly),
    monthly: offering.monthly ?? byProductId(PREMIUM_PRODUCT_IDS.monthly),
  };
};

export const purchasePremium = async (premiumPackage) => {
  if (!premiumPackage) throw new Error("premium-package-unavailable");
  const { customerInfo } = await Purchases.purchasePackage(premiumPackage);
  return customerInfo;
};

export const restorePremiumPurchases = () => Purchases.restorePurchases();

export const presentPremiumPaywall = async (offering) => {
  if (!purchasesConfigured) throw new Error("revenuecat-not-configured");
  const result = await RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: PREMIUM_ENTITLEMENT_ID,
    offering: offering ?? undefined,
    displayCloseButton: true,
  });
  if (result === PAYWALL_RESULT.ERROR) {
    throw new Error("paywall-presentation-failed");
  }
  return {
    result,
    changed:
      result === PAYWALL_RESULT.PURCHASED ||
      result === PAYWALL_RESULT.RESTORED,
  };
};

export const presentPremiumCustomerCenter = async () => {
  if (!purchasesConfigured) throw new Error("revenuecat-not-configured");
  await RevenueCatUI.presentCustomerCenter();
  return Purchases.getCustomerInfo();
};

export const disconnectPurchasesUser = async () => {
  if (!purchasesConfigured || !configuredUserId || Platform.OS === "web") return;
  try {
    await Purchases.logOut();
  } finally {
    configuredUserId = null;
  }
};

export const hasPremiumEntitlement = (customerInfo) =>
  Boolean(customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID]);

const getPremiumApiUrl = () =>
  String(process.env.EXPO_PUBLIC_PREMIUM_API_URL ?? "").replace(/\/$/, "");

export const isPremiumApiConfigured = () => Boolean(getPremiumApiUrl());

const callPremiumApi = async (name, data = {}) => {
  if (!auth.currentUser) throw new Error("not-authenticated");
  const apiUrl = getPremiumApiUrl();
  if (!apiUrl) throw new Error("premium-api-not-configured");
  const idToken = await auth.currentUser.getIdToken();
  const response = await fetch(`${apiUrl}/api/${encodeURIComponent(name)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data ?? {}),
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // A non-JSON upstream response is surfaced as a temporary service error.
  }
  if (!response.ok || payload?.error) {
    const error = new Error(
      payload?.error?.message ?? "De Premium-dienst is tijdelijk niet bereikbaar."
    );
    error.code = payload?.error?.code ?? `http-${response.status}`;
    throw error;
  }
  return payload?.data;
};

export const fetchPremiumState = () => callPremiumApi("getPremiumState");
export const refreshServerEntitlement = () => callPremiumApi("refreshEntitlement");
export const setPersonalizationConsent = (granted) =>
  callPremiumApi("setPersonalization", { granted });
export const savePremiumPreferences = (preferences) =>
  callPremiumApi("savePremiumPreferences", preferences);
export const rebuildCookingProfile = () => callPremiumApi("rebuildCookingProfile");
export const generatePremiumSuggestions = ({ currentItems, mode = "contextual", goal = "" }) =>
  callPremiumApi("generateSuggestions", { currentItems, mode, goal });
export const recordSuggestionFeedback = ({ suggestionSetId, suggestionId, action }) =>
  callPremiumApi("recordSuggestionFeedback", {
    suggestionSetId,
    suggestionId,
    action,
  });
export const deletePremiumCustomerData = () => callPremiumApi("deletePremiumCustomer");

export const getPremiumErrorMessage = (error) => {
  if (error?.userCancelled || error?.code === "1") return "Aankoop geannuleerd.";
  if (error?.message === "premium-package-unavailable") {
    return "Dit Premium-pakket is nog niet beschikbaar in de store.";
  }
  if (error?.message === "revenuecat-not-configured") {
    return "RevenueCat is nog niet geconfigureerd voor deze build.";
  }
  if (error?.message === "paywall-presentation-failed") {
    return "De Premium-pagina kon niet worden geopend. Probeer het opnieuw.";
  }
  if (error?.message === "premium-api-not-configured") {
    return "De beveiligde Premium-dienst is nog niet aan deze build gekoppeld.";
  }
  if (error?.message === "not-authenticated") return "Log opnieuw in om door te gaan.";
  const code = String(error?.code ?? "");
  if (code.includes("permission-denied")) return "Hiervoor heb je SortIt Premium nodig.";
  if (code.includes("resource-exhausted")) return "Je dagelijkse limiet is bereikt.";
  if (code.includes("network") || code.includes("unavailable")) {
    return "De dienst is tijdelijk niet bereikbaar. Controleer je internetverbinding.";
  }
  return "Er ging iets mis. Probeer het opnieuw.";
};
