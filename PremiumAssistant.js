import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { usePremium } from "./PremiumContext";
import {
  generatePremiumSuggestions,
  getPremiumErrorMessage,
  recordSuggestionFeedback,
} from "./premiumService";
import { COLORS, styles } from "./styles";

const AUTO_DEBOUNCE_MS = 1400;
const MIN_REQUEST_INTERVAL_MS = 10000;

const suggestionId = (suggestion, index) =>
  `${String(suggestion.name ?? "product").toLocaleLowerCase("nl")}-${index}`
    .replace(/[^a-z0-9-]/g, "-")
    .slice(0, 80);

export default function PremiumAssistant({
  items,
  listId,
  isOnline,
  navigation,
  onAddProduct,
}) {
  const premium = usePremium();
  const [result, setResult] = useState(null);
  const [loadingMode, setLoadingMode] = useState("");
  const [hiddenIds, setHiddenIds] = useState(() => new Set());
  const [addingIds, setAddingIds] = useState(() => new Set());
  const lastRequestAtRef = useRef(0);
  const lastSignatureRef = useRef("");
  const requestSequenceRef = useRef(0);

  const openItems = useMemo(
    () => items.filter((item) => !item.completed),
    [items]
  );
  const signature = useMemo(
    () =>
      `${listId}:${openItems
        .map((item) => String(item.name).trim().toLocaleLowerCase("nl"))
        .sort()
        .join("|")}`,
    [listId, openItems]
  );

  const loadSuggestions = async (mode, { silent = false } = {}) => {
    if (!isOnline) {
      if (!silent) Alert.alert("Geen internet", "Nieuwe slimme suggesties hebben internet nodig.");
      return;
    }
    const sequence = ++requestSequenceRef.current;
    setLoadingMode(mode);
    try {
      const next = await generatePremiumSuggestions({
        currentItems: openItems,
        mode,
      });
      if (sequence !== requestSequenceRef.current) return;
      setResult(next);
      setHiddenIds(new Set());
      lastRequestAtRef.current = Date.now();
      lastSignatureRef.current = signature;
    } catch (error) {
      if (!silent) Alert.alert("Suggesties niet geladen", getPremiumErrorMessage(error));
    } finally {
      if (sequence === requestSequenceRef.current) setLoadingMode("");
    }
  };

  useEffect(() => {
    setResult(null);
    setHiddenIds(new Set());
    lastSignatureRef.current = "";
  }, [listId]);

  useEffect(() => {
    if (
      !premium.premiumActive ||
      premium.consent?.granted !== true ||
      !isOnline ||
      openItems.length === 0 ||
      signature === lastSignatureRef.current
    ) {
      return undefined;
    }

    const timeUntilAllowed = Math.max(
      0,
      MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAtRef.current)
    );
    const timer = setTimeout(
      () => loadSuggestions("contextual", { silent: true }),
      AUTO_DEBOUNCE_MS + timeUntilAllowed
    );
    return () => clearTimeout(timer);
  }, [isOnline, openItems.length, premium.consent?.granted, premium.premiumActive, signature]);

  const sendFeedback = (id, action) => {
    if (!result?.suggestionSetId) return;
    recordSuggestionFeedback({
      suggestionSetId: result.suggestionSetId,
      suggestionId: id,
      action,
    }).catch(() => null);
  };

  const acceptSuggestion = async (suggestion, index) => {
    const id = suggestionId(suggestion, index);
    setAddingIds((current) => new Set([...current, id]));
    try {
      await onAddProduct(suggestion.name);
      setHiddenIds((current) => new Set([...current, id]));
      sendFeedback(id, "accepted");
    } catch {
      Alert.alert("Niet toegevoegd", `${suggestion.name} kon niet worden toegevoegd.`);
    } finally {
      setAddingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  const dismissSuggestion = (suggestion, index) => {
    const id = suggestionId(suggestion, index);
    setHiddenIds((current) => new Set([...current, id]));
    sendFeedback(id, "dismissed");
  };

  const addAll = async () => {
    const available = visibleSuggestions;
    if (!available.length) return;
    for (let index = 0; index < available.length; index += 1) {
      await acceptSuggestion(available[index], index);
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
          <Text style={styles.premiumTeaserText}>Ontdek persoonlijke suggesties in SortIt Pro</Text>
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

  const visibleSuggestions = (result?.suggestions ?? [])
    .filter((suggestion, index) => !hiddenIds.has(suggestionId(suggestion, index)))
    .slice(0, 3);

  return (
    <View style={styles.premiumAssistant}>
      <View style={styles.premiumAssistantHeader}>
        <View style={styles.premiumAssistantIcon}>
          <Ionicons name="sparkles" size={18} color="#FFFFFF" />
        </View>
        <View style={styles.premiumAssistantCopy}>
          <Text style={styles.premiumAssistantTitle}>Slimme assistent</Text>
          <Text style={styles.premiumAssistantSubtitle}>
            {loadingMode
              ? "Je lijst wordt bekeken…"
              : result?.source === "deterministic"
                ? "Persoonlijke suggesties · slimme fallback"
                : "Op basis van je lijst en kookprofiel"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.premiumGenerateButton}
          onPress={() => loadSuggestions("full_list")}
          disabled={Boolean(loadingMode)}
          accessibilityRole="button"
          accessibilityLabel="Compleet boodschappenlijstvoorstel maken"
        >
          {loadingMode === "full_list" ? (
            <ActivityIndicator size="small" color={COLORS.primaryDark} />
          ) : (
            <Ionicons name="list-outline" size={19} color={COLORS.primaryDark} />
          )}
        </TouchableOpacity>
      </View>

      {!isOnline && (
        <View style={styles.premiumOfflineRow}>
          <Ionicons name="cloud-offline-outline" size={15} color={COLORS.textSoft} />
          <Text style={styles.premiumOfflineText}>Offline · bestaande lijsten blijven werken</Text>
        </View>
      )}

      {loadingMode && !result && (
        <View style={styles.premiumLoadingRow}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.premiumLoadingText}>Passende producten zoeken…</Text>
        </View>
      )}

      {visibleSuggestions.map((suggestion, index) => {
        const id = suggestionId(suggestion, index);
        return (
          <View style={styles.premiumSuggestion} key={id}>
            <View style={styles.premiumSuggestionCopy}>
              <Text style={styles.premiumSuggestionName}>{suggestion.name}</Text>
              <Text style={styles.premiumSuggestionReason}>{suggestion.reason}</Text>
            </View>
            <TouchableOpacity
              style={styles.premiumDismissButton}
              onPress={() => dismissSuggestion(suggestion, index)}
              accessibilityLabel={`${suggestion.name} verbergen`}
            >
              <Ionicons name="close" size={17} color={COLORS.textSoft} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.premiumAddSuggestion}
              onPress={() => acceptSuggestion(suggestion, index)}
              disabled={addingIds.has(id)}
              accessibilityLabel={`${suggestion.name} toevoegen`}
            >
              {addingIds.has(id) ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="add" size={19} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        );
      })}

      {(result?.mealIdeas ?? []).slice(0, 1).map((idea) => (
        <View style={styles.premiumMealIdea} key={idea.title}>
          <Ionicons name="restaurant-outline" size={17} color="#8A651B" />
          <View style={styles.premiumMealCopy}>
            <Text style={styles.premiumMealTitle}>{idea.title}</Text>
            <Text style={styles.premiumMealText}>{idea.reason}</Text>
          </View>
        </View>
      ))}

      {result && visibleSuggestions.length === 0 && (
        <Text style={styles.premiumEmptyText}>
          Je lijst ziet er compleet uit. Tik op het lijst-icoon voor een nieuw weekvoorstel.
        </Text>
      )}

      {visibleSuggestions.length > 1 && (
        <TouchableOpacity style={styles.premiumAddAllButton} onPress={addAll}>
          <Ionicons name="add-circle-outline" size={17} color={COLORS.primaryDark} />
          <Text style={styles.premiumAddAllText}>Voeg alle {visibleSuggestions.length} toe</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
