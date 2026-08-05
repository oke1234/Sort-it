import AsyncStorage from "@react-native-async-storage/async-storage";

export const APP_LANGUAGE_KEY = "SORTIT_APP_LANGUAGE";
export const DATA_SHARING_KEY = "SORTIT_DATA_SHARING";

export const DEFAULT_DATA_SHARING = {
  allowStorePresence: false,
};

export const DATA_SHARING_OPTIONS = [
  {
    key: "allowStorePresence",
    icon: "location-outline",
    title: "Winkelbezoek herkennen",
    description:
      "Laat SortIt na een productactie vragen of je bij de gekozen winkel bent. Alleen een bevestigd winkeladres gaat naar Firebase; coördinaten blijven op je telefoon.",
  },
];

export const normalizeDataSharing = (value = {}) => ({
  // De eerdere toestemming om coördinaten in Firebase op te slaan
  // wordt niet hergebruikt voor deze nieuwe winkelbevestiging.
  allowStorePresence: value.allowStorePresence === true,
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
