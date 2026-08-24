import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth } from "./firebaseConfig";
import {
  addCustomerInfoListener,
  configurePurchasesForUser,
  disconnectPurchasesUser,
  fetchPremiumState,
  getCustomerInfo,
  getPremiumOffering,
  getPremiumPackages,
  hasPremiumEntitlement,
  isRevenueCatConfigured,
  presentPremiumCustomerCenter,
  presentPremiumPaywall,
  purchasePremium,
  refreshServerEntitlement,
  restorePremiumPurchases,
} from "./premiumService";

const DEFAULT_PREFERENCES = {
  householdSize: 1,
  planningDays: 7,
  budgetLevel: "standard",
  dietTags: [],
  allergens: [],
  excludedIngredients: [],
};

const PremiumContext = createContext(null);

export function PremiumProvider({ user, children }) {
  const [state, setState] = useState({
    loading: true,
    premiumActive: false,
    entitlement: null,
    consent: { granted: false },
    preferences: DEFAULT_PREFERENCES,
    profile: null,
  });
  const [offering, setOffering] = useState(null);
  const [storeReady, setStoreReady] = useState(false);

  const applyState = useCallback((next) => {
    setState((current) => ({
      ...current,
      ...next,
      preferences: next?.preferences ?? current.preferences ?? DEFAULT_PREFERENCES,
      consent: next?.consent ?? current.consent ?? { granted: false },
      loading: false,
    }));
  }, []);

  const reload = useCallback(async () => {
    if (!auth.currentUser) return null;
    const next = await fetchPremiumState();
    applyState(next);
    return next;
  }, [applyState]);

  useEffect(() => {
    if (!user?.uid) {
      disconnectPurchasesUser().catch(() => null);
      setState({
        loading: false,
        premiumActive: false,
        entitlement: null,
        consent: { granted: false },
        preferences: DEFAULT_PREFERENCES,
        profile: null,
      });
      setOffering(null);
      setStoreReady(false);
      return undefined;
    }

    let active = true;
    let stopCustomerInfo = () => {};
    setState((current) => ({ ...current, loading: true }));

    const initialize = async () => {
      try {
        const configured = await configurePurchasesForUser(user.uid);
        if (!active) return;
        setStoreReady(configured.configured);
        if (configured.configured) {
          const [premiumOffering, customerInfo] = await Promise.all([
            getPremiumOffering(),
            getCustomerInfo(),
          ]);
          if (!active) return;
          setOffering(premiumOffering);
          const premiumActive = hasPremiumEntitlement(customerInfo);
          applyState({
            customerInfo,
            premiumActive,
          });
          if (premiumActive) {
            await refreshServerEntitlement().then(applyState).catch((error) =>
              console.warn("Premiumstatus synchroniseren mislukt:", error)
            );
          }
          const handleCustomerInfo = (nextCustomerInfo) => {
            if (!active) return;
            applyState({
              customerInfo: nextCustomerInfo,
              premiumActive: hasPremiumEntitlement(nextCustomerInfo),
            });
            refreshServerEntitlement()
              .then((next) => active && applyState(next))
              .catch((error) =>
                console.warn("Premiumstatus synchroniseren mislukt:", error)
              );
          };
          stopCustomerInfo = addCustomerInfoListener(handleCustomerInfo);
        }
      } catch (error) {
        console.warn("RevenueCat initialiseren mislukt:", error);
      }

      try {
        await reload();
      } catch (error) {
        console.warn("Premiumstatus ophalen mislukt:", error);
        if (active) setState((current) => ({ ...current, loading: false }));
      }
    };

    initialize();

    return () => {
      active = false;
      stopCustomerInfo();
    };
  }, [applyState, reload, user?.uid]);

  const packages = useMemo(() => getPremiumPackages(offering), [offering]);

  const syncPurchase = useCallback(async (customerInfo) => {
    if (hasPremiumEntitlement(customerInfo)) {
      await refreshServerEntitlement();
      return reload();
    }
    return null;
  }, [reload]);

  const buy = useCallback(async (packageType = "monthly") => {
    const customerInfo = await purchasePremium(packages[packageType]);
    return syncPurchase(customerInfo);
  }, [packages, syncPurchase]);

  const restore = useCallback(async () => {
    const customerInfo = await restorePremiumPurchases();
    await syncPurchase(customerInfo);
    return customerInfo;
  }, [syncPurchase]);

  const showPaywall = useCallback(async () => {
    const outcome = await presentPremiumPaywall(offering);
    if (outcome.changed) {
      await syncPurchase(await getCustomerInfo());
    }
    return outcome;
  }, [offering, syncPurchase]);

  const openCustomerCenter = useCallback(async () => {
    const customerInfo = await presentPremiumCustomerCenter();
    await syncPurchase(customerInfo);
    return customerInfo;
  }, [syncPurchase]);

  const value = useMemo(
    () => ({
      ...state,
      offering,
      packages,
      storeReady,
      storeConfigured: isRevenueCatConfigured(),
      displayPrice: packages.monthly?.product?.priceString ?? "Prijs in de appstore",
      buy,
      restore,
      showPaywall,
      openCustomerCenter,
      reload,
    }),
    [buy, offering, openCustomerCenter, packages, reload, restore, showPaywall, state, storeReady]
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export const usePremium = () => {
  const value = useContext(PremiumContext);
  if (!value) throw new Error("usePremium moet binnen PremiumProvider worden gebruikt.");
  return value;
};
