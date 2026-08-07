import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  deleteUser,
  EmailAuthProvider,
  reload,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { ref, remove, set } from "firebase/database";
import * as Location from "expo-location";

import { auth, db } from "../firebaseConfig";
import {
  beginAccountDeletion,
  endAccountDeletion,
  waitForAccountSyncIdle,
} from "../accountDeletion";
import {
  APP_LANGUAGE_KEY,
  clearDataSharing,
  DATA_SHARING_OPTIONS,
  DEFAULT_DATA_SHARING,
  loadDataSharing,
  saveDataSharing,
} from "../dataSharing";
import { clearStorePresenceData } from "../storePresence";
import {
  countries,
  DEFAULT_COUNTRY_CODE,
  getCountryStorageKey,
  STORAGE_KEY,
  STORE_KEY,
} from "../shoppingData";

const PRIVACY_POLICY_URL =
  "https://oke1234.github.io/Sort-it/privacy-policy.html";
const DELETE_ACCOUNT_URL =
  "https://oke1234.github.io/Sort-it/delete-account.html";
const PENDING_SYNC_KEY = "SHOPPING_LISTS_PENDING_SYNC_V2";
const getUserListsKey = (userId) =>
  `SHOPPING_LISTS_V2:${userId}`;

const LANGUAGE_OPTIONS = [
  { code: "nl", shortLabel: "NL", label: "Nederlands" },
  { code: "en", shortLabel: "EN", label: "English" },
  { code: "de", shortLabel: "DE", label: "Deutsch" },
  { code: "fr", shortLabel: "FR", label: "Français" },
  { code: "es", shortLabel: "ES", label: "Español" },
  { code: "it", shortLabel: "IT", label: "Italiano" },
];

const COLORS = {
  background: "#F8F8F8",
  primary: "#4CAF50",
  primaryDark: "#2E7D32",
  primarySoft: "#EAF7EC",
  text: "#222222",
  gray: "#707770",
  white: "#FFFFFF",
  border: "#E2E7E3",
  danger: "#C62828",
  dangerSoft: "#FFF0F0",
};

const getAuthErrorMessage = (error) => {
  switch (error?.code) {
    case "auth/invalid-email":
      return "Vul een geldig e-mailadres in.";
    case "auth/email-already-in-use":
      return "Dit e-mailadres is al gekoppeld aan een ander account.";
    case "auth/requires-recent-login":
      return "Log uit en opnieuw in om deze beveiligde wijziging uit te voeren.";
    case "auth/too-many-requests":
      return "Er zijn te veel verzoeken verstuurd. Probeer het later opnieuw.";
    case "auth/network-request-failed":
      return "Controleer je internetverbinding en probeer het opnieuw.";
    case "auth/operation-not-allowed":
      return "Deze wijziging is nog niet ingeschakeld voor dit account.";
    case "auth/user-token-expired":
      return "Je sessie is verlopen. Log opnieuw in en probeer het nogmaals.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Het ingevulde wachtwoord is niet juist.";
    default:
      return "Er is iets misgegaan. Probeer het opnieuw.";
  }
};

export default function ProfielScreen({ navigation }) {
  const user = auth.currentUser;

  const [name, setName] = useState(user?.displayName || "");
  const [savedName, setSavedName] = useState(user?.displayName || "");
  const [currentEmail, setCurrentEmail] = useState(user?.email || "");
  const [newEmail, setNewEmail] = useState(user?.email || "");
  const [emailLinkSentTo, setEmailLinkSentTo] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [sendingEmailLink, setSendingEmailLink] = useState(false);
  const [sendingPasswordLink, setSendingPasswordLink] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] =
    useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [language, setLanguage] = useState("nl");
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [countryCode, setCountryCode] = useState(
    DEFAULT_COUNTRY_CODE
  );
  const [savingCountry, setSavingCountry] = useState(false);
  const [dataSharing, setDataSharing] = useState(
    DEFAULT_DATA_SHARING
  );
  const [savingSharingKey, setSavingSharingKey] =
    useState(null);

  const cleanedName = name.trim();
  const cleanedEmail = newEmail.trim().toLowerCase();
  const nameIsUnchanged = cleanedName === savedName;
  const emailIsUnchanged = cleanedEmail === currentEmail.toLowerCase();

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(APP_LANGUAGE_KEY)
      .then((storedLanguage) => {
        const languageExists = LANGUAGE_OPTIONS.some(
          (option) => option.code === storedLanguage
        );

        if (active && languageExists) {
          setLanguage(storedLanguage);
          auth.languageCode = storedLanguage;
        }
      })
      .catch(() => {
        // Nederlands blijft actief als de voorkeur niet geladen kan worden.
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!user?.uid) return undefined;

    AsyncStorage.getItem(getCountryStorageKey(user.uid))
      .then((storedCountryCode) => {
        const countryExists = countries.some(
          (country) => country.code === storedCountryCode
        );

        if (active && countryExists) {
          setCountryCode(storedCountryCode);
        }
      })
      .catch(() => {
        // Nederland blijft actief als de voorkeur niet geladen kan worden.
      });

    return () => {
      active = false;
    };
  }, [user?.uid]);

  useEffect(() => {
    let active = true;

    loadDataSharing(user?.uid)
      .then((savedSharing) => {
        if (active) setDataSharing(savedSharing);
      })
      .catch(() => {
        // Alles blijft standaard uit als de voorkeur niet geladen kan worden.
      });

    return () => {
      active = false;
    };
  }, [user?.uid]);

  useEffect(() => {
    const refreshEmail = async () => {
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      try {
        await reload(currentUser);
        const refreshedEmail = currentUser.email || "";

        setCurrentEmail((previousEmail) => {
          if (refreshedEmail !== previousEmail) {
            setNewEmail(refreshedEmail);
            setEmailLinkSentTo("");
          }

          return refreshedEmail;
        });
      } catch {
        // De huidige gegevens blijven zichtbaar als verversen tijdelijk niet lukt.
      }
    };

    const unsubscribeFocus = navigation.addListener("focus", refreshEmail);
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "active") {
          refreshEmail();
        }
      }
    );

    return () => {
      unsubscribeFocus();
      appStateSubscription.remove();
    };
  }, [navigation]);

  const handleSaveName = async () => {
    if (!user) {
      Alert.alert("Niet ingelogd", "Log opnieuw in om je profiel te wijzigen.");
      return;
    }

    if (!cleanedName) {
      Alert.alert("Naam ontbreekt", "Vul je naam in.");
      return;
    }

    setSavingName(true);
    try {
      await updateProfile(user, { displayName: cleanedName });
      setName(cleanedName);
      setSavedName(cleanedName);
      Alert.alert("Naam opgeslagen", "Je naam is succesvol aangepast.");
    } catch (error) {
      Alert.alert("Naam niet opgeslagen", getAuthErrorMessage(error));
    } finally {
      setSavingName(false);
    }
  };

  const handleLanguageChange = async (nextLanguage) => {
    if (
      savingLanguage ||
      nextLanguage === language ||
      !LANGUAGE_OPTIONS.some(
        (option) => option.code === nextLanguage
      )
    ) {
      return;
    }

    const previousLanguage = language;

    setLanguage(nextLanguage);
    setSavingLanguage(true);
    auth.languageCode = nextLanguage;

    try {
      await AsyncStorage.setItem(
        APP_LANGUAGE_KEY,
        nextLanguage
      );
    } catch {
      setLanguage(previousLanguage);
      auth.languageCode = previousLanguage;
      Alert.alert(
        "Taal niet opgeslagen",
        "Probeer de taal opnieuw te kiezen."
      );
    } finally {
      setSavingLanguage(false);
    }
  };

  const handleCountryChange = async (nextCountryCode) => {
    if (
      !user?.uid ||
      savingCountry ||
      nextCountryCode === countryCode ||
      !countries.some(
        (country) => country.code === nextCountryCode
      )
    ) {
      return;
    }

    const previousCountryCode = countryCode;

    setCountryCode(nextCountryCode);
    setSavingCountry(true);

    try {
      await AsyncStorage.setItem(
        getCountryStorageKey(user.uid),
        nextCountryCode
      );
    } catch {
      setCountryCode(previousCountryCode);
      Alert.alert(
        "Land niet opgeslagen",
        "Probeer je land opnieuw te kiezen."
      );
    } finally {
      setSavingCountry(false);
    }
  };

  const handleSharingChange = async (key, enabled) => {
    if (!user || savingSharingKey) return;

    setSavingSharingKey(key);

    try {
      if (key === "allowStorePresence" && enabled) {
        const permission =
          await Location.requestForegroundPermissionsAsync();

        if (permission.status !== "granted") {
          Alert.alert(
            "Locatie niet toegestaan",
            "De winkelschakelaar blijft uit. SortIt gebruikt locatie alleen terwijl de app geopend is en stuurt geen coördinaten naar Firebase."
          );
          return;
        }
      }

      const nextSharing = await saveDataSharing(
        user.uid,
        {
          ...dataSharing,
          [key]: enabled,
        }
      );

      setDataSharing(nextSharing);

      if (key === "allowStorePresence" && !enabled) {
        await clearStorePresenceData(user.uid);
      }
    } catch (error) {
      console.error("Datatoestemming opslaan mislukt:", error);
      Alert.alert(
        "Toestemming niet opgeslagen",
        "Controleer je internetverbinding en probeer het opnieuw."
      );
    } finally {
      setSavingSharingKey(null);
    }
  };

  const handleEmailChange = async () => {
    if (!user) {
      Alert.alert("Niet ingelogd", "Log opnieuw in om je e-mailadres te wijzigen.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
      Alert.alert("Ongeldig e-mailadres", "Vul een geldig e-mailadres in.");
      return;
    }

    if (emailIsUnchanged) {
      Alert.alert(
        "Geen wijziging",
        "Vul een ander e-mailadres in dan je huidige adres."
      );
      return;
    }

    setSendingEmailLink(true);
    try {
      auth.languageCode = language;
      await verifyBeforeUpdateEmail(user, cleanedEmail);
      setNewEmail(cleanedEmail);
      setEmailLinkSentTo(cleanedEmail);
      Alert.alert(
        "Bevestigingslink verstuurd",
        `Open de e-mail die we naar ${cleanedEmail} hebben gestuurd. Je e-mailadres wordt gewijzigd zodra je op de link klikt.`
      );
    } catch (error) {
      Alert.alert("Link niet verstuurd", getAuthErrorMessage(error));
    } finally {
      setSendingEmailLink(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!currentEmail) {
      Alert.alert(
        "Geen e-mailadres",
        "Er is geen e-mailadres aan dit account gekoppeld."
      );
      return;
    }

    setSendingPasswordLink(true);
    try {
      auth.languageCode = language;
      await sendPasswordResetEmail(auth, currentEmail);
      Alert.alert(
        "Wachtwoordlink verstuurd",
        `Open de e-mail die we naar ${currentEmail} hebben gestuurd om een nieuw wachtwoord te kiezen.`
      );
    } catch (error) {
      Alert.alert("Link niet verstuurd", getAuthErrorMessage(error));
    } finally {
      setSendingPasswordLink(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert("Uitloggen mislukt", getAuthErrorMessage(error));
      setLoggingOut(false);
    }
  };

  const openExternalPage = async (url) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Pagina niet geopend",
        "Controleer je internetverbinding en probeer het opnieuw."
      );
    }
  };

  const closeDeleteModal = () => {
    if (deletingAccount) return;

    setDeletePassword("");
    setDeleteModalVisible(false);
  };

  const handleDeleteAccount = async () => {
    const currentUser = auth.currentUser;
    const userId = currentUser?.uid;
    const email = currentUser?.email;

    if (!currentUser || !userId || !email) {
      Alert.alert(
        "Niet ingelogd",
        "Log opnieuw in om je account te verwijderen."
      );
      return;
    }

    if (!deletePassword) {
      Alert.alert(
        "Wachtwoord ontbreekt",
        "Vul je huidige wachtwoord in om door te gaan."
      );
      return;
    }

    setDeletingAccount(true);
    beginAccountDeletion(userId);

    try {
      const credential = EmailAuthProvider.credential(
        email,
        deletePassword
      );

      await reauthenticateWithCredential(
        currentUser,
        credential
      );
      await waitForAccountSyncIdle(userId);

      const deletionFlagRef = ref(
        db,
        `users/${userId}/accountDeletionRequested`
      );
      await set(deletionFlagRef, true);
      await remove(ref(db, `users/${userId}`));
      await deleteUser(currentUser);

      await Promise.allSettled([
        clearStorePresenceData(userId),
        clearDataSharing(userId),
        AsyncStorage.multiRemove([
          getUserListsKey(userId),
          getCountryStorageKey(userId),
          PENDING_SYNC_KEY,
          STORAGE_KEY,
          STORE_KEY,
        ]),
      ]);

      endAccountDeletion(userId);
      setDeletePassword("");
      setDeleteModalVisible(false);

      Alert.alert(
        "Account verwijderd",
        "Je SortIt-account en gekoppelde gegevens zijn verwijderd."
      );
    } catch (error) {
      endAccountDeletion(userId);

      try {
        await set(
          ref(
            db,
            `users/${userId}/accountDeletionRequested`
          ),
          null
        );
      } catch {
        // De gebruikersdata kan al verwijderd zijn.
      }

      Alert.alert(
        "Account niet verwijderd",
        getAuthErrorMessage(error)
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  const renderButtonContent = (loading, icon, label, color = COLORS.white) =>
    loading ? (
      <ActivityIndicator color={color} />
    ) : (
      <>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={[styles.buttonText, { color }]}>{label}</Text>
      </>
    );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Terug"
            >
              <Ionicons name="arrow-back" size={26} color={COLORS.text} />
            </TouchableOpacity>

            <Text style={styles.eyebrow}>PROFIEL</Text>
            <Text style={styles.title}>Mijn profiel</Text>
            <Text style={styles.subtitle}>
              Beheer je persoonlijke gegevens en accountbeveiliging.
            </Text>
          </View>

          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={46} color={COLORS.primary} />
            </View>
            <Text style={styles.avatarName}>{savedName || "Gebruiker"}</Text>
            <Text style={styles.avatarEmail}>
              {currentEmail || "Geen e-mailadres"}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Taal</Text>
          <View style={[styles.card, styles.languageCard]}>
            <View style={styles.languageHeader}>
              <View style={styles.languageIcon}>
                <Ionicons
                  name="language-outline"
                  size={23}
                  color={COLORS.primaryDark}
                />
              </View>
              <View style={styles.languageCopy}>
                <Text style={styles.languageTitle}>App-taal</Text>
                <Text style={styles.cardTextNoMargin}>
                  Kies de taal voor SortIt en accountmails.
                </Text>
              </View>
            </View>

            <View style={styles.languageOptions}>
              {LANGUAGE_OPTIONS.map((option) => {
                const selected = language === option.code;

                return (
                  <TouchableOpacity
                    key={option.code}
                    style={[
                      styles.languageOption,
                      selected && styles.languageOptionSelected,
                    ]}
                    onPress={() =>
                      handleLanguageChange(option.code)
                    }
                    disabled={savingLanguage}
                    activeOpacity={0.76}
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: selected,
                      disabled: savingLanguage,
                    }}
                    accessibilityLabel={option.label}
                  >
                    <View
                      style={[
                        styles.languageBadge,
                        selected &&
                          styles.languageBadgeSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.languageBadgeText,
                          selected &&
                            styles.languageBadgeTextSelected,
                        ]}
                      >
                        {option.shortLabel}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.languageOptionText,
                        selected &&
                          styles.languageOptionTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>

                    {selected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={19}
                        color={COLORS.primaryDark}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Land</Text>
          <View style={[styles.card, styles.languageCard]}>
            <View style={styles.languageHeader}>
              <View style={styles.languageIcon}>
                <Ionicons
                  name="earth-outline"
                  size={23}
                  color={COLORS.primaryDark}
                />
              </View>
              <View style={styles.languageCopy}>
                <Text style={styles.languageTitle}>
                  Supermarktland
                </Text>
                <Text style={styles.cardTextNoMargin}>
                  Je land bepaalt welke supermarkten je op je lijsten kunt
                  kiezen. Bestaande lijstgegevens blijven bewaard.
                </Text>
              </View>
            </View>

            <View style={styles.countryOptions}>
              {countries.map((country) => {
                const selected = countryCode === country.code;

                return (
                  <TouchableOpacity
                    key={country.code}
                    style={[
                      styles.countryOption,
                      selected && styles.languageOptionSelected,
                    ]}
                    onPress={() =>
                      handleCountryChange(country.code)
                    }
                    disabled={savingCountry}
                    activeOpacity={0.76}
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: selected,
                      disabled: savingCountry,
                    }}
                    accessibilityLabel={country.label}
                  >
                    <View
                      style={[
                        styles.languageBadge,
                        selected &&
                          styles.languageBadgeSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.languageBadgeText,
                          selected &&
                            styles.languageBadgeTextSelected,
                        ]}
                      >
                        {country.shortLabel}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.languageOptionText,
                        selected &&
                          styles.languageOptionTextSelected,
                      ]}
                    >
                      {country.label}
                    </Text>

                    {selected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={19}
                        color={COLORS.primaryDark}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Winkelbezoek</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Deze optie is vrijwillig en staat standaard uit. Als je hem
              inschakelt, kan SortIt vragen of je bij de gekozen winkel
              bent. Coördinaten blijven op je telefoon; Firebase ontvangt
              alleen de winkelnaam, een bevestigd adres, je antwoord en het
              tijdstip. Na je bevestiging kan het adres één uur aan passende
              items en producthistorie worden gekoppeld. Er wordt geen
              achtergrondlocatie gebruikt.
            </Text>

            {DATA_SHARING_OPTIONS.map((option, index) => (
              <View
                key={option.key}
                style={[
                  styles.sharingRow,
                  index > 0 && styles.sharingRowBorder,
                ]}
              >
                <View style={styles.sharingIcon}>
                  <Ionicons
                    name={option.icon}
                    size={21}
                    color={COLORS.primaryDark}
                  />
                </View>

                <View style={styles.sharingCopy}>
                  <Text style={styles.sharingTitle}>
                    {option.title}
                  </Text>
                  <Text style={styles.sharingDescription}>
                    {option.description}
                  </Text>
                </View>

                <Switch
                  value={dataSharing[option.key]}
                  onValueChange={(enabled) =>
                    handleSharingChange(option.key, enabled)
                  }
                  disabled={savingSharingKey !== null}
                  trackColor={{
                    false: "#D7DDD9",
                    true: "#A9DAB1",
                  }}
                  thumbColor={
                    dataSharing[option.key]
                      ? COLORS.primary
                      : "#FFFFFF"
                  }
                  accessibilityLabel={option.title}
                />
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Persoonlijke gegevens</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Naam</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name="person-outline"
                size={20}
                color={COLORS.gray}
              />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Je naam"
                placeholderTextColor="#98A19B"
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={50}
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (savingName || nameIsUnchanged || !cleanedName) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleSaveName}
              disabled={savingName || nameIsUnchanged || !cleanedName}
              activeOpacity={0.82}
            >
              {renderButtonContent(
                savingName,
                "checkmark-outline",
                "Naam opslaan"
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>E-mailadres wijzigen</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Vul je nieuwe e-mailadres in. We sturen een link naar dat adres om
              de wijziging te bevestigen.
            </Text>

            <Text style={styles.label}>Nieuw e-mailadres</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={20} color={COLORS.gray} />
              <TextInput
                style={styles.input}
                value={newEmail}
                onChangeText={(value) => {
                  setNewEmail(value);
                  setEmailLinkSentTo("");
                }}
                placeholder="naam@voorbeeld.nl"
                placeholderTextColor="#98A19B"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType="send"
                onSubmitEditing={handleEmailChange}
              />
            </View>

            {emailLinkSentTo ? (
              <View style={styles.statusBox}>
                <Ionicons
                  name="mail-unread-outline"
                  size={19}
                  color={COLORS.primaryDark}
                />
                <Text style={styles.statusText}>
                  Controleer {emailLinkSentTo} en open de bevestigingslink.
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.outlineButton,
                (sendingEmailLink || emailIsUnchanged || !cleanedEmail) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleEmailChange}
              disabled={
                sendingEmailLink || emailIsUnchanged || !cleanedEmail
              }
              activeOpacity={0.82}
            >
              {renderButtonContent(
                sendingEmailLink,
                "send-outline",
                "Stuur bevestigingslink",
                COLORS.primaryDark
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Wachtwoord wijzigen</Text>
          <View style={styles.card}>
            <View style={styles.securityHeader}>
              <View style={styles.securityIcon}>
                <Ionicons
                  name="lock-closed-outline"
                  size={23}
                  color={COLORS.primaryDark}
                />
              </View>
              <View style={styles.securityCopy}>
                <Text style={styles.securityTitle}>Kies een nieuw wachtwoord</Text>
                <Text style={styles.cardTextNoMargin}>
                  De veilige resetlink wordt naar {currentEmail || "je e-mail"}
                  gestuurd.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.outlineButton,
                (sendingPasswordLink || !currentEmail) && styles.buttonDisabled,
              ]}
              onPress={handlePasswordReset}
              disabled={sendingPasswordLink || !currentEmail}
              activeOpacity={0.82}
            >
              {renderButtonContent(
                sendingPasswordLink,
                "key-outline",
                "Stuur wachtwoordlink",
                COLORS.primaryDark
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.logoutButton, loggingOut && styles.buttonDisabled]}
            onPress={handleLogout}
            disabled={loggingOut}
            activeOpacity={0.82}
          >
            {renderButtonContent(
              loggingOut,
              "log-out-outline",
              "Log uit",
              COLORS.danger
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={() => setDeleteModalVisible(true)}
            disabled={deletingAccount}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel="SortIt-account verwijderen"
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={COLORS.danger}
            />
            <Text
              style={[
                styles.buttonText,
                { color: COLORS.danger },
              ]}
            >
              Verwijder account
            </Text>
          </TouchableOpacity>

          <View style={styles.policyLinks}>
            <TouchableOpacity
              onPress={() => openExternalPage(PRIVACY_POLICY_URL)}
              accessibilityRole="link"
            >
              <Text style={styles.policyLinkText}>Privacybeleid</Text>
            </TouchableOpacity>
            <Text style={styles.policyLinkSeparator}>·</Text>
            <TouchableOpacity
              onPress={() => openExternalPage(DELETE_ACCOUNT_URL)}
              accessibilityRole="link"
            >
              <Text style={styles.policyLinkText}>
                Verwijderingsinformatie
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.version}>SortIt · versie 1.0.0</Text>
        </ScrollView>

        <Modal
          visible={deleteModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closeDeleteModal}
        >
          <View style={styles.modalBackdrop}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.modalKeyboardView}
            >
              <View style={styles.deleteModalCard}>
                <View style={styles.deleteModalIcon}>
                  <Ionicons
                    name="warning-outline"
                    size={26}
                    color={COLORS.danger}
                  />
                </View>
                <Text style={styles.deleteModalTitle}>
                  Account definitief verwijderen?
                </Text>
                <Text style={styles.deleteModalText}>
                  Je account, lijsten, notities, producthistorie,
                  winkelbevestigingen en opgeslagen winkelafbeeldingen worden
                  verwijderd. Dit kan niet ongedaan worden gemaakt.
                </Text>

                <Text style={styles.label}>Huidig wachtwoord</Text>
                <View style={styles.inputRow}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={COLORS.gray}
                  />
                  <TextInput
                    style={styles.input}
                    value={deletePassword}
                    onChangeText={setDeletePassword}
                    placeholder="Wachtwoord"
                    placeholderTextColor="#98A19B"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!deletingAccount}
                  />
                </View>

                <View style={styles.deleteModalActions}>
                  <TouchableOpacity
                    style={styles.deleteModalCancelButton}
                    onPress={closeDeleteModal}
                    disabled={deletingAccount}
                  >
                    <Text style={styles.deleteModalCancelText}>
                      Annuleren
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.deleteModalConfirmButton,
                      (!deletePassword || deletingAccount) &&
                        styles.buttonDisabled,
                    ]}
                    onPress={handleDeleteAccount}
                    disabled={!deletePassword || deletingAccount}
                  >
                    {deletingAccount ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={styles.deleteModalConfirmText}>
                        Definitief verwijderen
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    marginLeft: -9,
    marginBottom: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "800",
    letterSpacing: 2,
  },
  title: {
    marginTop: 5,
    fontSize: 34,
    fontWeight: "900",
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 8,
    maxWidth: 360,
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.gray,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 28,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 30,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CFE8D3",
  },
  avatarName: {
    marginTop: 13,
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  avatarEmail: {
    marginTop: 3,
    fontSize: 14,
    color: COLORS.gray,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 9,
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  card: {
    padding: 18,
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  languageCard: {
    padding: 16,
  },
  languageHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  languageIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primarySoft,
  },
  languageCopy: {
    flex: 1,
    marginLeft: 12,
  },
  languageTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  languageOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 15,
  },
  languageOption: {
    width: "48%",
    flexGrow: 1,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: "#FAFBFA",
    paddingHorizontal: 8,
  },
  languageOptionSelected: {
    borderColor: "#A9D4B1",
    backgroundColor: COLORS.primarySoft,
  },
  languageBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF0EE",
    marginRight: 7,
  },
  languageBadgeSelected: {
    backgroundColor: COLORS.white,
  },
  languageBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.gray,
  },
  languageBadgeTextSelected: {
    color: COLORS.primaryDark,
  },
  languageOptionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.gray,
  },
  languageOptionTextSelected: {
    color: COLORS.primaryDark,
    fontWeight: "900",
  },
  countryOptions: {
    marginTop: 15,
    gap: 8,
  },
  countryOption: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: "#FAFBFA",
    paddingHorizontal: 10,
  },
  sharingRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
  },
  sharingRowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sharingIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primarySoft,
  },
  sharingCopy: {
    flex: 1,
    marginHorizontal: 12,
  },
  sharingTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  sharingDescription: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.gray,
  },
  label: {
    marginBottom: 7,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.gray,
  },
  inputRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    borderWidth: 1.5,
    borderColor: "#DCE3DE",
    borderRadius: 16,
    backgroundColor: "#FAFBFA",
  },
  input: {
    flex: 1,
    paddingHorizontal: 11,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  cardText: {
    marginBottom: 17,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.gray,
  },
  cardTextNoMargin: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.gray,
  },
  primaryButton: {
    minHeight: 52,
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: COLORS.primary,
  },
  outlineButton: {
    minHeight: 52,
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#B9D9BF",
    backgroundColor: COLORS.primarySoft,
  },
  buttonDisabled: {
    opacity: 0.42,
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "800",
  },
  statusBox: {
    marginTop: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 13,
    backgroundColor: COLORS.primarySoft,
  },
  statusText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.primaryDark,
  },
  securityHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  securityIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primarySoft,
  },
  securityCopy: {
    flex: 1,
    marginLeft: 13,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  logoutButton: {
    minHeight: 54,
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: "#F0C7C7",
    backgroundColor: COLORS.dangerSoft,
  },
  deleteAccountButton: {
    minHeight: 50,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
  },
  policyLinks: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  policyLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primaryDark,
    textDecorationLine: "underline",
  },
  policyLinkSeparator: {
    marginHorizontal: 9,
    color: COLORS.gray,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 22,
    backgroundColor: "rgba(20, 28, 23, 0.55)",
  },
  modalKeyboardView: {
    width: "100%",
  },
  deleteModalCard: {
    padding: 22,
    borderRadius: 24,
    backgroundColor: COLORS.white,
  },
  deleteModalIcon: {
    width: 50,
    height: 50,
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: COLORS.dangerSoft,
  },
  deleteModalTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: COLORS.text,
  },
  deleteModalText: {
    marginTop: 9,
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.gray,
  },
  deleteModalActions: {
    marginTop: 20,
    flexDirection: "row",
  },
  deleteModalCancelButton: {
    minHeight: 50,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  deleteModalCancelText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  deleteModalConfirmButton: {
    minHeight: 50,
    flex: 1.35,
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: COLORS.danger,
  },
  deleteModalConfirmText: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.white,
  },
  version: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 12,
    color: "#9AA09B",
  },
});
