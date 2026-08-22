import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

import { usePremium } from "../PremiumContext";
import {
  getPremiumErrorMessage,
  rebuildCookingProfile,
  savePremiumPreferences,
  setPersonalizationConsent,
} from "../premiumService";

const COLORS = {
  background: "#F4F6F2",
  surface: "#FFFFFF",
  surfaceSoft: "#F8FAF7",
  primary: "#2E7D4F",
  primaryDark: "#1F5E39",
  primarySoft: "#E7F3EB",
  text: "#18201B",
  textSoft: "#68736C",
  border: "#E5EAE6",
  gold: "#D89A27",
  goldSoft: "#FFF5DD",
  danger: "#D94A4A",
};

const DIET_OPTIONS = ["Vegetarisch", "Vegan", "Halal", "Glutenvrij", "Lactosevrij"];
const ALLERGEN_OPTIONS = ["Pinda", "Noten", "Melk", "Ei", "Gluten", "Soja", "Vis", "Schaaldieren"];
const PRIVACY_POLICY_URL = "https://oke1234.github.io/Sort-it/privacy-policy.html";
const TERMS_URL = "https://oke1234.github.io/Sort-it/terms.html";

const toggleValue = (values, value) =>
  values.includes(value)
    ? values.filter((current) => current !== value)
    : [...values, value];

const formatDate = (timestamp) => {
  if (!Number(timestamp)) return "";
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Number(timestamp)));
};

function OptionChips({ values, selected, onToggle, disabled }) {
  return (
    <View style={styles.chips}>
      {values.map((value) => {
        const active = selected.includes(value);
        return (
          <TouchableOpacity
            key={value}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onToggle(value)}
            disabled={disabled}
            activeOpacity={0.76}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: active, disabled }}
          >
            {active && <Ionicons name="checkmark" size={14} color={COLORS.primaryDark} />}
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {value}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function PremiumScreen({ navigation }) {
  const premium = usePremium();
  const [busyAction, setBusyAction] = useState("");
  const [preferences, setPreferences] = useState(premium.preferences);
  const [excludedText, setExcludedText] = useState(
    (premium.preferences?.excludedIngredients ?? []).join(", ")
  );

  useEffect(() => {
    setPreferences(premium.preferences);
    setExcludedText((premium.preferences?.excludedIngredients ?? []).join(", "));
  }, [premium.preferences]);

  const subscriptionStatus = useMemo(() => {
    if (!premium.premiumActive) return "Gratis versie";
    const endDate = formatDate(premium.entitlement?.expiresAt);
    if (!endDate) return "Premium actief";
    return premium.entitlement?.willRenew
      ? `Wordt verlengd op ${endDate}`
      : `Actief tot ${endDate}`;
  }, [premium.entitlement, premium.premiumActive]);

  const runAction = async (action, task, successMessage) => {
    setBusyAction(action);
    try {
      await task();
      await premium.reload().catch(() => null);
      if (successMessage) Alert.alert("Gelukt", successMessage);
    } catch (error) {
      const message = getPremiumErrorMessage(error);
      if (message !== "Aankoop geannuleerd.") Alert.alert("Niet gelukt", message);
    } finally {
      setBusyAction("");
    }
  };

  const handleConsent = (granted) => {
    if (!granted) {
      Alert.alert(
        "Personalisatie uitschakelen?",
        "Je afgeleide kookprofiel, suggesties en feedback worden verwijderd. Je gewone lijsten en producthistorie blijven behouden.",
        [
          { text: "Annuleren", style: "cancel" },
          {
            text: "Uitschakelen",
            style: "destructive",
            onPress: () =>
              runAction("consent", () => setPersonalizationConsent(false)),
          },
        ]
      );
      return;
    }
    runAction(
      "consent",
      async () => {
        await setPersonalizationConsent(true);
        await rebuildCookingProfile();
      },
      "Je kookprofiel is opgebouwd uit je eigen afgeronde boodschappen."
    );
  };

  const savePreferences = () => {
    const excludedIngredients = excludedText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    runAction(
      "preferences",
      () =>
        savePremiumPreferences({
          ...preferences,
          excludedIngredients,
        }),
      "Je voorkeuren zijn opgeslagen."
    );
  };

  const profile = premium.profile;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Terug"
          >
            <Ionicons name="arrow-back" size={26} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.premiumBadge}>
            <Ionicons name="sparkles" size={14} color="#FFFFFF" />
            <Text style={styles.premiumBadgeText}>SORTIT PREMIUM</Text>
          </View>
          <Text style={styles.title}>Slimmer boodschappen doen</Text>
          <Text style={styles.subtitle}>
            Een persoonlijk kookprofiel, slimme lijstvoorstellen en passende aanvullingen tijdens het maken van je lijst.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="diamond-outline" size={30} color={COLORS.gold} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{subscriptionStatus}</Text>
            <Text style={styles.heroPrice}>
              {premium.displayPrice} <Text style={styles.heroPeriod}>per maand</Text>
            </Text>
          </View>
          {premium.premiumActive && (
            <Ionicons name="checkmark-circle" size={27} color={COLORS.primary} />
          )}
        </View>

        {!premium.premiumActive ? (
          <View style={styles.card}>
            {[
              ["analytics-outline", "Jouw kookgedragsprofiel", "Gebaseerd op producten die jij zelf hebt afgevinkt."],
              ["basket-outline", "Complete lijstvoorstellen", "Terugkerende producten en passende maaltijdideeën."],
              ["sparkles-outline", "Slimme aanvullingen", "Maximaal vijf relevante ideeën bij je huidige lijst."],
            ].map(([icon, title, text]) => (
              <View style={styles.featureRow} key={title}>
                <View style={styles.featureIcon}>
                  <Ionicons name={icon} size={21} color={COLORS.primaryDark} />
                </View>
                <View style={styles.featureCopy}>
                  <Text style={styles.featureTitle}>{title}</Text>
                  <Text style={styles.featureText}>{text}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.primaryButton, (!premium.storeReady || busyAction) && styles.disabled]}
              onPress={() => runAction("paywall", premium.showPaywall)}
              disabled={!premium.storeReady || Boolean(busyAction)}
              activeOpacity={0.82}
            >
              {busyAction === "paywall" ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="diamond" size={19} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Bekijk Premium-opties</Text>
                </>
              )}
            </TouchableOpacity>

            {!premium.storeConfigured && (
              <Text style={styles.setupNotice}>
                Betalen wordt actief zodra de RevenueCat storesleutels in de buildomgeving zijn ingesteld.
              </Text>
            )}

            <TouchableOpacity
              style={styles.textButton}
              onPress={() => runAction("restore", premium.restore, "Aankopen zijn hersteld.")}
              disabled={Boolean(busyAction) || !premium.storeReady}
            >
              {busyAction === "restore" ? (
                <ActivityIndicator color={COLORS.primaryDark} />
              ) : (
                <Text style={styles.textButtonText}>Herstel eerdere aankoop</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.billingText}>
              Kies een maand-, jaar- of levenslang pakket. Abonnementen worden via Apple of Google afgerekend en verlengen automatisch totdat je opzegt. De appstore toont altijd de definitieve lokale prijs en voorwaarden.
            </Text>
            <View style={styles.linkRow}>
              <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
                <Text style={styles.link}>Privacybeleid</Text>
              </TouchableOpacity>
              <Text style={styles.linkDot}>·</Text>
              <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
                <Text style={styles.link}>Gebruiksvoorwaarden</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Personalisatie</Text>
            <View style={styles.card}>
              <View style={styles.consentRow}>
                <View style={styles.consentCopy}>
                  <Text style={styles.cardTitle}>Gebruik mijn boodschappenhistorie</Text>
                  <Text style={styles.cardText}>
                    SortIt analyseert je eigen afgeronde producten om je profiel en suggesties te maken. Geen advertenties en geen afleiding van gezondheid of religie.
                  </Text>
                </View>
                <Switch
                  value={premium.consent?.granted === true}
                  onValueChange={handleConsent}
                  disabled={busyAction === "consent"}
                  trackColor={{ false: "#D7DDD9", true: "#A9DAB1" }}
                  thumbColor={premium.consent?.granted ? COLORS.primary : "#FFFFFF"}
                />
              </View>
              {busyAction === "consent" && <ActivityIndicator color={COLORS.primary} />}
            </View>

            {premium.consent?.granted && (
              <>
                <Text style={styles.sectionTitle}>Jouw kookprofiel</Text>
                <View style={styles.card}>
                  <View style={styles.profileHeading}>
                    <View style={styles.profileIcon}>
                      <Ionicons name="analytics" size={22} color={COLORS.primaryDark} />
                    </View>
                    <View style={styles.profileHeadingCopy}>
                      <Text style={styles.cardTitle}>Gedragsoverzicht</Text>
                      <Text style={styles.cardTextNoMargin}>
                        {profile?.summary ?? "Bouw je profiel om inzichten te bekijken."}
                      </Text>
                    </View>
                  </View>

                  {profile?.sufficientData && (
                    <View style={styles.statsRow}>
                      <View style={styles.stat}>
                        <Text style={styles.statValue}>{profile.sampleSize}</Text>
                        <Text style={styles.statLabel}>producten</Text>
                      </View>
                      <View style={styles.stat}>
                        <Text style={styles.statValue}>{profile.averageListSize || "–"}</Text>
                        <Text style={styles.statLabel}>gem. per lijst</Text>
                      </View>
                      <View style={styles.stat}>
                        <Text style={styles.statValue} numberOfLines={1}>
                          {profile.favoriteStore?.name ?? "–"}
                        </Text>
                        <Text style={styles.statLabel}>favoriete winkel</Text>
                      </View>
                    </View>
                  )}

                  {(profile?.topProducts ?? []).slice(0, 5).map((product) => (
                    <View style={styles.insightRow} key={product.normalizedName}>
                      <Ionicons name="repeat-outline" size={18} color={COLORS.primary} />
                      <Text style={styles.insightText}>
                        <Text style={styles.insightStrong}>{product.name}</Text>
                        {product.repeatEveryDays
                          ? ` ongeveer elke ${Math.round(product.repeatEveryDays)} dagen · ${product.count} waarnemingen`
                          : ` · ${product.count} waarneming${product.count === 1 ? "" : "en"}`}
                      </Text>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={[styles.outlineButton, busyAction === "profile" && styles.disabled]}
                    onPress={() =>
                      runAction("profile", rebuildCookingProfile, "Je kookprofiel is bijgewerkt.")
                    }
                    disabled={Boolean(busyAction)}
                  >
                    {busyAction === "profile" ? (
                      <ActivityIndicator color={COLORS.primaryDark} />
                    ) : (
                      <>
                        <Ionicons name="refresh" size={18} color={COLORS.primaryDark} />
                        <Text style={styles.outlineButtonText}>Profiel opnieuw berekenen</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Persoonlijke voorkeuren</Text>
                <View style={styles.card}>
                  <Text style={styles.inputLabel}>Huishouden</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepButton}
                      onPress={() =>
                        setPreferences((current) => ({
                          ...current,
                          householdSize: Math.max(1, current.householdSize - 1),
                        }))
                      }
                    >
                      <Ionicons name="remove" size={20} color={COLORS.primaryDark} />
                    </TouchableOpacity>
                    <Text style={styles.stepValue}>{preferences.householdSize} persoon{preferences.householdSize === 1 ? "" : "en"}</Text>
                    <TouchableOpacity
                      style={styles.stepButton}
                      onPress={() =>
                        setPreferences((current) => ({
                          ...current,
                          householdSize: Math.min(12, current.householdSize + 1),
                        }))
                      }
                    >
                      <Ionicons name="add" size={20} color={COLORS.primaryDark} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.inputLabel}>Planperiode</Text>
                  <View style={styles.pickerBox}>
                    <Picker
                      selectedValue={preferences.planningDays}
                      onValueChange={(value) =>
                        setPreferences((current) => ({ ...current, planningDays: value }))
                      }
                    >
                      <Picker.Item label="3 dagen" value={3} />
                      <Picker.Item label="5 dagen" value={5} />
                      <Picker.Item label="7 dagen" value={7} />
                      <Picker.Item label="14 dagen" value={14} />
                    </Picker>
                  </View>

                  <Text style={styles.inputLabel}>Budgetvoorkeur</Text>
                  <View style={styles.pickerBox}>
                    <Picker
                      selectedValue={preferences.budgetLevel}
                      onValueChange={(value) =>
                        setPreferences((current) => ({ ...current, budgetLevel: value }))
                      }
                    >
                      <Picker.Item label="Budget" value="budget" />
                      <Picker.Item label="Standaard" value="standard" />
                      <Picker.Item label="Ruim" value="ruim" />
                    </Picker>
                  </View>

                  <Text style={styles.inputLabel}>Dieetwensen</Text>
                  <Text style={styles.inputHelp}>Alleen keuzes die je hier zelf maakt worden gebruikt.</Text>
                  <OptionChips
                    values={DIET_OPTIONS}
                    selected={preferences.dietTags ?? []}
                    onToggle={(value) =>
                      setPreferences((current) => ({
                        ...current,
                        dietTags: toggleValue(current.dietTags ?? [], value),
                      }))
                    }
                  />

                  <Text style={styles.inputLabel}>Allergieën</Text>
                  <Text style={styles.inputHelp}>Controleer AI-voorstellen altijd zelf bij ernstige allergieën.</Text>
                  <OptionChips
                    values={ALLERGEN_OPTIONS}
                    selected={preferences.allergens ?? []}
                    onToggle={(value) =>
                      setPreferences((current) => ({
                        ...current,
                        allergens: toggleValue(current.allergens ?? [], value),
                      }))
                    }
                  />

                  <Text style={styles.inputLabel}>Andere uitgesloten ingrediënten</Text>
                  <TextInput
                    style={styles.input}
                    value={excludedText}
                    onChangeText={setExcludedText}
                    placeholder="Bijvoorbeeld: champignons, koriander"
                    placeholderTextColor="#98A19B"
                    maxLength={500}
                  />

                  <TouchableOpacity
                    style={[styles.primaryButton, busyAction === "preferences" && styles.disabled]}
                    onPress={savePreferences}
                    disabled={Boolean(busyAction)}
                  >
                    {busyAction === "preferences" ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Voorkeuren opslaan</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.manageButton, busyAction === "manage" && styles.disabled]}
              onPress={() => runAction("manage", premium.openCustomerCenter)}
              disabled={Boolean(busyAction) || !premium.storeReady}
            >
              <Ionicons name="settings-outline" size={19} color={COLORS.primaryDark} />
              <Text style={styles.manageButtonText}>Premium beheren</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingTop: 13, paddingBottom: 45 },
  header: { marginBottom: 20 },
  backButton: { width: 44, height: 44, marginLeft: -9, marginBottom: 13, alignItems: "center", justifyContent: "center" },
  premiumBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9, backgroundColor: COLORS.gold },
  premiumBadgeText: { fontSize: 10, fontWeight: "900", letterSpacing: 1, color: "#FFFFFF" },
  title: { marginTop: 11, fontSize: 31, lineHeight: 36, fontWeight: "900", color: COLORS.text },
  subtitle: { marginTop: 8, fontSize: 15, lineHeight: 22, color: COLORS.textSoft },
  heroCard: { flexDirection: "row", alignItems: "center", padding: 17, marginBottom: 20, borderWidth: 1, borderColor: "#F0D99E", borderRadius: 21, backgroundColor: COLORS.goldSoft },
  heroIcon: { width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  heroCopy: { flex: 1, marginHorizontal: 13 },
  heroTitle: { fontSize: 15, fontWeight: "900", color: COLORS.text },
  heroPrice: { marginTop: 3, fontSize: 22, fontWeight: "900", color: COLORS.primaryDark },
  heroPeriod: { fontSize: 13, fontWeight: "700", color: COLORS.textSoft },
  sectionTitle: { marginTop: 5, marginBottom: 9, fontSize: 13, fontWeight: "900", letterSpacing: 0.4, color: COLORS.text, textTransform: "uppercase" },
  card: { padding: 17, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border, borderRadius: 21, backgroundColor: COLORS.surface },
  cardTitle: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  cardText: { marginTop: 5, fontSize: 13, lineHeight: 19, color: COLORS.textSoft },
  cardTextNoMargin: { marginTop: 3, fontSize: 13, lineHeight: 19, color: COLORS.textSoft },
  featureRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  featureIcon: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primarySoft },
  featureCopy: { flex: 1, marginLeft: 12 },
  featureTitle: { fontSize: 14, fontWeight: "900", color: COLORS.text },
  featureText: { marginTop: 2, fontSize: 12, lineHeight: 17, color: COLORS.textSoft },
  primaryButton: { minHeight: 53, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8, borderRadius: 16, backgroundColor: COLORS.primary },
  primaryButtonText: { fontSize: 14, fontWeight: "900", color: "#FFFFFF" },
  disabled: { opacity: 0.45 },
  setupNotice: { marginTop: 10, padding: 10, borderRadius: 11, backgroundColor: COLORS.goldSoft, fontSize: 11, lineHeight: 16, color: "#7A5A19", textAlign: "center" },
  textButton: { minHeight: 45, alignItems: "center", justifyContent: "center" },
  textButtonText: { fontSize: 13, fontWeight: "800", color: COLORS.primaryDark, textDecorationLine: "underline" },
  billingText: { marginTop: 5, fontSize: 10, lineHeight: 15, color: COLORS.textSoft, textAlign: "center" },
  linkRow: { flexDirection: "row", justifyContent: "center", marginTop: 10 },
  link: { fontSize: 11, fontWeight: "700", color: COLORS.primaryDark, textDecorationLine: "underline" },
  linkDot: { marginHorizontal: 7, color: COLORS.textSoft },
  consentRow: { flexDirection: "row", alignItems: "center" },
  consentCopy: { flex: 1, marginRight: 13 },
  profileHeading: { flexDirection: "row", alignItems: "flex-start" },
  profileIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primarySoft },
  profileHeadingCopy: { flex: 1, marginLeft: 12 },
  statsRow: { flexDirection: "row", marginTop: 17, paddingVertical: 13, borderRadius: 15, backgroundColor: COLORS.surfaceSoft },
  stat: { flex: 1, minWidth: 0, alignItems: "center", paddingHorizontal: 4 },
  statValue: { maxWidth: "100%", fontSize: 17, fontWeight: "900", color: COLORS.primaryDark },
  statLabel: { marginTop: 2, fontSize: 9, fontWeight: "700", color: COLORS.textSoft, textAlign: "center" },
  insightRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 14 },
  insightText: { flex: 1, marginLeft: 9, fontSize: 12, lineHeight: 18, color: COLORS.textSoft },
  insightStrong: { fontWeight: "900", color: COLORS.text },
  outlineButton: { minHeight: 49, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 18, borderWidth: 1.5, borderColor: "#B9D9BF", borderRadius: 15, backgroundColor: COLORS.primarySoft },
  outlineButtonText: { fontSize: 13, fontWeight: "900", color: COLORS.primaryDark },
  inputLabel: { marginTop: 17, marginBottom: 7, fontSize: 12, fontWeight: "900", color: COLORS.text },
  inputHelp: { marginTop: -3, marginBottom: 9, fontSize: 11, lineHeight: 16, color: COLORS.textSoft },
  stepper: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: COLORS.border, borderRadius: 15, backgroundColor: COLORS.surfaceSoft, paddingHorizontal: 8 },
  stepButton: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primarySoft },
  stepValue: { fontSize: 14, fontWeight: "900", color: COLORS.text },
  pickerBox: { minHeight: 52, borderWidth: 1, borderColor: COLORS.border, borderRadius: 15, backgroundColor: COLORS.surfaceSoft, overflow: "hidden" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 11, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, backgroundColor: COLORS.surfaceSoft },
  chipActive: { borderColor: "#A9D4B1", backgroundColor: COLORS.primarySoft },
  chipText: { fontSize: 12, fontWeight: "700", color: COLORS.textSoft },
  chipTextActive: { color: COLORS.primaryDark, fontWeight: "900" },
  input: { minHeight: 51, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.border, borderRadius: 15, backgroundColor: COLORS.surfaceSoft, fontSize: 14, color: COLORS.text },
  manageButton: { minHeight: 51, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, backgroundColor: COLORS.surface },
  manageButtonText: { fontSize: 13, fontWeight: "800", color: COLORS.primaryDark },
});
