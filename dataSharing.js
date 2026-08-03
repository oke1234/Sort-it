import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

export const APP_LANGUAGE_KEY = "SORTIT_APP_LANGUAGE";
export const DATA_SHARING_KEY = "SORTIT_DATA_SHARING";

export const DEFAULT_DATA_SHARING = {
  allowProductLocation: false,
};

export const DATA_SHARING_OPTIONS = [
  {
    key: "allowProductLocation",
    icon: "location-outline",
    title: "Locatie bij product opslaan",
    description:
      "Sla je huidige coördinaten samen met nieuwe productacties op in je eigen Firebase-account. SortIt gebruikt geen achtergrondlocatie.",
  },
];

export const normalizeDataSharing = (value = {}) => ({
  // De oudere toestemming voor supermarktdetectie wordt bewust niet
  // overgenomen: coördinaten opslaan is een nieuw en specifieker doel.
  allowProductLocation:
    value.allowProductLocation === true,
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

export const getAllowedProductLocation = async (userId) => {
  if (!userId) return "";

  try {
    const sharing = await loadDataSharing(userId);

    if (!sharing.allowProductLocation) return "";

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

    return {
      latitude: Number(position.coords.latitude.toFixed(6)),
      longitude: Number(position.coords.longitude.toFixed(6)),
    };
  } catch (error) {
    console.warn(
      "Locatie ophalen voor Firebase mislukt:",
      error
    );
    return "";
  }
};
