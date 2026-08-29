import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { auth } from "./firebaseConfig";
import { usePremium } from "./PremiumContext";
import {
  generatePremiumSuggestions,
  recordSuggestionFeedback,
} from "./premiumService";
import { COLORS, styles } from "./styles";

const AUTO_DEBOUNCE_MS = 1400;
const AUTO_SUGGESTION_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const ASSISTANT_CACHE_PREFIX = "SORTIT_ASSISTANT_CACHE_V1";

const suggestionId = (suggestion) =>
  String(suggestion?.name ?? "product")
    .trim()
    .toLocaleLowerCase("nl")
    .replace(/[^a-z0-9-]/g, "-")
    .slice(0, 80);

const sanitizeCache = (value) => {
  if (!value || typeof value !== "object") return {};

  const oldestAllowed = Date.now() - CACHE_MAX_AGE_MS;
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => {
      if (!entry || typeof entry !== "object") return false;
      const timestamp = Math.max(
        Number(entry.createdAt) || 0,
        Number(entry.lastDecisionAt) || 0
      );
      return timestamp >= oldestAllowed;
    })
  );
};

export default function PremiumAssistant({
  items,
  listId,
  enabled,
  isOnline,
  navigation,
  onAddProduct,
}) {
  const premium = usePremium();
  const userId = auth.currentUser?.uid ?? "";
  const cacheKey = userId ? `${ASSISTANT_CACHE_PREFIX}:${userId}` : "";
  const [assistantState, setAssistantState] = useState({});
  const [cacheReady, setCacheReady] = useState(false);
  const [loadingListId, setLoadingListId] = useState("");
  const [adding, setAdding] = useState(false);
  const cacheWriteRef = useRef(Promise.resolve());
  const observationsRef = useRef({});
  const previousActiveListRef = useRef("");
  const requestSequenceRef = useRef(0);

  const openItems = useMemo(
    () => items.filter((item) => !item.completed),
    [items]
  );
  const signature = useMemo(
    () =>
      openItems
        .map((item) => String(item.name).trim().toLocaleLowerCase("nl"))
        .sort()
        .join("|"),
    [openItems]
  );
  const currentState = assistantState[listId] ?? {};
  const pendingSuggestion = currentState.pendingSuggestion ?? null;

  useEffect(() => {
    let active = true;
    setAssistantState({});
    setCacheReady(false);
    observationsRef.current = {};
    previousActiveListRef.current = "";

    if (!cacheKey) {
      return () => {
        active = false;
      };
    }

    AsyncStorage.getItem(cacheKey)
      .then((stored) => {
        if (!active) return;
        const parsed = stored ? JSON.parse(stored) : {};
        setAssistantState(sanitizeCache(parsed));
      })
      .catch(() => {
        if (active) setAssistantState({});
      })
      .finally(() => {
        if (active) setCacheReady(true);
      });

    return () => {
      active = false;
    };
  }, [cacheKey]);

  const updateListState = useCallback(
    (targetListId, updater) => {
      setAssistantState((current) => {
        const currentEntry = current[targetListId] ?? {};
        const nextEntry =
          typeof updater === "function" ? updater(currentEntry) : updater;
        const next = {
          ...current,
          [targetListId]: nextEntry,
        };

        if (cacheKey) {
          cacheWriteRef.current = cacheWriteRef.current
            .catch(() => {})
            .then(() => AsyncStorage.setItem(cacheKey, JSON.stringify(next)));
        }

        return next;
      });
    },
    [cacheKey]
  );

  const loadSuggestion = useCallback(async () => {
    if (!isOnline || !enabled || !openItems.length || loadingListId) return;

    const targetListId = listId;
    const targetSignature = signature;
    const targetItems = openItems;
    const sequence = ++requestSequenceRef.current;
    setLoadingListId(targetListId);

    try {
      const result = await generatePremiumSuggestions({
        currentItems: targetItems,
        mode: "contextual",
      });
      if (sequence !== requestSequenceRef.current) return;

      const suggestion = result?.suggestions?.[0] ?? null;
      const now = Date.now();
      updateListState(targetListId, (current) => ({
        ...current,
        suggestionSetId: result?.suggestionSetId ?? "",
        suggestionId: suggestion ? suggestionId(suggestion) : "",
        pendingSuggestion: suggestion,
        source: result?.source ?? "",
        contextSignature: targetSignature,
        createdAt: now,
        lastDecisionAt: suggestion ? current.lastDecisionAt ?? 0 : now,
      }));
    } catch {
      // Automatische suggesties blijven stil bij een tijdelijke netwerkfout.
      updateListState(targetListId, (current) => ({
        ...current,
        contextSignature: targetSignature,
        lastDecisionAt: Date.now(),
      }));
    } finally {
      if (sequence === requestSequenceRef.current) setLoadingListId("");
    }
  }, [enabled, isOnline, listId, loadingListId, openItems, signature, updateListState]);

  useEffect(() => {
    if (!cacheReady) return undefined;

    const switchedList =
      previousActiveListRef.current && previousActiveListRef.current !== listId;
    previousActiveListRef.current = listId;

    const previousObservation = observationsRef.current[listId];
    observationsRef.current[listId] = { enabled, signature };

    if (!previousObservation || switchedList) return undefined;

    const justEnabled = !previousObservation.enabled && enabled;
    const contentChanged = previousObservation.signature !== signature;
    const lastActivityAt = Math.max(
      Number(currentState.createdAt) || 0,
      Number(currentState.lastDecisionAt) || 0
    );
    const cooldownPassed =
      !lastActivityAt || Date.now() - lastActivityAt >= AUTO_SUGGESTION_COOLDOWN_MS;

    if (
      !premium.premiumActive ||
      premium.consent?.granted !== true ||
      !enabled ||
      !isOnline ||
      openItems.length === 0 ||
      pendingSuggestion ||
      loadingListId ||
      !cooldownPassed ||
      (!justEnabled && !contentChanged)
    ) {
      return undefined;
    }

    const timer = setTimeout(loadSuggestion, AUTO_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [
    cacheReady,
    currentState.createdAt,
    currentState.lastDecisionAt,
    enabled,
    isOnline,
    listId,
    loadSuggestion,
    loadingListId,
    openItems.length,
    pendingSuggestion,
    premium.consent?.granted,
    premium.premiumActive,
    signature,
  ]);

  const finishSuggestion = (action) => {
    if (currentState.suggestionSetId && currentState.suggestionId) {
      recordSuggestionFeedback({
        suggestionSetId: currentState.suggestionSetId,
        suggestionId: currentState.suggestionId,
        action,
      }).catch(() => null);
    }

    updateListState(listId, (current) => ({
      ...current,
      pendingSuggestion: null,
      lastDecisionAt: Date.now(),
    }));
  };

  const acceptSuggestion = async () => {
    if (!pendingSuggestion || adding) return;
    setAdding(true);
    try {
      await onAddProduct(pendingSuggestion.name);
      finishSuggestion("accepted");
    } catch {
      Alert.alert(
        "Niet toegevoegd",
        `${pendingSuggestion.name} kon niet worden toegevoegd.`
      );
    } finally {
      setAdding(false);
    }
  };

  if (!premium.premiumActive) {
    return (
      <TouchableOpacity
        style={styles.premiumTeaser}
        onPress={() => navigation.navigate("Premium")}
        activeOpacity={0.82}
        accessibilityRole="button"
      >
        <View style={styles.premiumTeaserIcon}>
          <Ionicons name="sparkles" size={17} color="#FFFFFF" />
        </View>
        <View style={styles.premiumTeaserCopy}>
          <Text style={styles.premiumTeaserTitle}>Slimme assistent</Text>
          <Text style={styles.premiumTeaserText}>
            Ontdek persoonlijke suggesties in SortIt Pro
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={19} color="#8A651B" />
      </TouchableOpacity>
    );
  }

  if (premium.consent?.granted !== true) {
    return (
      <TouchableOpacity
        style={styles.premiumConsentCard}
        onPress={() => navigation.navigate("Premium")}
        activeOpacity={0.82}
      >
        <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.primaryDark} />
        <Text style={styles.premiumConsentText}>
          Geef toestemming om je persoonlijke kookprofiel en slimme suggesties te activeren.
        </Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.primaryDark} />
      </TouchableOpacity>
    );
  }

  if (!enabled || !pendingSuggestion) return null;

  return (
    <View style={styles.premiumAssistant}>
      <View style={styles.premiumAssistantHeader}>
        <View style={styles.premiumAssistantIcon}>
          <Ionicons name="sparkles" size={17} color="#FFFFFF" />
        </View>
        <View style={styles.premiumAssistantCopy}>
          <Text style={styles.premiumAssistantTitle}>Slimme suggestie</Text>
          <Text style={styles.premiumAssistantSubtitle}>
            Deze blijft staan tot je kiest
          </Text>
        </View>
      </View>

      <View style={styles.premiumSuggestionPrompt}>
        <Text style={styles.premiumSuggestionQuestion}>
          {pendingSuggestion.name} toevoegen?
        </Text>
        <Text style={styles.premiumSuggestionReason}>{pendingSuggestion.reason}</Text>
      </View>

      <View style={styles.premiumSuggestionActions}>
        <TouchableOpacity
          style={styles.premiumSuggestionNo}
          onPress={() => finishSuggestion("rejected")}
          disabled={adding}
          accessibilityRole="button"
          accessibilityLabel={`${pendingSuggestion.name} niet toevoegen`}
        >
          <Text style={styles.premiumSuggestionNoText}>Nee</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.premiumSuggestionYes}
          onPress={acceptSuggestion}
          disabled={adding}
          accessibilityRole="button"
          accessibilityLabel={`${pendingSuggestion.name} toevoegen`}
        >
          {adding ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="add" size={17} color="#FFFFFF" />
              <Text style={styles.premiumSuggestionYesText}>Ja, toevoegen</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
