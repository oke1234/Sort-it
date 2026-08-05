import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

import { loadDataSharing } from "./dataSharing";

export const STORE_PRESENCE_RADIUS_METERS = 150;
export const STORE_PRESENCE_IDLE_MS = 5000;

const STORE_PRESENCE_KEY = "SORTIT_STORE_PRESENCE";
const RESPONSE_COOLDOWN_MS = 60 * 60 * 1000;
export const STORE_CONFIRMATION_VALID_MS = 60 * 60 * 1000;
const ACTIVE_GPS_COOLDOWN_MS = 60 * 60 * 1000;
const LAST_KNOWN_MAX_AGE_MS = 5 * 60 * 1000;
const MAX_SAVED_RESPONSES = 20;

const activePositionRequests = new Map();
const addressCache = new Map();
const confirmedResponseCache = new Map();

const getStorageKey = (userId) =>
  `${STORE_PRESENCE_KEY}:${userId}`;

const getConfirmedResponseCacheKey = (
  userId,
  listId,
  storeName
) => `${userId}:${listId}:${storeName}`;

const normalizeState = (value = {}) => ({
  lastActiveRequestAt: Number.isFinite(
    value.lastActiveRequestAt
  )
    ? value.lastActiveRequestAt
    : 0,
  responses: Array.isArray(value.responses)
    ? value.responses.filter(
        (response) =>
          typeof response?.storeName === "string" &&
          Number.isFinite(response.latitude) &&
          Number.isFinite(response.longitude) &&
          Number.isFinite(response.answeredAt)
      )
    : [],
});

const loadState = async (userId) => {
  if (!userId) return normalizeState();

  try {
    const saved = await AsyncStorage.getItem(
      getStorageKey(userId)
    );

    return saved
      ? normalizeState(JSON.parse(saved))
      : normalizeState();
  } catch {
    return normalizeState();
  }
};

const saveState = (userId, state) =>
  AsyncStorage.setItem(
    getStorageKey(userId),
    JSON.stringify(normalizeState(state))
  );

const degreesToRadians = (degrees) =>
  (degrees * Math.PI) / 180;

export const getDistanceInMeters = (first, second) => {
  const earthRadiusMeters = 6371000;
  const latitudeDelta = degreesToRadians(
    second.latitude - first.latitude
  );
  const longitudeDelta = degreesToRadians(
    second.longitude - first.longitude
  );
  const firstLatitude = degreesToRadians(first.latitude);
  const secondLatitude = degreesToRadians(second.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    2 *
    earthRadiusMeters *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
};

const normalizePosition = (position) => {
  const latitude = position?.coords?.latitude;
  const longitude = position?.coords?.longitude;
  const accuracyMeters = position?.coords?.accuracy;

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(accuracyMeters) ||
    accuracyMeters > STORE_PRESENCE_RADIUS_METERS
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
    accuracyMeters,
    detectedAt: Number.isFinite(position.timestamp)
      ? position.timestamp
      : Date.now(),
  };
};

const getCurrentPositionOnce = (userId) => {
  const activeRequest = activePositionRequests.get(userId);

  if (activeRequest) return activeRequest;

  const request = Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  })
    .then(normalizePosition)
    .catch(() => null)
    .finally(() => {
      if (activePositionRequests.get(userId) === request) {
        activePositionRequests.delete(userId);
      }
    });

  activePositionRequests.set(userId, request);
  return request;
};

const formatAddress = (address) => {
  if (!address) return "";

  if (address.formattedAddress?.trim()) {
    return address.formattedAddress.trim();
  }

  const street = [address.street, address.streetNumber]
    .filter(Boolean)
    .join(" ")
    .trim();
  const locality = [address.postalCode, address.city]
    .filter(Boolean)
    .join(" ")
    .trim();

  return [street || address.name, locality, address.country]
    .filter(Boolean)
    .filter(
      (part, index, parts) =>
        parts.indexOf(part) === index
    )
    .join(", ");
};

const getAddressForPosition = async (position) => {
  if (!position) return "";

  const cacheKey =
    `${position.latitude.toFixed(4)}:${position.longitude.toFixed(4)}`;

  if (addressCache.has(cacheKey)) {
    return addressCache.get(cacheKey);
  }

  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude: position.latitude,
      longitude: position.longitude,
    });
    const address = formatAddress(addresses[0]);

    console.log("Co\u00f6rdinaten aan adres gekoppeld:", {
      latitude: position.latitude,
      longitude: position.longitude,
      address,
    });

    addressCache.set(cacheKey, address);
    return address;
  } catch {
    addressCache.set(cacheKey, "");
    return "";
  }
};

const hasRecentNearbyResponse = (
  state,
  storeName,
  position,
  now
) =>
  state.responses.some(
    (response) =>
      response.storeName === storeName &&
      now - response.answeredAt < RESPONSE_COOLDOWN_MS &&
      getDistanceInMeters(response, position) <=
        STORE_PRESENCE_RADIUS_METERS
  );

export const getStorePresenceCandidate = async (
  userId,
  storeName
) => {
  if (!userId || !storeName) return null;

  try {
    const sharing = await loadDataSharing(userId);

    if (!sharing.allowStorePresence) return null;

    const permission =
      await Location.getForegroundPermissionsAsync();

    if (permission.status !== "granted") return null;

    const state = await loadState(userId);
    const now = Date.now();
    const lastKnown =
      await Location.getLastKnownPositionAsync({
        maxAge: LAST_KNOWN_MAX_AGE_MS,
        requiredAccuracy: STORE_PRESENCE_RADIUS_METERS,
      });
    let position = normalizePosition(lastKnown);

    if (
      !position &&
      now - state.lastActiveRequestAt >=
        ACTIVE_GPS_COOLDOWN_MS
    ) {
      state.lastActiveRequestAt = now;
      await saveState(userId, state);
      position = await getCurrentPositionOnce(userId);
    }

    if (
      !position ||
      hasRecentNearbyResponse(
        state,
        storeName,
        position,
        now
      )
    ) {
      return null;
    }

    const latestSharing = await loadDataSharing(userId);

    if (!latestSharing.allowStorePresence) return null;

    const address = await getAddressForPosition(position);

    return {
      storeName,
      address,
      ...position,
    };
  } catch (error) {
    console.warn(
      "Winkelbevestiging voorbereiden mislukt:",
      error
    );
    return null;
  }
};

export const saveStorePresenceResponse = async (
  userId,
  candidate,
  confirmed,
  answeredAt = Date.now()
) => {
  if (!userId || !candidate) return;

  const response = {
    storeName: candidate.storeName,
    listId: candidate.listId ?? "",
    address: candidate.address ?? "",
    confirmationId: candidate.confirmationId ?? "",
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    answeredAt,
    confirmed: confirmed === true,
  };
  const cacheKey = getConfirmedResponseCacheKey(
    userId,
    response.listId,
    response.storeName
  );

  if (response.confirmed) {
    confirmedResponseCache.set(cacheKey, response);
  } else {
    confirmedResponseCache.delete(cacheKey);
  }

  const state = await loadState(userId);

  await saveState(userId, {
    ...state,
    responses: [response, ...state.responses]
      .filter(
        (savedResponse) =>
          answeredAt - savedResponse.answeredAt <
          RESPONSE_COOLDOWN_MS
      )
      .slice(0, MAX_SAVED_RESPONSES),
  });
};

export const getRecentConfirmedStoreLocation = async (
  userId,
  listId,
  storeName,
  now = Date.now()
) => {
  if (!userId || !listId || !storeName) return null;

  const cacheKey = getConfirmedResponseCacheKey(
    userId,
    listId,
    storeName
  );
  let response = confirmedResponseCache.get(cacheKey);

  if (
    !response ||
    now - response.answeredAt < 0 ||
    now - response.answeredAt >= STORE_CONFIRMATION_VALID_MS
  ) {
    const state = await loadState(userId);
    const latestResponse = state.responses.find(
      (savedResponse) =>
        savedResponse.listId === listId &&
        savedResponse.storeName === storeName &&
        now - savedResponse.answeredAt >= 0 &&
        now - savedResponse.answeredAt <
          STORE_CONFIRMATION_VALID_MS
    );
    response = latestResponse?.confirmed
      ? latestResponse
      : null;

    if (response) {
      confirmedResponseCache.set(cacheKey, response);
    } else {
      confirmedResponseCache.delete(cacheKey);
    }
  }

  if (!response) return null;

  return {
    storeName: response.storeName,
    address: response.address ?? "",
    confirmedAt: response.answeredAt,
    confirmationId: response.confirmationId ?? "",
  };
};

export const clearStorePresenceData = async (userId) => {
  if (!userId) return;

  activePositionRequests.delete(userId);
  Array.from(confirmedResponseCache.keys())
    .filter((key) => key.startsWith(`${userId}:`))
    .forEach((key) => confirmedResponseCache.delete(key));
  await AsyncStorage.removeItem(getStorageKey(userId));
};
