import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

export const APP_LANGUAGE_KEY = "SORTIT_APP_LANGUAGE";
export const DATA_SHARING_KEY = "SORTIT_DATA_SHARING";

export const DEFAULT_DATA_SHARING = {
  shareName: false,
  shareEmail: false,
  shareLocation: false,
};

export const DATA_SHARING_OPTIONS = [
  {
    key: "shareName",
    icon: "person-outline",
    title: "Naam toestaan",
    description: "Voor meer personalisatie in SortIt.",
  },
  {
    key: "shareEmail",
    icon: "mail-outline",
    title: "E-mail toestaan",
    description:
      "Om op de hoogte te blijven van nieuwe features.",
  },
  {
    key: "shareLocation",
    icon: "location-outline",
    title: "Locatie toestaan",
    description:
      "Om het algoritme te verbeteren en je supermarktbezoeken nog beter te maken.",
  },
];

export const normalizeDataSharing = (value = {}) => ({
  shareName: value.shareName === true,
  shareEmail: value.shareEmail === true,
  shareLocation: value.shareLocation === true,
});

const getUserDataSharingKey = (userId) =>
  `${DATA_SHARING_KEY}:${userId}`;

export const loadDataSharing = async (userId) => {
  if (!userId) return DEFAULT_DATA_SHARING;

  const saved = await AsyncStorage.getItem(
    getUserDataSharingKey(userId)
  );

  if (!saved) return DEFAULT_DATA_SHARING;

  try {
    return normalizeDataSharing(JSON.parse(saved));
  } catch {
    return DEFAULT_DATA_SHARING;
  }
};

export const saveDataSharing = async (userId, value) => {
  if (!userId) return DEFAULT_DATA_SHARING;

  const normalized = normalizeDataSharing(value);

  await AsyncStorage.setItem(
    getUserDataSharingKey(userId),
    JSON.stringify(normalized)
  );

  return normalized;
};

const getAllowedLocation = async (shareLocation) => {
  if (!shareLocation) return "";

  try {
    const permission =
      await Location.getForegroundPermissionsAsync();

    if (permission.status !== "granted") return "";

    const position =
      (await Location.getLastKnownPositionAsync({
        maxAge: 300000,
        requiredAccuracy: 1000,
      })) ??
      (await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }));

    return `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
  } catch (error) {
    console.warn("Locatie ophalen voor data-archief mislukt:", error);
    return "";
  }
};

export const getSheetSharingContext = async (user) => {
  const [sharing, storedLanguage] = await Promise.all([
    loadDataSharing(user.uid),
    AsyncStorage.getItem(APP_LANGUAGE_KEY),
  ]);

  return {
    name: sharing.shareName ? user.displayName ?? "" : "",
    email: sharing.shareEmail ? user.email ?? "" : "",
    location: await getAllowedLocation(
      sharing.shareLocation
    ),
    language: storedLanguage ?? "nl",
  };
};
