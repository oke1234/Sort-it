import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles, COLORS} from "./styles";

import {
  STORAGE_KEY,
  STORE_KEY,
  stores,
  storeRoutes,
  categoryIcons,
} from "./shoppingData";

import { getCategory } from "./categoryService";

export default function App() {
  const [items, setItems] = useState([]);
  const [selectedStore, setSelectedStore] = useState("Lidl");
  const [newItem, setNewItem] = useState("");
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [storeModalVisible, setStoreModalVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loaded) return;

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {
      Alert.alert("Fout", "De boodschappen konden niet worden opgeslagen.");
    });
  }, [items, loaded]);

  useEffect(() => {
    if (!loaded) return;

    AsyncStorage.setItem(STORE_KEY, selectedStore).catch(() => {
      Alert.alert("Fout", "De winkel kon niet worden opgeslagen.");
    });
  }, [selectedStore, loaded]);

  const loadData = async () => {
    try {
      const [savedItems, savedStore] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(STORE_KEY),
      ]);

      if (savedItems) {
        setItems(JSON.parse(savedItems));
      }

      if (savedStore && stores.includes(savedStore)) {
        setSelectedStore(savedStore);
      }
    } catch {
      Alert.alert("Fout", "De boodschappen konden niet worden geladen.");
    } finally {
      setLoaded(true);
    }
  };

  const openItemModal = () => {
    setNewItem("");
    setItemModalVisible(true);
  };

  const closeItemModal = () => {
    setNewItem("");
    setItemModalVisible(false);
  };

  const addItem = async () => {
    const cleanedName = newItem.trim();

    if (!cleanedName) return;

    try {
      const category = await getCategory(
        cleanedName,
        selectedStore
      );

      console.log(
        "Product:",
        cleanedName,
        "Categorie:",
        category
      );

      const item = {
        id: `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        name: cleanedName,
        category,
        completed: false,
      };

      setItems((currentItems) => [
        ...currentItems,
        item,
      ]);

      closeItemModal();
    } catch (error) {
      console.error(
        "Product toevoegen mislukt:",
        error
      );

      Alert.alert(
        "Fout",
        "Het product kon niet worden toegevoegd."
      );
    }
  };

  const toggleItem = (id) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? { ...item, completed: !item.completed }
          : item
      )
    );
  };

  const removeItem = (id) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== id)
    );
  };

  const confirmRemoveItem = (item) => {
    Alert.alert(
      "Product verwijderen",
      `Wil je "${item.name}" verwijderen?`,
      [
        {
          text: "Annuleren",
          style: "cancel",
        },
        {
          text: "Verwijderen",
          style: "destructive",
          onPress: () => removeItem(item.id),
        },
      ]
    );
  };

  const clearCompleted = () => {
    const completedCount = items.filter((item) => item.completed).length;

    if (completedCount === 0) {
      Alert.alert("Nog niets afgevinkt", "Er zijn geen producten om te verwijderen.");
      return;
    }

    Alert.alert(
      "Lijst opruimen",
      `Wil je ${completedCount} afgevinkte ${
        completedCount === 1 ? "boodschap" : "boodschappen"
      } verwijderen?`,
      [
        {
          text: "Annuleren",
          style: "cancel",
        },
        {
          text: "Verwijderen",
          style: "destructive",
          onPress: () => {
            setItems((currentItems) =>
              currentItems.filter((item) => !item.completed)
            );
          },
        },
      ]
    );
  };

  const openCount = useMemo(
    () => items.filter((item) => !item.completed).length,
    [items]
  );

  const completedCount = items.length - openCount;

  const sections = useMemo(() => {
    const route = storeRoutes[selectedStore] ?? storeRoutes.Lidl;

    return route
      .map((category) => ({
        title: category,
        data: items
          .filter((item) => item.category === category)
          .sort((a, b) => {
            if (a.completed !== b.completed) {
              return a.completed ? 1 : -1;
            }

            return a.name.localeCompare(b.name, "nl");
          }),
      }))
      .filter((section) => section.data.length > 0);
  }, [items, selectedStore]);

  const renderItem = ({ item, index, section }) => {
    const isLastItem = index === section.data.length - 1;

    return (
      <View
        style={[
          styles.itemRow,
          !isLastItem && styles.itemRowBorder,
          isLastItem && styles.lastItemRow,
        ]}
      >
        <TouchableOpacity
          style={styles.itemMain}
          onPress={() => toggleItem(item.id)}
          onLongPress={() => confirmRemoveItem(item)}
          activeOpacity={0.65}
        >
          <View
            style={[
              styles.checkbox,
              item.completed && styles.checkboxCompleted,
            ]}
          >
            {item.completed && (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            )}
          </View>

          <Text
            style={[
              styles.itemText,
              item.completed && styles.completedItemText,
            ]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => confirmRemoveItem(item)}
          style={styles.deleteButton}
          activeOpacity={0.65}
          accessibilityLabel={`${item.name} verwijderen`}
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color={COLORS.danger}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleGroup}>
        <View style={styles.sectionIcon}>
          <Ionicons
            name={categoryIcons[section.title] ?? "basket-outline"}
            size={15}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.sectionTitle}>
          {section.title}
        </Text>
      </View>

      <Text style={styles.sectionCountText}>
        {section.data.length}
      </Text>
    </View>
  );

  const renderListHeader = () => (
    <>
      <View style={styles.simpleHeader}>
        <View>
          <Text style={styles.simpleEyebrow}>
            MIJN BOODSCHAPPEN
          </Text>

          <Text style={styles.simpleTitle}>
            Boodschappenlijst
          </Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              {openCount} open
            </Text>

            <View style={styles.summaryDot} />

            <Text style={styles.summaryText}>
              {completedCount} klaar
            </Text>

            <View style={styles.summaryDot} />

            <Text style={styles.summaryText}>
              {items.length} totaal
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.cleanButton}
          onPress={clearCompleted}
          activeOpacity={0.7}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={20}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.storeSelector}
        onPress={() => setStoreModalVisible(true)}
        activeOpacity={0.75}
      >
        <View style={styles.storeSelectorIcon}>
          <Ionicons
            name="storefront-outline"
            size={20}
            color={COLORS.primary}
          />
        </View>

        <View style={styles.storeSelectorContent}>
          <Text style={styles.storeSelectorLabel}>
            Winkel
          </Text>

          <Text style={styles.storeSelectorText}>
            {selectedStore}
          </Text>
        </View>

        <Ionicons
          name="chevron-down"
          size={19}
          color={COLORS.textSoft}
        />
      </TouchableOpacity>

      <View style={styles.listHeading}>
        <Text style={styles.listTitle}>
          Jouw lijst
        </Text>
      </View>
    </>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="basket-outline" size={43} color={COLORS.primary} />
      </View>

      <Text style={styles.emptyTitle}>Je lijst is nog leeg</Text>

      <Text style={styles.emptyText}>
        Voeg een product toe. De app kiest zelf de juiste categorie.
      </Text>

      <TouchableOpacity
        style={styles.emptyButton}
        onPress={openItemModal}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>Eerste product toevoegen</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmptyList}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            sections.length === 0 && styles.emptyListContent,
          ]}
          SectionSeparatorComponent={() => <View style={styles.sectionSpacing} />}
        />

        {sections.length > 0 && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={openItemModal}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={31} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={itemModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeItemModal}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={closeItemModal}
        >
          <Pressable
            style={styles.bottomSheet}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.modalHandle} />

            <View style={styles.modalHeadingRow}>
              <View>
                <Text style={styles.modalEyebrow}>NIEUW PRODUCT</Text>
                <Text style={styles.modalTitle}>Wat heb je nodig?</Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeItemModal}
              >
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              De app plaatst het product automatisch in de juiste afdeling.
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="search-outline"
                size={21}
                color={COLORS.textSoft}
              />

              <TextInput
                style={styles.input}
                value={newItem}
                onChangeText={setNewItem}
                placeholder="Bijvoorbeeld 2 pakken melk"
                placeholderTextColor="#98A19B"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={addItem}
                maxLength={80}
              />

              {newItem.length > 0 && (
                <TouchableOpacity onPress={() => setNewItem("")}>
                  <Ionicons
                    name="close-circle"
                    size={21}
                    color="#A7AFA9"
                  />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                !newItem.trim() && styles.saveButtonDisabled,
              ]}
              onPress={addItem}
              disabled={!newItem.trim()}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={21} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Toevoegen aan lijst</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={storeModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setStoreModalVisible(false)}
      >
        <Pressable
          style={styles.centerModalBackdrop}
          onPress={() => setStoreModalVisible(false)}
        >
          <Pressable
            style={styles.storeModal}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.storeModalIcon}>
              <Ionicons
                name="storefront-outline"
                size={27}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.storeModalTitle}>Kies je winkel</Text>

            <Text style={styles.storeModalText}>
              De volgorde van de categorieën past zich aan de winkel aan.
            </Text>

            <View style={styles.storeOptions}>
              {stores.map((store) => {
                const selected = selectedStore === store;

                return (
                  <TouchableOpacity
                    key={store}
                    style={[
                      styles.storeOption,
                      selected && styles.storeOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedStore(store);
                      setStoreModalVisible(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.storeOptionRadio,
                        selected && styles.storeOptionRadioSelected,
                      ]}
                    >
                      {selected && <View style={styles.storeOptionRadioDot} />}
                    </View>

                    <Text
                      style={[
                        styles.storeOptionText,
                        selected && styles.storeOptionTextSelected,
                      ]}
                    >
                      {store}
                    </Text>

                    {selected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={COLORS.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
