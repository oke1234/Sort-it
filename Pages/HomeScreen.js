import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles, COLORS} from "../styles";
import { Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";

import {
  onValue,
  ref,
  set,
  update,
  remove,
} from "firebase/database";

import { auth, db } from "../firebaseConfig";

import {
  STORAGE_KEY,
  STORE_KEY,
  stores,
  storeRoutes,
  categoryIcons,
} from "../shoppingData";

import { getCategory } from "../categoryService";

const DRAG_HOLD_MS = 500;

function DraggableItemRow({
  item,
  isLastItem,
  isDragging,
  onToggle,
  onDelete,
  onstart,
  onDragMove,
  onDragEnd,
  onDragCancel,
}) {
  const longPressActivatedRef = useRef(false);
  const panActiveRef = useRef(false);
  const suppressPressRef = useRef(false);
  const propsRef = useRef({});

  propsRef.current = {
    item,
    isDragging,
    onToggle,
    onDelete,
    onstart,
    onDragMove,
    onDragEnd,
    onDragCancel,
  };

  const clearPressSuppressionSoon = () => {
    setTimeout(() => {
      suppressPressRef.current = false;
    }, 350);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,

      onMoveShouldSetPanResponder: () => {
        return longPressActivatedRef.current;
      },

      onMoveShouldSetPanResponderCapture: () => {
        return longPressActivatedRef.current;
      },

      onPanResponderGrant: (event) => {
        panActiveRef.current = true;

        propsRef.current.onDragMove(
          event.nativeEvent.pageX,
          event.nativeEvent.pageY
        );
      },

      onPanResponderMove: (_, gestureState) => {
        propsRef.current.onDragMove(
          gestureState.moveX,
          gestureState.moveY
        );
      },

      onPanResponderRelease: (_, gestureState) => {
        panActiveRef.current = false;
        longPressActivatedRef.current = false;

        propsRef.current.onDragEnd(
          gestureState.moveX,
          gestureState.moveY
        );

        clearPressSuppressionSoon();
      },

      onPanResponderTerminate: () => {
        panActiveRef.current = false;
        longPressActivatedRef.current = false;

        propsRef.current.onDragCancel();

        clearPressSuppressionSoon();
      },

      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
    })
  ).current;

  const handleLongPress = (event) => {
    longPressActivatedRef.current = true;
    suppressPressRef.current = true;

    propsRef.current.onstart(
      item,
      event.nativeEvent.pageX,
      event.nativeEvent.pageY
    );
  };

  const handlePress = () => {
    if (
      suppressPressRef.current ||
      propsRef.current.isDragging
    ) {
      suppressPressRef.current = false;
      return;
    }

    propsRef.current.onToggle(item.id);
  };

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.itemRow,
        !isLastItem && styles.itemRowBorder,
        isLastItem && styles.lastItemRow,
        isDragging && styles.originalItemWhileDragging,
      ]}
    >
      <TouchableOpacity
        style={styles.itemMain}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={DRAG_HOLD_MS}
        pressRetentionOffset={{
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        }}
        activeOpacity={0.65}
      >
        <View
          style={[
            styles.checkbox,
            item.completed && styles.checkboxCompleted,
          ]}
        >
          {item.completed && (
            <Ionicons
              name="checkmark"
              size={16}
              color="#FFFFFF"
            />
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
        onPress={() => propsRef.current.onDelete(item)}
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
}

export default function App() {
  const [items, setItems] = useState([]);
  const [selectedStore, setSelectedStore] = useState("Lidl");
  const [newItem, setNewItem] = useState("");
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [storeModalVisible, setStoreModalVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [activeDropCategory, setActiveDropCategory] =
    useState(null);

  const dragPosition = useRef(
    new Animated.ValueXY()
  ).current;

  const overlayRef = useRef(null);

  const overlayOriginRef = useRef({
    x: 0,
    y: 0,
  });

  const categoryDropRefs = useRef({});
  const categoryZonesRef = useRef({});
  const draggedItemRef = useRef(null);
  const activeDropCategoryRef = useRef(null);

  const navigation = useNavigation();

  const currentStore =
    stores.find((store) => store.name === selectedStore) ??
    stores[0];

  const routeCategories = useMemo(
    () =>
      storeRoutes[selectedStore] ??
      storeRoutes.Lidl,
    [selectedStore]
  );

  const measureDropZones = useCallback(() => {
    overlayRef.current?.measureInWindow((x, y) => {
      overlayOriginRef.current = {
        x,
        y,
      };
    });

    categoryZonesRef.current = {};

    Object.entries(categoryDropRefs.current).forEach(
      ([category, categoryRef]) => {
        if (!categoryRef) return;

        categoryRef.measureInWindow(
          (x, y, width, height) => {
            categoryZonesRef.current[category] = {
              x,
              y,
              width,
              height,
            };
          }
        );
      }
    );
  }, []);

  const findDropCategory = useCallback(
    (pageX, pageY) => {
      return (
        Object.entries(categoryZonesRef.current).find(
          ([, zone]) =>
            pageX >= zone.x &&
            pageX <= zone.x + zone.width &&
            pageY >= zone.y &&
            pageY <= zone.y + zone.height
        )?.[0] ?? null
      );
    },
    []
  );

  const resetDrag = useCallback(() => {
    draggedItemRef.current = null;
    activeDropCategoryRef.current = null;
    categoryZonesRef.current = {};

    setDraggedItem(null);
    setActiveDropCategory(null);
  }, []);

  const startDraggingItem = useCallback(
    (item, pageX, pageY) => {
      draggedItemRef.current = item;
      activeDropCategoryRef.current = null;

      setDraggedItem(item);
      setActiveDropCategory(null);

      dragPosition.setValue({
        x: pageX - 115,
        y: pageY - 28,
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          measureDropZones();

          setTimeout(() => {
            measureDropZones();
          }, 150);
        });
      });
    },
    [dragPosition, measureDropZones]
  );

  const moveDraggingItem = useCallback(
    (pageX, pageY) => {
      if (!draggedItemRef.current) return;

      const {
        x: overlayX,
        y: overlayY,
      } = overlayOriginRef.current;

      dragPosition.setValue({
        x: pageX - overlayX - 115,
        y: pageY - overlayY - 28,
      });

      const nextCategory = findDropCategory(
        pageX,
        pageY
      );

      if (
        nextCategory !==
        activeDropCategoryRef.current
      ) {
        activeDropCategoryRef.current =
          nextCategory;

        setActiveDropCategory(nextCategory);
      }
    },
    [dragPosition, findDropCategory]
  );

  const updateItemCategory = useCallback(
    async (itemId, category) => {
      const user = auth.currentUser;

      if (!user) return;

      try {
        await update(
          ref(
            db,
            `users/${user.uid}/shoppingList/items/${itemId}`
          ),
          {
            category,
          }
        );
      } catch (error) {
        console.error(
          "Categorie wijzigen mislukt:",
          error
        );

        Alert.alert(
          "Fout",
          "Het product kon niet naar de andere categorie worden verplaatst."
        );
      }
    },
    []
  );

  const finishDraggingItem = useCallback(
    async (pageX, pageY) => {
      const item = draggedItemRef.current;

      const dropCategory =
        activeDropCategoryRef.current ??
        findDropCategory(pageX, pageY);

      resetDrag();

      if (
        item &&
        dropCategory &&
        dropCategory !== item.category
      ) {
        await updateItemCategory(
          item.id,
          dropCategory
        );
      }
    },
    [
      findDropCategory,
      resetDrag,
      updateItemCategory,
    ]
  );

  const cancelDraggingItem = useCallback(() => {
    resetDrag();
  }, [resetDrag]);

  useEffect(() => {
    let stopDatabase = null;

    const stopAuth = onAuthStateChanged(auth, (currentUser) => {
      if (stopDatabase) {
        stopDatabase();
        stopDatabase = null;
      }

      if (!currentUser) {
        setItems([]);
        setSelectedStore("Lidl");
        setLoaded(true);
        return;
      }

      setLoaded(false);

      const shoppingListRef = ref(
        db,
        `users/${currentUser.uid}/shoppingList`
      );

      stopDatabase = onValue(
        shoppingListRef,
        (snapshot) => {
          const data = snapshot.val() ?? {};
          const savedItems = data.items ?? {};

          setItems(Object.values(savedItems));

          const savedStore = data.selectedStore;

          if (
            savedStore &&
            stores.some((store) => store.name === savedStore)
          ) {
            setSelectedStore(savedStore);
          } else {
            setSelectedStore("Lidl");
          }

          setLoaded(true);
        },
        (error) => {
          console.error("Firebase laden mislukt:", error);

          Alert.alert(
            "Fout",
            "De boodschappen konden niet worden geladen."
          );

          setLoaded(true);
        }
      );
    });

    return () => {
      if (stopDatabase) {
        stopDatabase();
      }

      stopAuth();
    };
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
      Alert.alert("Fout", "De Supermarkt kon niet worden opgeslagen.");
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

      const storeExists = stores.some(
        (store) => store.name === savedStore
      );

      if (savedStore && storeExists) {
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
    const user = auth.currentUser;

    if (!cleanedName) return;

    if (!user) {
      Alert.alert(
        "Niet ingelogd",
        "Log eerst in om een product toe te voegen."
      );

      return;
    }

    try {
      const category = await getCategory(
        cleanedName,
        selectedStore
      );

      const item = {
        id: `${Date.now()}${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        name: cleanedName,
        category,
        completed: false,
        createdAt: Date.now(),
      };

      await set(
        ref(
          db,
          `users/${user.uid}/shoppingList/items/${item.id}`
        ),
        item
      );

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

  const toggleItem = async (id) => {
    const user = auth.currentUser;
    const item = items.find((currentItem) => currentItem.id === id);

    if (!user || !item) return;

    try {
      await update(
        ref(
          db,
          `users/${user.uid}/shoppingList/items/${id}`
        ),
        {
          completed: !item.completed,
        }
      );
    } catch (error) {
      console.error("Product bijwerken mislukt:", error);

      Alert.alert(
        "Fout",
        "Het product kon niet worden bijgewerkt."
      );
    }
  };

  const removeItem = async (id) => {
    const user = auth.currentUser;

    if (!user) return;

    try {
      await remove(
        ref(
          db,
          `users/${user.uid}/shoppingList/items/${id}`
        )
      );
    } catch (error) {
      console.error("Product verwijderen mislukt:", error);

      Alert.alert(
        "Fout",
        "Het product kon niet worden verwijderd."
      );
    }
  };

  const selectStore = async (storeName) => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert(
        "Niet ingelogd",
        "Log eerst in om een supermarkt te kiezen."
      );

      return;
    }

    try {
      await set(
        ref(
          db,
          `users/${user.uid}/shoppingList/selectedStore`
        ),
        storeName
      );

      setStoreModalVisible(false);
    } catch (error) {
      console.error("Supermarkt opslaan mislukt:", error);

      Alert.alert(
        "Fout",
        "De supermarkt kon niet worden opgeslagen."
      );
    }
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
          onPress: async () => {
            const user = auth.currentUser;

            if (!user) return;

            try {
              const completedItems = items.filter((item) => item.completed);

              await Promise.all(
                completedItems.map((item) =>
                  remove(
                    ref(
                      db,
                      `users/${user.uid}/shoppingList/items/${item.id}`
                    )
                  )
                )
              );
            } catch (error) {
              console.error("Lijst opruimen mislukt:", error);

              Alert.alert(
                "Fout",
                "De afgevinkte producten konden niet worden verwijderd."
              );
            }
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

    return routeCategories
      .map((category) => {
        const categoryItems = items
          .filter((item) => item.category === category)
          .sort((a, b) => {
            if (a.completed !== b.completed) {
              return a.completed ? 1 : -1;
            }

            return a.name.localeCompare(b.name, "nl");
          });

        return {
          title: category,
          data: categoryItems,
          completed:
            categoryItems.length > 0 &&
            categoryItems.every((item) => item.completed),
        };
      })
      .filter((section) => section.data.length > 0)
      .sort((a, b) => {
        // Niet-afgeronde categorieën eerst
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        // Daarna originele winkelvolgorde behouden
        return (
          routeCategories.indexOf(a.title) -
          routeCategories.indexOf(b.title)
        );
      });
  }, [items, routeCategories]);

  const renderItem = ({
    item,
    index,
    section,
  }) => {
    const isLastItem =
      index === section.data.length - 1;

    return (
      <DraggableItemRow
        item={item}
        isLastItem={isLastItem}
        isDragging={
          draggedItem?.id === item.id
        }
        onToggle={toggleItem}
        onDelete={confirmRemoveItem}
        onstart={startDraggingItem}
        onDragMove={moveDraggingItem}
        onDragEnd={finishDraggingItem}
        onDragCancel={cancelDraggingItem}
      />
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

      {/* Category item count (optional) */}
      {/*
      <Text style={styles.sectionCountText}>
        {section.data.length}
      </Text>
      */}
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
          <Image
            source={currentStore.logo}
            style={styles.storeLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.storeSelectorContent}>
          <Text style={styles.storeSelectorLabel}>
            Supermarkt
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
          scrollEnabled={!draggedItem}
          removeClippedSubviews={false}
          contentContainerStyle={[
            styles.listContent,
            sections.length === 0 && styles.emptyListContent,
          ]}
          SectionSeparatorComponent={() => <View style={styles.sectionSpacing} />}
        />

          {/* Profile button */}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate("Profiel")}
          activeOpacity={0.85}
        >
          <Ionicons
            name="person-outline"
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>

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

      {draggedItem && (
        <View
          ref={overlayRef}
          collapsable={false}
          style={styles.dragOverlay}
          pointerEvents="none"
          onLayout={measureDropZones}
        >
          <View style={styles.dragBackdrop} />

          <View style={styles.dragPanel}>
            <Text style={styles.dragTitle}>
              Sleep naar een categorie
            </Text>

            <Text style={styles.dragText}>
              Laat los boven de juiste afdeling
            </Text>

            <View style={styles.categoryGrid}>
              {routeCategories.map((category) => {
                const isActive =
                  activeDropCategory === category;

                const isCurrent =
                  draggedItem.category === category;

                return (
                  <View
                    key={category}
                    collapsable={false}
                    ref={(node) => {
                      categoryDropRefs.current[category] = node;
                    }}
                    onLayout={() => {
                      setTimeout(() => {
                        const node =
                          categoryDropRefs.current[category];

                        node?.measureInWindow(
                          (x, y, width, height) => {
                            categoryZonesRef.current[
                              category
                            ] = {
                              x,
                              y,
                              width,
                              height,
                            };
                          }
                        );
                      }, 50);
                    }}
                    style={[
                      styles.categoryDropTarget,
                      isCurrent &&
                        styles.currentCategoryTarget,
                      isActive &&
                        styles.activeCategoryTarget,
                    ]}
                  >
                    <View
                      style={
                        styles.categoryTargetIcon
                      }
                    >
                      <Ionicons
                        name={
                          categoryIcons[category] ??
                          "basket-outline"
                        }
                        size={16}
                        color={
                          isActive
                            ? "#FFFFFF"
                            : COLORS.primary
                        }
                      />
                    </View>

                    <Text
                      style={[
                        styles.categoryTargetText,
                        isActive &&
                          styles.activeCategoryTargetText,
                      ]}
                      numberOfLines={2}
                    >
                      {category}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <Animated.View
            style={[
              styles.floatingItem,
              {
                transform:
                  dragPosition.getTranslateTransform(),
              },
            ]}
          >
            <Ionicons
              name="reorder-three-outline"
              size={22}
              color={COLORS.primary}
            />

            <Text
              style={styles.floatingItemText}
              numberOfLines={1}
            >
              {draggedItem.name}
            </Text>
          </Animated.View>
        </View>
      )}

      <Modal
        visible={itemModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeItemModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "position"}
          keyboardVerticalOffset={0}
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
        </KeyboardAvoidingView>
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

            <Text style={styles.storeModalTitle}>Kies je Supermarkt</Text>

            <Text style={styles.storeModalText}>
              De volgorde van de categorieën past zich aan de Supermarkt aan.
            </Text>

            <View style={styles.storeOptions}>
              {stores.map((store) => {
                const selected = selectedStore === store.name;

                return (
                  <TouchableOpacity
                    key={store.id}
                    style={[
                      styles.storeOption,
                      selected && styles.storeOptionSelected,
                    ]}
                    onPress={() => selectStore(store.name)}
                    activeOpacity={0.75}
                  >
                    <Image
                      source={store.logo}
                      style={styles.storeOptionLogo}
                      resizeMode="contain"
                    />

                    <Text
                      style={[
                        styles.storeOptionText,
                        selected && styles.storeOptionTextSelected,
                      ]}
                    >
                      {store.name}
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
