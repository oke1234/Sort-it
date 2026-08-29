import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  SectionList,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  PanResponder,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import {
  ImageManipulator,
  SaveFormat,
} from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as Network from "expo-network";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles, COLORS} from "../styles";
import { Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";

import {
  onValue,
  ref,
  set,
} from "firebase/database";

import { auth, db } from "../firebaseConfig";
import {
  isAccountDeletionInProgress,
  registerAccountSyncEnd,
  registerAccountSyncStart,
} from "../accountDeletion";

import {
  STORAGE_KEY,
  STORE_KEY,
  stores,
  storeRoutes,
  customStoreCategories,
  categoryIcons,
  countries,
  DEFAULT_COUNTRY_CODE,
  getCountryStorageKey,
} from "../shoppingData";

import { getCategory } from "../categoryService";
import PremiumAssistant from "../PremiumAssistant";
import { usePremium } from "../PremiumContext";
import {
  generatePremiumSuggestions,
  getPremiumErrorMessage,
} from "../premiumService";
import {
  getStorePresenceCandidate,
  getRecentConfirmedStoreLocation,
  saveStorePresenceResponse,
  STORE_CONFIRMATION_VALID_MS,
  STORE_PRESENCE_IDLE_MS,
  STORE_PRESENCE_RADIUS_METERS,
} from "../storePresence";

const DRAG_HOLD_MS = 500;
const DEFAULT_LIST_ID = "default";
const LOCAL_LISTS_KEY = "SHOPPING_LISTS_V2";
const PENDING_SYNC_KEY = "SHOPPING_LISTS_PENDING_SYNC_V2";
const PERSON_COLORS = [
  { background: "#E8F1FF", text: "#315F94", dot: "#6F9FD4" },
  { background: "#FBEBDD", text: "#8A5528", dot: "#D79962" },
  { background: "#F1EAFB", text: "#65458F", dot: "#9A78C4" },
  { background: "#E4F3EC", text: "#356C55", dot: "#69A88A" },
  { background: "#F9E7EC", text: "#8B475B", dot: "#CE7E94" },
  { background: "#E8F3F5", text: "#386A73", dot: "#70A7AF" },
];

const createId = (prefix = "") =>
  `${prefix}${Date.now()}${Math.random()
    .toString(36)
    .slice(2, 8)}`;

const createDefaultList = ({
  items = [],
  selectedStore = "Lidl",
  categoryAssignments = {},
  note = "",
  assistantEnabled = false,
} = {}) => ({
  id: DEFAULT_LIST_ID,
  name: "Lijst 1",
  items,
  selectedStore,
  categoryAssignments,
  note,
  assistantEnabled,
  createdAt: Date.now(),
});

const getUserListsKey = (userId) =>
  `${LOCAL_LISTS_KEY}:${userId}`;

const getStoreLogoSource = (store) => {
  if (store?.isCustom) {
    return store.logoUri ? { uri: store.logoUri } : null;
  }

  return store?.logo ?? null;
};

const sanitizeItemLocation = (location) => {
  if (!location || typeof location !== "object") return null;

  const storeName =
    typeof location.storeName === "string"
      ? location.storeName
      : "";
  const address =
    typeof location.address === "string"
      ? location.address
      : "";
  const confirmedAt = Number(location.confirmedAt);
  const confirmationId =
    typeof location.confirmationId === "string"
      ? location.confirmationId
      : "";

  if (!storeName || !Number.isFinite(confirmedAt)) return null;

  return {
    storeName,
    address,
    confirmedAt,
    ...(confirmationId ? { confirmationId } : {}),
  };
};

const sanitizeLocationData = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeLocationData);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, nestedValue]) => {
      if (key === "location") {
        const location = sanitizeItemLocation(nestedValue);
        return location ? [[key, location]] : [];
      }

      return [[key, sanitizeLocationData(nestedValue)]];
    })
  );
};

const normalizeItems = (savedItems, fallbackStore = "") => {
  const items = Array.isArray(savedItems)
    ? savedItems
    : Object.values(savedItems ?? {});

  return items
    .filter((item) => item?.id)
    .map((item) => {
      const { completedAt, ...normalizedItem } =
        sanitizeLocationData(item);

      return {
        ...normalizedItem,
        completionTime:
          item.completionTime ?? completedAt ?? "",
        currentStore:
          item.currentStore ?? fallbackStore,
      };
    });
};

const normalizePeople = (savedPeople) =>
  Object.entries(savedPeople ?? {})
    .map(([personId, person], index) => {
      if (!person || typeof person !== "object") {
        return null;
      }

      const name = person.name?.trim();

      if (!name) return null;

      return {
        id: person.id ?? personId,
        name,
        colorIndex: Number.isInteger(person.colorIndex)
          ? Math.abs(person.colorIndex) % PERSON_COLORS.length
          : index % PERSON_COLORS.length,
        createdAt: person.createdAt ?? Date.now() + index,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.createdAt - b.createdAt);

const normalizeCategoryAssignments = (assignments) =>
  Object.fromEntries(
    Object.entries(assignments ?? {}).filter(
      ([category, personId]) =>
        typeof category === "string" &&
        category.trim() &&
        typeof personId === "string" &&
        personId
    )
  );

const getPersonColors = (person) =>
  PERSON_COLORS[
    Math.abs(person?.colorIndex ?? 0) % PERSON_COLORS.length
  ];

const normalizeCustomStores = (savedStores) =>
  Object.entries(savedStores ?? {})
    .map(([storeId, store], index) => {
      if (!store || typeof store !== "object") {
        return null;
      }

      const name = store.name?.trim();
      const logoUri =
        typeof store.logoUri === "string"
          ? store.logoUri
          : "";
      const categories = Array.from(
        new Set(
          (Array.isArray(store.categories)
            ? store.categories
            : []
          )
            .filter(
              (category) =>
                typeof category === "string" &&
                category.trim()
            )
            .map((category) => category.trim())
        )
      );

      if (!name) {
        return null;
      }

      return {
        id: store.id ?? storeId,
        name,
        logoUri,
        categories:
          categories.length > 0
            ? categories
            : [...customStoreCategories],
        isCustom: true,
        createdAt:
          store.createdAt ?? Date.now() + index,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.createdAt - b.createdAt);

const normalizeShoppingLists = (data = {}) => {
  const customStores = normalizeCustomStores(
    data.customStores
  );
  const people = normalizePeople(data.people);
  const availableStoreNames = new Set([
    ...stores.map((store) => store.name),
    ...customStores.map((store) => store.name),
  ]);
  const savedLists = Object.entries(data.lists ?? {})
    .filter(
      ([, list]) =>
        list && typeof list === "object"
    )
    .map(([listId, list], index) => ({
      id: list.id ?? listId,
      name: list.name?.trim() || `Lijst ${index + 1}`,
      items: normalizeItems(
        list.items,
        list.selectedStore ?? "Lidl"
      ),
      selectedStore: availableStoreNames.has(
        list.selectedStore
      )
        ? list.selectedStore
        : "Lidl",
      categoryAssignments: normalizeCategoryAssignments(
        list.categoryAssignments
      ),
      note:
        typeof list.note === "string"
          ? list.note
          : "",
      aiGenerated: list.aiGenerated === true,
      aiGoal: typeof list.aiGoal === "string" ? list.aiGoal.slice(0, 180) : "",
      assistantEnabled: list.assistantEnabled === true,
      createdAt: list.createdAt ?? Date.now() + index,
    }))
    .sort((a, b) => a.createdAt - b.createdAt);

  const lists =
    savedLists.length > 0
      ? savedLists
      : [
          createDefaultList({
            items: normalizeItems(
              data.items,
              data.selectedStore ?? "Lidl"
            ),
            selectedStore: data.selectedStore,
          }),
        ];

  const activeListId = lists.some(
    (list) => list.id === data.activeListId
  )
    ? data.activeListId
    : lists[0].id;

  return {
    lists,
    activeListId,
    customStores,
    people,
  };
};

const serializeList = (list) => ({
  id: list.id,
  name: list.name,
  selectedStore: list.selectedStore,
  categoryAssignments: list.categoryAssignments ?? {},
  note: list.note ?? "",
  aiGenerated: list.aiGenerated === true,
  aiGoal: list.aiGoal ?? "",
  assistantEnabled: list.assistantEnabled === true,
  createdAt: list.createdAt,
  items: Object.fromEntries(
    list.items.map((item) => [item.id, item])
  ),
});

const applyPendingOperations = (
  shoppingListData,
  operations,
  userId
) => {
  const data = JSON.parse(
    JSON.stringify(shoppingListData ?? {})
  );

  if (
    Object.keys(data.lists ?? {}).length === 0 &&
    (data.items || data.selectedStore)
  ) {
    data.lists = {
      [DEFAULT_LIST_ID]: {
        id: DEFAULT_LIST_ID,
        name: "Lijst 1",
        items: data.items ?? {},
        selectedStore: data.selectedStore ?? "Lidl",
        createdAt: 0,
      },
    };
    data.activeListId = DEFAULT_LIST_ID;
  }

  operations
    .filter(
      (operation) =>
        operation.userId === userId &&
        operation.scope === "shoppingList"
    )
    .forEach((operation) => {
      const pathParts = operation.path
        .split("/")
        .filter(Boolean);

      if (pathParts.length === 0) return;

      let parent = data;

      pathParts.slice(0, -1).forEach((part) => {
        if (
          !parent[part] ||
          typeof parent[part] !== "object"
        ) {
          parent[part] = {};
        }

        parent = parent[part];
      });

      const finalPart = pathParts[pathParts.length - 1];

      if (operation.value === null) {
        delete parent[finalPart];
      } else {
        parent[finalPart] = operation.value;
      }
    });

  return data;
};

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
  dropRef,
}) {
  const longPressActivatedRef = useRef(false);
  const panActiveRef = useRef(false);
  const suppressPressRef = useRef(false);
  const lastPointerPositionRef = useRef({ x: 0, y: 0 });
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

        lastPointerPositionRef.current = {
          x: event.nativeEvent.pageX,
          y: event.nativeEvent.pageY,
        };

        propsRef.current.onDragMove(
          event.nativeEvent.pageX,
          event.nativeEvent.pageY
        );
      },

      onPanResponderMove: (event, gestureState) => {
        const pageX = Number.isFinite(event.nativeEvent.pageX)
          ? event.nativeEvent.pageX
          : gestureState.moveX;
        const pageY = Number.isFinite(event.nativeEvent.pageY)
          ? event.nativeEvent.pageY
          : gestureState.moveY;

        lastPointerPositionRef.current = {
          x: pageX,
          y: pageY,
        };

        propsRef.current.onDragMove(
          pageX,
          pageY
        );
      },

      onPanResponderRelease: (event, gestureState) => {
        panActiveRef.current = false;
        longPressActivatedRef.current = false;

        const pageX =
          event.nativeEvent.pageX ||
          gestureState.moveX ||
          lastPointerPositionRef.current.x;
        const pageY =
          event.nativeEvent.pageY ||
          gestureState.moveY ||
          lastPointerPositionRef.current.y;

        propsRef.current.onDragEnd(
          pageX,
          pageY
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
    lastPointerPositionRef.current = {
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY,
    };

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
      ref={dropRef}
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
  const [lists, setLists] = useState(() => [
    createDefaultList(),
  ]);
  const [customStores, setCustomStores] = useState([]);
  const [people, setPeople] = useState([]);
  const [activeListId, setActiveListId] =
    useState(DEFAULT_LIST_ID);
  const [newItem, setNewItem] = useState("");
  const [newListName, setNewListName] = useState("");
  const [newListMode, setNewListMode] = useState("standard");
  const [aiListGoal, setAiListGoal] = useState("");
  const [creatingAiList, setCreatingAiList] = useState(false);
  const [customStoreName, setCustomStoreName] =
    useState("");
  const [customStoreLogoUri, setCustomStoreLogoUri] =
    useState("");
  const [
    orderedCustomStoreCategories,
    setOrderedCustomStoreCategories,
  ] = useState(() => [...customStoreCategories]);
  const [isPickingStoreLogo, setIsPickingStoreLogo] =
    useState(false);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [listModalVisible, setListModalVisible] = useState(false);
  const [storeModalVisible, setStoreModalVisible] = useState(false);
  const [assignmentCategory, setAssignmentCategory] =
    useState(null);
  const [newPersonName, setNewPersonName] = useState("");
  const [
    customStoreModalVisible,
    setCustomStoreModalVisible,
  ] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const networkState = Network.useNetworkState();
  const [draggedItem, setDraggedItem] = useState(null);
  const [activeDropCategory, setActiveDropCategory] =
    useState(null);
  const [isNotePadOpen, setIsNotePadOpen] =
    useState(false);
  const [countryCode, setCountryCode] = useState(
    DEFAULT_COUNTRY_CODE
  );
  const [storePresencePrompt, setStorePresencePrompt] =
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
  const listCategoryDropRefs = useRef({});
  const listCategoryZonesRef = useRef({});
  const draggedItemRef = useRef(null);
  const activeDropCategoryRef = useRef(null);
  const offlineWarningShownRef = useRef(false);
  const currentUserIdRef = useRef(null);
  const pendingOperationsRef = useRef([]);
  const pendingStorageWriteRef = useRef(
    Promise.resolve()
  );
  const localStorageWriteRef = useRef(
    Promise.resolve()
  );
  const syncInProgressRef = useRef(false);
  const enqueueFirebaseWriteRef = useRef(null);
  const flushPendingOperationsRef = useRef(null);
  const isOfflineRef = useRef(false);
  const storePresenceTimeoutRef = useRef(null);
  const storePresenceSessionRef = useRef(0);
  const noteSyncRef = useRef({
    timeout: null,
    listId: null,
    value: "",
  });

  const navigation = useNavigation();
  const premium = usePremium();

  useEffect(() => {
    let active = true;

    const loadCountry = async () => {
      const userId = auth.currentUser?.uid;

      if (!userId) {
        if (active) setCountryCode(DEFAULT_COUNTRY_CODE);
        return;
      }

      try {
        const storedCountryCode = await AsyncStorage.getItem(
          getCountryStorageKey(userId)
        );
        const countryExists = countries.some(
          (country) => country.code === storedCountryCode
        );

        if (active) {
          setCountryCode(
            countryExists
              ? storedCountryCode
              : DEFAULT_COUNTRY_CODE
          );
        }
      } catch {
        if (active) setCountryCode(DEFAULT_COUNTRY_CODE);
      }
    };

    loadCountry();
    const unsubscribeFocus = navigation.addListener(
      "focus",
      loadCountry
    );

    return () => {
      active = false;
      unsubscribeFocus();
    };
  }, [navigation]);

  const activeList =
    lists.find((list) => list.id === activeListId) ??
    lists[0];

  const items = activeList?.items ?? [];
  const selectedStore =
    activeList?.selectedStore ?? "Lidl";
  const categoryAssignments =
    activeList?.categoryAssignments ?? {};
  const activeListNote = activeList?.note ?? "";

  const setItems = useCallback(
    (itemsOrUpdater) => {
      setLists((currentLists) =>
        currentLists.map((list) => {
          if (list.id !== activeListId) return list;

          const nextItems =
            typeof itemsOrUpdater === "function"
              ? itemsOrUpdater(list.items)
              : itemsOrUpdater;

          return {
            ...list,
            items: nextItems,
          };
        })
      );
    },
    [activeListId]
  );

  const setSelectedStore = useCallback(
    (storeName) => {
      setLists((currentLists) =>
        currentLists.map((list) =>
          list.id === activeListId
            ? {
                ...list,
                selectedStore: storeName,
              }
            : list
        )
      );
    },
    [activeListId]
  );

  const setCategoryAssignment = useCallback(
    (category, personId) => {
      setLists((currentLists) =>
        currentLists.map((list) => {
          if (list.id !== activeListId) return list;

          const nextAssignments = {
            ...(list.categoryAssignments ?? {}),
          };

          if (personId) {
            nextAssignments[category] = personId;
          } else {
            delete nextAssignments[category];
          }

          return {
            ...list,
            categoryAssignments: nextAssignments,
          };
        })
      );
    },
    [activeListId]
  );

  const networkStatusKnown =
    Platform.OS === "web"
      ? typeof networkState.isConnected === "boolean"
      : networkState.type != null &&
        networkState.type !== Network.NetworkStateType.UNKNOWN;

  const isOnline =
    networkStatusKnown &&
    networkState.isConnected === true &&
    networkState.isInternetReachable !== false;

  const isOffline = networkStatusKnown && !isOnline;

  const countryStores = useMemo(
    () =>
      stores.filter((store) =>
        store.countryCodes?.includes(countryCode)
      ),
    [countryCode]
  );

  const allStores = useMemo(
    () => [...countryStores, ...customStores],
    [countryStores, customStores]
  );

  const allKnownStores = useMemo(
    () => [...stores, ...customStores],
    [customStores]
  );

  const currentCountry =
    countries.find((country) => country.code === countryCode) ??
    countries[0];

  const defaultCountryStore = countryStores[0] ?? stores[0];

  const currentStore =
    allKnownStores.find(
      (store) => store.name === selectedStore
    ) ?? defaultCountryStore;

  const routeCategories = useMemo(
    () => {
      const customStore = customStores.find(
        (store) => store.name === selectedStore
      );

      return (
        customStore?.categories ??
        storeRoutes[selectedStore] ??
        storeRoutes[defaultCountryStore.name] ??
        storeRoutes.Lidl
      );
    },
    [customStores, defaultCountryStore.name, selectedStore]
  );

  const measureInDragCoordinates = useCallback(
    (node, callback) => {
      if (!node) return;

      node.measure((x, y, width, height, pageX, pageY) => {
        callback(
          Number.isFinite(pageX) ? pageX : x,
          Number.isFinite(pageY) ? pageY : y,
          width,
          height
        );
      });
    },
    []
  );

  const measureDropZones = useCallback(() => {
    measureInDragCoordinates(overlayRef.current, (x, y) => {
      overlayOriginRef.current = {
        x,
        y,
      };
    });

    Object.entries(categoryDropRefs.current).forEach(
      ([category, categoryRef]) => {
        if (!categoryRef) return;

        measureInDragCoordinates(
          categoryRef,
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
  }, [measureInDragCoordinates]);

  const measureVisibleListDropZones = useCallback(() => {
    listCategoryZonesRef.current = {};

    Object.entries(listCategoryDropRefs.current).forEach(
      ([category, nodesById]) => {
        Object.values(nodesById).forEach((node) => {
          if (!node) return;

          measureInDragCoordinates(
            node,
            (x, y, width, height) => {
              if (width <= 0 || height <= 0) return;

              const zones =
                listCategoryZonesRef.current[category] ?? [];

              zones.push({ x, y, width, height });
              listCategoryZonesRef.current[category] = zones;
            }
          );
        });
      }
    );
  }, [measureInDragCoordinates]);

  const findDropCategory = useCallback(
    (pageX, pageY) => {
      const floatingItem = {
        left: pageX - 115,
        right: pageX + 115,
        top: pageY - 28,
        bottom: pageY + 28,
      };

      let bestCategory = null;
      let largestOverlap = 0;

      const zones = [
        ...Object.entries(categoryZonesRef.current).map(
          ([category, zone]) => ({ category, zone })
        ),
        ...Object.entries(listCategoryZonesRef.current).flatMap(
          ([category, categoryZones]) =>
            categoryZones.map((zone) => ({ category, zone }))
        ),
      ];

      zones.forEach(({ category, zone }) => {
        const overlapWidth = Math.max(
          0,
          Math.min(floatingItem.right, zone.x + zone.width) -
            Math.max(floatingItem.left, zone.x)
        );
        const overlapHeight = Math.max(
          0,
          Math.min(floatingItem.bottom, zone.y + zone.height) -
            Math.max(floatingItem.top, zone.y)
        );
        const overlap = overlapWidth * overlapHeight;

        if (overlap > largestOverlap) {
          largestOverlap = overlap;
          bestCategory = category;
        }
      });

      return bestCategory;
    },
    []
  );

  const resetDrag = useCallback(() => {
    draggedItemRef.current = null;
    activeDropCategoryRef.current = null;
    categoryZonesRef.current = {};
    listCategoryZonesRef.current = {};

    setDraggedItem(null);
    setActiveDropCategory(null);
  }, []);

  const startDraggingItem = useCallback(
    (item, pageX, pageY) => {
      measureVisibleListDropZones();

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
    [
      dragPosition,
      measureDropZones,
      measureVisibleListDropZones,
    ]
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

  const persistPendingOperations = useCallback(
    (operations) => {
      pendingStorageWriteRef.current =
        pendingStorageWriteRef.current
          .catch(() => {})
          .then(() =>
            AsyncStorage.setItem(
              PENDING_SYNC_KEY,
              JSON.stringify(operations)
            )
          );

      return pendingStorageWriteRef.current;
    },
    []
  );

  const flushPendingOperations = useCallback(async () => {
    const user = auth.currentUser;

    if (
      !isOnline ||
      !user ||
      syncInProgressRef.current ||
      isAccountDeletionInProgress(user.uid)
    ) {
      return;
    }

    syncInProgressRef.current = true;
    registerAccountSyncStart(user.uid);

    try {
      while (auth.currentUser?.uid === user.uid) {
        if (isAccountDeletionInProgress(user.uid)) break;

        const userOperations =
          pendingOperationsRef.current.filter(
            (pendingOperation) =>
              pendingOperation.userId === user.uid
          );
        const operation =
          userOperations.find(
            (pendingOperation) =>
              pendingOperation.scope !==
              "storeConfirmation"
          ) ?? userOperations[0];

        if (!operation) break;

        const databasePath =
          operation.scope === "shoppingList"
            ? `users/${user.uid}/shoppingList/${operation.path}`
            : `users/${user.uid}/${operation.path}`;

        await set(
          ref(db, databasePath),
          operation.value
        );

        const nextOperations =
          pendingOperationsRef.current.filter(
            (pendingOperation) =>
              pendingOperation.id !== operation.id
          );

        pendingOperationsRef.current = nextOperations;
        await persistPendingOperations(nextOperations);
      }
    } catch (error) {
      console.warn(
        "Synchroniseren uitgesteld tot er weer internet is:",
        error
      );
    } finally {
      syncInProgressRef.current = false;
      registerAccountSyncEnd(user.uid);
    }
  }, [isOnline, persistPendingOperations]);

  const enqueueFirebaseWrite = useCallback(
    (
      path,
      value,
      archiveDetails = {},
      scope = "shoppingList"
    ) => {
      const userId =
        currentUserIdRef.current ??
        auth.currentUser?.uid;

      if (
        !userId ||
        isAccountDeletionInProgress(userId)
      ) {
        return;
      }

      const operationId = createId("sync-");
      const operationTime = Date.now();
      const archiveOperations = (archiveDetails.items ?? [])
        .filter((item) => item?.name)
        .map((item, index) => {
          const eventId = `event-${operationId}-${index}`;

          return {
            id: `archive-${operationId}-${index}`,
            userId,
            scope: "productArchive",
            path: `productArchive/${eventId}`,
            value: {
              userId,
              itemId: item.id ?? "",
              listId: archiveDetails.listId ?? "",
              action: archiveDetails.action ?? "updated",
              name: item.name,
              category: item.category ?? "Overig",
              completed: Boolean(item.completed),
              createdAt: item.createdAt ?? operationTime,
              completionTime: item.completionTime ?? "",
              currentStore:
                item.currentStore ??
                archiveDetails.currentStore ??
                "",
              ...(sanitizeItemLocation(item.location)
                ? { location: sanitizeItemLocation(item.location) }
                : {}),
              archivedAt: operationTime,
            },
          };
        });
      const shoppingListOperation = {
        id: operationId,
        userId,
        scope,
        path,
        value: sanitizeLocationData(value),
      };

      const nextOperations = [
        ...pendingOperationsRef.current,
        ...archiveOperations,
        shoppingListOperation,
      ];

      pendingOperationsRef.current = nextOperations;

      persistPendingOperations(nextOperations)
        .then(() => {
          if (isOnline) {
            flushPendingOperations();
          }
        })
        .catch((error) => {
          console.error(
            "Offline wijziging opslaan mislukt:",
            error
          );

          Alert.alert(
            "Fout",
            "De wijziging kon niet lokaal worden opgeslagen."
          );
        });
    },
    [
      flushPendingOperations,
      isOnline,
      persistPendingOperations,
    ]
  );

  const scheduleStorePresenceCheck = useCallback(
    (userId, storeName, listId) => {
      if (!userId || !storeName || !listId) return;

      if (storePresenceTimeoutRef.current) {
        clearTimeout(storePresenceTimeoutRef.current);
      }

      const sessionId =
        storePresenceSessionRef.current + 1;
      storePresenceSessionRef.current = sessionId;

      storePresenceTimeoutRef.current = setTimeout(
        async () => {
          storePresenceTimeoutRef.current = null;

          const candidate =
            await getStorePresenceCandidate(
              userId,
              storeName
            );

          if (
            !candidate ||
            sessionId !== storePresenceSessionRef.current ||
            auth.currentUser?.uid !== userId
          ) {
            return;
          }

          setStorePresencePrompt({
            ...candidate,
            userId,
            listId,
          });
        },
        STORE_PRESENCE_IDLE_MS
      );
    },
    []
  );

  const handleStorePresenceResponse = useCallback(
    (confirmed) => {
      const prompt = storePresencePrompt;

      if (
        !prompt ||
        auth.currentUser?.uid !== prompt.userId
      ) {
        setStorePresencePrompt(null);
        return;
      }

      const answeredAt = Date.now();
      const confirmationId = createId(
        "store-confirmation-"
      );

      console.log("Winkellocatie bevestigd:", {
        latitude: prompt.latitude,
        longitude: prompt.longitude,
        address: prompt.address,
        confirmationTime: new Date(answeredAt).toISOString(),
      });

      setStorePresencePrompt(null);

      saveStorePresenceResponse(
        prompt.userId,
        { ...prompt, confirmationId },
        confirmed,
        answeredAt
      ).catch((error) => {
        console.warn(
          "Winkelantwoord lokaal opslaan mislukt:",
          error
        );
      });

      enqueueFirebaseWrite(
        `storeConfirmations/${confirmationId}`,
        {
          userId: prompt.userId,
          confirmationId,
          storeName: prompt.storeName,
          listId: prompt.listId,
          storeAddress:
            confirmed === true ? prompt.address ?? "" : "",
          confirmed: confirmed === true,
          answeredAt,
          confirmationTime: new Date(answeredAt).toISOString(),
          radiusMeters: STORE_PRESENCE_RADIUS_METERS,
        },
        {},
        "storeConfirmation"
      );

      if (confirmed === true) {
        const location = {
          storeName: prompt.storeName,
          address: prompt.address ?? "",
          confirmedAt: answeredAt,
          confirmationId,
        };
        const confirmedList = lists.find(
          (list) => list.id === prompt.listId
        );
        const recentlyCompletedItems =
          confirmedList?.selectedStore === prompt.storeName
            ? (confirmedList.items ?? []).filter(
                (item) =>
                  item.completed &&
                  Number.isFinite(item.completionTime) &&
                  answeredAt - item.completionTime >= 0 &&
                  answeredAt - item.completionTime <
                    STORE_CONFIRMATION_VALID_MS
              )
            : [];

        if (recentlyCompletedItems.length > 0) {
          const itemIds = new Set(
            recentlyCompletedItems.map((item) => item.id)
          );

          setLists((currentLists) =>
            currentLists.map((list) =>
              list.id === prompt.listId
                ? {
                    ...list,
                    items: list.items.map((item) =>
                      itemIds.has(item.id)
                        ? { ...item, location }
                        : item
                    ),
                  }
                : list
            )
          );

          recentlyCompletedItems.forEach((item) => {
            const updatedItem = { ...item, location };

            enqueueFirebaseWrite(
              `lists/${prompt.listId}/items/${item.id}`,
              updatedItem,
              {
                listId: prompt.listId,
                action: "location_attached",
                currentStore: prompt.storeName,
                items: [updatedItem],
              }
            );
          });
        }
      }
    },
    [enqueueFirebaseWrite, lists, storePresencePrompt]
  );

  enqueueFirebaseWriteRef.current =
    enqueueFirebaseWrite;
  flushPendingOperationsRef.current =
    flushPendingOperations;
  isOfflineRef.current = isOffline;

  const flushPendingNote = useCallback(() => {
    const pendingNote = noteSyncRef.current;

    if (pendingNote.timeout) {
      clearTimeout(pendingNote.timeout);
    }

    noteSyncRef.current = {
      timeout: null,
      listId: null,
      value: "",
    };

    if (!pendingNote.listId) return;

    enqueueFirebaseWrite(
      `lists/${pendingNote.listId}/note`,
      pendingNote.value
    );
  }, [enqueueFirebaseWrite]);

  const updateActiveListNote = useCallback(
    (value) => {
      const listId = activeListId;

      setLists((currentLists) =>
        currentLists.map((list) =>
          list.id === listId
            ? {
                ...list,
                note: value,
              }
            : list
        )
      );

      if (noteSyncRef.current.timeout) {
        clearTimeout(noteSyncRef.current.timeout);
      }

      const timeout = setTimeout(() => {
        const pendingNote = noteSyncRef.current;

        if (pendingNote.listId !== listId) return;

        noteSyncRef.current = {
          timeout: null,
          listId: null,
          value: "",
        };

        enqueueFirebaseWrite(
          `lists/${listId}/note`,
          pendingNote.value
        );
      }, 700);

      noteSyncRef.current = {
        timeout,
        listId,
        value,
      };
    },
    [activeListId, enqueueFirebaseWrite]
  );

  const closeNotePad = useCallback(() => {
    if (!isNotePadOpen) return;

    flushPendingNote();
    Keyboard.dismiss();
    setIsNotePadOpen(false);
  }, [flushPendingNote, isNotePadOpen]);

  const toggleNotePad = useCallback(() => {
    if (isNotePadOpen) {
      closeNotePad();
      return;
    }

    resetDrag();
    setIsNotePadOpen(true);
  }, [closeNotePad, isNotePadOpen, resetDrag]);

  useEffect(
    () => () => {
      const pendingNote = noteSyncRef.current;

      if (pendingNote.timeout) {
        clearTimeout(pendingNote.timeout);
      }

      if (pendingNote.listId) {
        enqueueFirebaseWriteRef.current?.(
          `lists/${pendingNote.listId}/note`,
          pendingNote.value
        );
      }

      if (storePresenceTimeoutRef.current) {
        clearTimeout(storePresenceTimeoutRef.current);
      }

      storePresenceSessionRef.current += 1;
    },
    []
  );

  useEffect(() => {
    setStorePresencePrompt(null);

    if (storePresenceTimeoutRef.current) {
      clearTimeout(storePresenceTimeoutRef.current);
      storePresenceTimeoutRef.current = null;
    }

    storePresenceSessionRef.current += 1;
  }, [activeListId, selectedStore]);

  const updateItemCategory = useCallback(
    (itemId, category) => {
      const user = auth.currentUser;
      const item = items.find(
        (currentItem) => currentItem.id === itemId
      );

      if (!user || !item) return;

      const updatedItem = {
        ...item,
        category,
        currentStore: selectedStore,
      };

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === itemId
            ? updatedItem
            : currentItem
        )
      );

      enqueueFirebaseWrite(
        `lists/${activeListId}/items/${itemId}`,
        updatedItem,
        {
          listId: activeListId,
          action: "category_changed",
          currentStore: selectedStore,
          items: [updatedItem],
        }
      );
    },
    [
      activeListId,
      enqueueFirebaseWrite,
      items,
      selectedStore,
      setItems,
    ]
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
    if (!isOffline) {
      offlineWarningShownRef.current = false;
      return;
    }

    if (!offlineWarningShownRef.current) {
      offlineWarningShownRef.current = true;

      Alert.alert(
        "Geen internet",
        "Producten worden lokaal ingedeeld. Je wijzigingen worden gesynchroniseerd zodra er weer internet is."
      );
    }
  }, [isOffline]);

  useEffect(() => {
    let stopDatabase = null;
    let authSessionId = 0;

    const stopAuth = onAuthStateChanged(auth, (currentUser) => {
      const currentAuthSessionId = ++authSessionId;

      if (storePresenceTimeoutRef.current) {
        clearTimeout(storePresenceTimeoutRef.current);
        storePresenceTimeoutRef.current = null;
      }

      storePresenceSessionRef.current += 1;
      setStorePresencePrompt(null);

      if (stopDatabase) {
        stopDatabase();
        stopDatabase = null;
      }

      if (!currentUser) {
        currentUserIdRef.current = null;
        setLists([createDefaultList()]);
        setCustomStores([]);
        setPeople([]);
        setActiveListId(DEFAULT_LIST_ID);
        setIsNotePadOpen(false);
        setLoaded(true);
        return;
      }

      currentUserIdRef.current = currentUser.uid;
      setLists([createDefaultList()]);
      setCustomStores([]);
      setPeople([]);
      setActiveListId(DEFAULT_LIST_ID);
      setIsNotePadOpen(false);
      setLoaded(false);

      const loadUserData = async () => {
        try {
          const [
            savedLocalState,
            savedPendingOperations,
            legacyItems,
            legacyStore,
          ] = await Promise.all([
            AsyncStorage.getItem(
              getUserListsKey(currentUser.uid)
            ),
            AsyncStorage.getItem(PENDING_SYNC_KEY),
            AsyncStorage.getItem(STORAGE_KEY),
            AsyncStorage.getItem(STORE_KEY),
          ]);

          if (currentAuthSessionId !== authSessionId) return;

          try {
            const parsedOperations = JSON.parse(
              savedPendingOperations ?? "[]"
            );

            pendingOperationsRef.current =
              Array.isArray(parsedOperations)
                ? parsedOperations.map((operation) => ({
                    ...operation,
                    scope:
                      operation.scope ?? "shoppingList",
                    value: sanitizeLocationData(
                      operation.value
                    ),
                  }))
                : [];
          } catch {
            pendingOperationsRef.current = [];
          }

          if (savedLocalState) {
            const localState = normalizeShoppingLists(
              JSON.parse(savedLocalState)
            );

            setLists(localState.lists);
            setCustomStores(localState.customStores);
            setPeople(localState.people);
            setActiveListId(localState.activeListId);
          } else if (legacyItems) {
            const localState = normalizeShoppingLists({
              items: JSON.parse(legacyItems),
              selectedStore: legacyStore,
            });

            setLists(localState.lists);
            setCustomStores(localState.customStores);
            setPeople(localState.people);
            setActiveListId(localState.activeListId);
          }
        } catch (error) {
          console.error(
            "Lokale boodschappen laden mislukt:",
            error
          );
        } finally {
          if (currentAuthSessionId === authSessionId) {
            setLoaded(true);
          }
        }

        if (currentAuthSessionId !== authSessionId) return;

        const shoppingListRef = ref(
          db,
          `users/${currentUser.uid}/shoppingList`
        );

        stopDatabase = onValue(
          shoppingListRef,
          (snapshot) => {
            if (
              isAccountDeletionInProgress(currentUser.uid)
            ) {
              return;
            }

            const firebaseData = snapshot.val() ?? {};
            const mergedData = applyPendingOperations(
              firebaseData,
              pendingOperationsRef.current,
              currentUser.uid
            );
            const nextState =
              normalizeShoppingLists(mergedData);

            setLists(nextState.lists);
            setCustomStores(nextState.customStores);
            setPeople(nextState.people);
            setActiveListId(nextState.activeListId);
            setLoaded(true);

            Object.entries(firebaseData.lists ?? {}).forEach(
              ([listId, list]) => {
                Object.entries(list?.items ?? {}).forEach(
                  ([itemId, item]) => {
                    if (!item || typeof item !== "object") {
                      return;
                    }

                    const safeLocation = sanitizeItemLocation(
                      item.location
                    );
                    if (
                      JSON.stringify(item.location ?? null) ===
                      JSON.stringify(safeLocation)
                    ) {
                      return;
                    }

                    const locationPath =
                      `lists/${listId}/items/${item.id ?? itemId}/location`;
                    const alreadyQueued =
                      pendingOperationsRef.current.some(
                        (operation) =>
                          operation.userId ===
                            currentUser.uid &&
                          operation.scope ===
                            "shoppingList" &&
                          operation.path === locationPath
                      );

                    if (!alreadyQueued) {
                      enqueueFirebaseWriteRef.current?.(
                        locationPath,
                        safeLocation
                      );
                    }
                  }
                );
              }
            );

            const firebaseLists = Object.values(
              firebaseData.lists ?? {}
            );
            const needsFirebaseListMigration =
              firebaseLists.length === 0 ||
              firebaseLists.some((list) => !list?.id);

            if (needsFirebaseListMigration) {
              nextState.lists.forEach((list) => {
                const listPath = `lists/${list.id}`;
                const alreadyQueued =
                  pendingOperationsRef.current.some(
                    (operation) =>
                      operation.userId ===
                        currentUser.uid &&
                      operation.path === listPath
                  );

                if (!alreadyQueued) {
                  enqueueFirebaseWriteRef.current?.(
                    listPath,
                    serializeList(list)
                  );
                }
              });

              const activeListAlreadyQueued =
                pendingOperationsRef.current.some(
                  (operation) =>
                    operation.userId ===
                      currentUser.uid &&
                    operation.path === "activeListId"
                );

              if (!activeListAlreadyQueued) {
                enqueueFirebaseWriteRef.current?.(
                  "activeListId",
                  nextState.activeListId
                );
              }
            }
          },
          (error) => {
            console.error("Firebase laden mislukt:", error);

            if (!isOfflineRef.current) {
              Alert.alert(
                "Fout",
                "De boodschappen konden niet van Firebase worden geladen."
              );
            }

            setLoaded(true);
          }
        );

        flushPendingOperationsRef.current?.();
      };

      loadUserData();
    });

    return () => {
      authSessionId += 1;

      if (stopDatabase) {
        stopDatabase();
      }

      stopAuth();
    };
  }, []);

  useEffect(() => {
    const userId = currentUserIdRef.current;

    if (!loaded || !userId) return;

    const writePromise = localStorageWriteRef.current
      .catch(() => {})
      .then(() =>
        Promise.all([
          AsyncStorage.setItem(
            getUserListsKey(userId),
            JSON.stringify({
              lists,
              activeListId,
              customStores,
              people,
            })
          ),
          AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(items)
          ),
          AsyncStorage.setItem(
            STORE_KEY,
            selectedStore
          ),
        ])
      );

    localStorageWriteRef.current = writePromise;

    writePromise.catch((error) => {
      console.error(
        "Boodschappen lokaal opslaan mislukt:",
        error
      );

      Alert.alert(
        "Fout",
        "De boodschappen konden niet lokaal worden opgeslagen."
      );
    });
  }, [
    activeListId,
    customStores,
    items,
    lists,
    loaded,
    people,
    selectedStore,
  ]);

  useEffect(() => {
    if (isOnline) {
      flushPendingOperations();
    }
  }, [flushPendingOperations, isOnline]);

  const openItemModal = () => {
    setNewItem("");
    setItemModalVisible(true);
  };

  const closeItemModal = () => {
    setNewItem("");
    setItemModalVisible(false);
  };

  const addProductByName = async (productName, { closeModal = false } = {}) => {
    const cleanedName = String(productName ?? "").trim();
    const user = auth.currentUser;

    if (!cleanedName) return;

    if (Platform.OS === "android") {
      Keyboard.dismiss();
    }

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
        selectedStore,
        {
          categories: routeCategories,
        }
      );
      const item = {
        id: createId("item-"),
        name: cleanedName,
        category,
        completed: false,
        completionTime: "",
        createdAt: Date.now(),
        currentStore: selectedStore,
      };

      setItems((currentItems) => [
        ...currentItems.filter(
          (currentItem) => currentItem.id !== item.id
        ),
        item,
      ]);

      enqueueFirebaseWrite(
        `lists/${activeListId}/items/${item.id}`,
        item,
        {
          listId: activeListId,
          action: "created",
          currentStore: selectedStore,
          items: [item],
        }
      );

      if (closeModal) closeItemModal();
      scheduleStorePresenceCheck(
        user.uid,
        selectedStore,
        activeListId
      );
    } catch (error) {
      console.error(
        "Product toevoegen mislukt:",
        error
      );

      Alert.alert(
        "Fout",
        "Het product kon niet worden toegevoegd."
      );
      throw error;
    }
  };

  const addItem = async () => {
    await addProductByName(newItem, { closeModal: true });
  };

  const toggleItem = async (id) => {
    const user = auth.currentUser;
    const item = items.find((currentItem) => currentItem.id === id);

    if (!user || !item) return;

    const completed = !item.completed;
    const completionTime = completed ? Date.now() : "";
    const location = completed
      ? await getRecentConfirmedStoreLocation(
          user.uid,
          activeListId,
          selectedStore,
          completionTime
        )
      : null;
    const itemWithoutLocation = { ...item };
    delete itemWithoutLocation.location;
    const updatedItem = {
      ...itemWithoutLocation,
      completed,
      completionTime,
      currentStore: selectedStore,
      ...(location ? { location } : {}),
    };

    setItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.id === id
          ? {
              ...updatedItem,
            }
          : currentItem
      )
    );

    enqueueFirebaseWrite(
      `lists/${activeListId}/items/${id}`,
      updatedItem,
      {
        listId: activeListId,
        action: completed ? "completed" : "reopened",
        currentStore: selectedStore,
        items: [updatedItem],
      }
    );

    scheduleStorePresenceCheck(
      user.uid,
      selectedStore,
      activeListId
    );
  };

  const removeItem = (id) => {
    const user = auth.currentUser;
    const item = items.find((currentItem) => currentItem.id === id);

    if (!user || !item) return;

    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== id)
    );

    enqueueFirebaseWrite(
      `lists/${activeListId}/items/${id}`,
      null,
      {
        listId: activeListId,
        action: "deleted",
        currentStore: selectedStore,
        items: [{ ...item, currentStore: selectedStore }],
      }
    );
  };

  const openCustomStoreModal = () => {
    if (!auth.currentUser) {
      Alert.alert(
        "Niet ingelogd",
        "Log eerst in om een Custom-winkel te maken."
      );
      return;
    }

    setCustomStoreName("");
    setCustomStoreLogoUri("");
    setOrderedCustomStoreCategories([
      ...customStoreCategories,
    ]);
    setStoreModalVisible(false);
    setCustomStoreModalVisible(true);
  };

  const closeCustomStoreModal = () => {
    setCustomStoreModalVisible(false);
    setCustomStoreName("");
    setCustomStoreLogoUri("");
    setOrderedCustomStoreCategories([
      ...customStoreCategories,
    ]);
  };

  const pickCustomStoreLogo = async () => {
    if (isPickingStoreLogo) return;

    setIsPickingStoreLogo(true);

    try {
      const pickerResult =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });

      if (pickerResult.canceled) return;

      const selectedImage = pickerResult.assets?.[0];

      if (!selectedImage?.uri) {
        throw new Error("Geen afbeelding ontvangen.");
      }

      const manipulationContext =
        ImageManipulator.manipulate(selectedImage.uri);

      manipulationContext.resize({
        width: 320,
        height: 320,
      });

      const renderedImage =
        await manipulationContext.renderAsync();
      const optimizedImage =
        await renderedImage.saveAsync({
          base64: true,
          compress: 0.65,
          format: SaveFormat.JPEG,
        });

      if (!optimizedImage.base64) {
        throw new Error(
          "De afbeelding kon niet worden verwerkt."
        );
      }

      setCustomStoreLogoUri(
        `data:image/jpeg;base64,${optimizedImage.base64}`
      );
    } catch (error) {
      console.error(
        "Winkellogo kiezen mislukt:",
        error
      );

      Alert.alert(
        "Afbeelding niet gekozen",
        "Probeer een andere afbeelding te kiezen."
      );
    } finally {
      setIsPickingStoreLogo(false);
    }
  };

  const moveCustomStoreCategory = (
    categoryIndex,
    direction
  ) => {
    setOrderedCustomStoreCategories(
      (currentCategories) => {
        const nextIndex = categoryIndex + direction;

        if (
          nextIndex < 0 ||
          nextIndex >= currentCategories.length
        ) {
          return currentCategories;
        }

        const nextCategories = [...currentCategories];
        [
          nextCategories[categoryIndex],
          nextCategories[nextIndex],
        ] = [
          nextCategories[nextIndex],
          nextCategories[categoryIndex],
        ];

        return nextCategories;
      }
    );
  };

  const createCustomStore = () => {
    const user = auth.currentUser;
    const cleanedName = customStoreName.trim();

    if (!user) {
      Alert.alert(
        "Niet ingelogd",
        "Log eerst in om een Custom-winkel te maken."
      );
      return;
    }

    if (!cleanedName) {
      Alert.alert(
        "Naam ontbreekt",
        "Geef je Custom-winkel een naam."
      );
      return;
    }

    const storeNameExists = allKnownStores.some(
      (store) =>
        store.name.toLowerCase() ===
        cleanedName.toLowerCase()
    );

    if (storeNameExists) {
      Alert.alert(
        "Naam bestaat al",
        "Kies een andere naam voor je Custom-winkel."
      );
      return;
    }

    const customStore = {
      id: createId("custom-store-"),
      name: cleanedName,
      ...(customStoreLogoUri
        ? { logoUri: customStoreLogoUri }
        : {}),
      categories: [...orderedCustomStoreCategories],
      isCustom: true,
      createdAt: Date.now(),
    };

    setCustomStores((currentStores) => [
      ...currentStores,
      customStore,
    ]);
    setSelectedStore(customStore.name);

    enqueueFirebaseWrite(
      `customStores/${customStore.id}`,
      customStore
    );
    enqueueFirebaseWrite(
      `lists/${activeListId}/selectedStore`,
      customStore.name
    );

    closeCustomStoreModal();
  };

  const confirmRemoveCustomStore = (customStore) => {
    const affectedLists = lists.filter(
      (list) => list.selectedStore === customStore.name
    );
    const affectedListCopy =
      affectedLists.length === 0
        ? ""
        : affectedLists.length === 1
        ? `1 lijst gebruikt deze winkel en wordt teruggezet naar ${defaultCountryStore.name}.`
        : `${affectedLists.length} lijsten gebruiken deze winkel en worden teruggezet naar ${defaultCountryStore.name}.`;
    const removeMessage = [
      `Wil je "${customStore.name}" verwijderen?`,
      affectedListCopy,
    ]
      .filter(Boolean)
      .join(" ");

    Alert.alert(
      "Custom-winkel verwijderen",
      removeMessage,
      [
        {
          text: "Annuleren",
          style: "cancel",
        },
        {
          text: "Verwijderen",
          style: "destructive",
          onPress: () => {
            setCustomStores((currentStores) =>
              currentStores.filter(
                (store) => store.id !== customStore.id
              )
            );

            if (affectedLists.length > 0) {
              setLists((currentLists) =>
                currentLists.map((list) =>
                  list.selectedStore === customStore.name
                    ? {
                        ...list,
                        selectedStore: defaultCountryStore.name,
                      }
                    : list
                )
              );
            }

            enqueueFirebaseWrite(
              `customStores/${customStore.id}`,
              null
            );

            affectedLists.forEach((list) => {
              enqueueFirebaseWrite(
                `lists/${list.id}/selectedStore`,
                defaultCountryStore.name
              );
            });
          },
        },
      ]
    );
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

    setSelectedStore(storeName);
    setStoreModalVisible(false);

    enqueueFirebaseWrite(
      `lists/${activeListId}/selectedStore`,
      storeName
    );
  };

  const openAssignmentPicker = (category) => {
    setNewPersonName("");
    setAssignmentCategory(category);
  };

  const closeAssignmentPicker = () => {
    Keyboard.dismiss();
    setNewPersonName("");
    setAssignmentCategory(null);
  };

  const assignPersonToCategory = (personId) => {
    if (!assignmentCategory) return;

    setCategoryAssignment(assignmentCategory, personId);
    enqueueFirebaseWrite(
      `lists/${activeListId}/categoryAssignments/${assignmentCategory}`,
      personId || null
    );
    closeAssignmentPicker();
  };

  const addPersonAndAssign = () => {
    const cleanedName = newPersonName.trim();

    if (!cleanedName || !assignmentCategory) return;

    const existingPerson = people.find(
      (person) =>
        person.name.toLowerCase() ===
        cleanedName.toLowerCase()
    );

    if (existingPerson) {
      assignPersonToCategory(existingPerson.id);
      return;
    }

    const person = {
      id: createId("person-"),
      name: cleanedName,
      colorIndex: people.length % PERSON_COLORS.length,
      createdAt: Date.now(),
    };

    setPeople((currentPeople) => [
      ...currentPeople,
      person,
    ]);
    enqueueFirebaseWrite(`people/${person.id}`, person);
    assignPersonToCategory(person.id);
  };

  const openListModal = () => {
    setNewListName(`Lijst ${lists.length + 1}`);
    setNewListMode("standard");
    setAiListGoal("");
    setListModalVisible(true);
  };

  const closeListModal = () => {
    setNewListName("");
    setNewListMode("standard");
    setAiListGoal("");
    setCreatingAiList(false);
    setListModalVisible(false);
  };

  const persistCreatedList = ({ name, items = [], aiGenerated = false, aiGoal = "" }) => {
    const user = auth.currentUser;
    const cleanedName = String(name ?? "").trim();

    if (!user || !cleanedName) return null;

    const initialStoreName = allStores.some(
      (store) => store.name === selectedStore
    )
      ? selectedStore
      : defaultCountryStore.name;

    const list = {
      id: createId("list-"),
      name: cleanedName,
      items,
      selectedStore: initialStoreName,
      categoryAssignments: {},
      note: "",
      aiGenerated,
      aiGoal,
      assistantEnabled: false,
      createdAt: Date.now(),
    };

    setLists((currentLists) => [
      ...currentLists,
      list,
    ]);
    setActiveListId(list.id);

    enqueueFirebaseWrite(
      `lists/${list.id}`,
      serializeList(list)
    );
    enqueueFirebaseWrite("activeListId", list.id);

    closeListModal();
    return list;
  };

  const createList = () => {
    persistCreatedList({ name: newListName });
  };

  const createAiList = async () => {
    const goal = aiListGoal.trim();
    if (!goal || creatingAiList) return;
    if (!premium.premiumActive || premium.consent?.granted !== true) {
      closeListModal();
      navigation.navigate("Premium");
      return;
    }
    if (!isOnline) {
      Alert.alert("Geen internet", "Een nieuwe AI-lijst heeft internet nodig.");
      return;
    }

    setCreatingAiList(true);
    try {
      const result = await generatePremiumSuggestions({
        currentItems: [],
        mode: "ai_list",
        goal,
      });
      const suggestions = (result?.suggestions ?? []).slice(0, 12);
      if (!suggestions.length) throw new Error("empty-ai-list");

      const initialStoreName = allStores.some((store) => store.name === selectedStore)
        ? selectedStore
        : defaultCountryStore.name;
      const createdAt = Date.now();
      const generatedItems = await Promise.all(
        suggestions.map(async (suggestion, index) => ({
          id: createId("item-"),
          name: String(suggestion.name).trim(),
          category: await getCategory(String(suggestion.name), initialStoreName, {
            categories: routeCategories,
          }),
          completed: false,
          completionTime: "",
          createdAt: createdAt + index,
          currentStore: initialStoreName,
          aiReason: String(suggestion.reason ?? "").slice(0, 180),
        }))
      );
      const compactGoal = goal.length > 24 ? `${goal.slice(0, 23).trim()}…` : goal;
      persistCreatedList({
        name: `AI · ${compactGoal}`,
        items: generatedItems,
        aiGenerated: true,
        aiGoal: goal,
      });
    } catch (error) {
      Alert.alert(
        "AI-lijst niet gemaakt",
        error?.message === "empty-ai-list"
          ? "Er kwamen nog geen bruikbare producten terug. Probeer je doel iets concreter te maken."
          : getPremiumErrorMessage(error)
      );
    } finally {
      setCreatingAiList(false);
    }
  };

  const selectList = (listId) => {
    if (listId === activeListId) return;

    flushPendingNote();
    resetDrag();
    setActiveListId(listId);
    enqueueFirebaseWrite("activeListId", listId);
  };

  const setActiveListAssistantEnabled = (enabled) => {
    setLists((currentLists) =>
      currentLists.map((list) =>
        list.id === activeListId
          ? { ...list, assistantEnabled: enabled }
          : list
      )
    );
    enqueueFirebaseWrite(
      `lists/${activeListId}/assistantEnabled`,
      enabled
    );
  };

  const confirmRemoveList = (list) => {
    if (lists.length === 1) {
      Alert.alert(
        "Laatste lijst",
        "Je moet minimaal één lijst houden."
      );
      return;
    }

    Alert.alert(
      "Lijst verwijderen",
      `Wil je "${list.name}" met alle producten verwijderen?`,
      [
        {
          text: "Annuleren",
          style: "cancel",
        },
        {
          text: "Verwijderen",
          style: "destructive",
          onPress: () => {
            flushPendingNote();
            const remainingLists = lists.filter(
              (currentList) =>
                currentList.id !== list.id
            );
            const nextActiveListId =
              list.id === activeListId
                ? remainingLists[0].id
                : activeListId;

            setLists(remainingLists);
            setActiveListId(nextActiveListId);

            enqueueFirebaseWrite(
              `lists/${list.id}`,
              null,
              {
                listId: list.id,
                action: "list_deleted",
                currentStore: list.selectedStore,
                items: (list.items ?? []).map((item) => ({
                  ...item,
                  currentStore: list.selectedStore,
                })),
              }
            );

            if (nextActiveListId !== activeListId) {
              enqueueFirebaseWrite(
                "activeListId",
                nextActiveListId
              );
            }
          },
        },
      ]
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
    const completedItems = items.filter(
      (item) => item.completed
    );
    const completedCount = completedItems.length;

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
              currentItems.filter(
                (item) => !item.completed
              )
            );

            completedItems.forEach((item) => {
              enqueueFirebaseWrite(
                `lists/${activeListId}/items/${item.id}`,
                null,
                {
                  listId: activeListId,
                  action: "cleared_completed",
                  currentStore: selectedStore,
                  items: [{ ...item, currentStore: selectedStore }],
                }
              );
            });
          },
        },
      ]
    );
  };

  const clearList = () => {
    if (items.length === 0) {
      Alert.alert(
        "Lijst is leeg",
        "Er staan geen producten in deze lijst."
      );
      return;
    }

    Alert.alert(
      "Hele lijst leegmaken",
      `Wil je alle ${items.length} producten uit "${activeList.name}" verwijderen?`,
      [
        {
          text: "Annuleren",
          style: "cancel",
        },
        {
          text: "Leegmaken",
          style: "destructive",
          onPress: () => {
            setItems([]);
            enqueueFirebaseWrite(
              `lists/${activeListId}/items`,
              null,
              {
                listId: activeListId,
                action: "list_cleared",
                currentStore: selectedStore,
                items: items.map((item) => ({
                  ...item,
                  currentStore: selectedStore,
                })),
              }
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
        dropRef={(node) => {
          const categoryRefs =
            listCategoryDropRefs.current[item.category] ?? {};

          if (node) {
            categoryRefs[item.id] = node;
          } else {
            delete categoryRefs[item.id];
          }

          listCategoryDropRefs.current[item.category] = categoryRefs;
        }}
      />
    );
  };

  const renderSectionHeader = ({ section }) => {
    const assignedPerson = people.find(
      (person) =>
        person.id === categoryAssignments[section.title]
    );
    const personColors = getPersonColors(assignedPerson);
    const isUnsortedSection = section.title === "Overig";

    return (
      <View
        ref={(node) => {
          const categoryRefs =
            listCategoryDropRefs.current[section.title] ?? {};

          if (node) {
            categoryRefs.__header = node;
          } else {
            delete categoryRefs.__header;
          }

          listCategoryDropRefs.current[section.title] = categoryRefs;
        }}
        collapsable={false}
        style={[
          styles.sectionHeader,
          isUnsortedSection && styles.unsortedSectionHeader,
          activeDropCategory === section.title &&
            styles.activeListCategoryHeader,
        ]}
      >
        <View style={styles.sectionTitleGroup}>
          <View
            style={[
              styles.sectionIcon,
              isUnsortedSection && styles.unsortedSectionIcon,
            ]}
          >
            <Ionicons
              name={categoryIcons[section.title] ?? "basket-outline"}
              size={15}
              color={
                isUnsortedSection
                  ? "#D96B0B"
                  : COLORS.primary
              }
            />
          </View>

          <View style={styles.sectionTitleCopy}>
            <Text
              style={[
                styles.sectionTitle,
                isUnsortedSection &&
                  styles.unsortedSectionTitle,
                activeDropCategory === section.title &&
                  styles.activeListCategoryTitle,
              ]}
              numberOfLines={1}
            >
              {section.title}
            </Text>

            {isUnsortedSection && (
              <Text
                style={[
                  styles.unsortedSectionSubtitle,
                  activeDropCategory === section.title &&
                    styles.activeListCategoryTitle,
                ]}
              >
                Nog te sorteren
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.categoryAssignmentButton,
            assignedPerson && {
              backgroundColor: personColors.background,
            },
          ]}
          onPress={() => openAssignmentPicker(section.title)}
          activeOpacity={0.72}
          accessibilityRole="button"
          accessibilityLabel={
            assignedPerson
              ? `${section.title} is toegewezen aan ${assignedPerson.name}`
              : `Iemand toewijzen aan ${section.title}`
          }
        >
          {assignedPerson ? (
            <>
              <View
                style={[
                  styles.categoryAssignmentDot,
                  { backgroundColor: personColors.dot },
                ]}
              />
              <Text
                style={[
                  styles.categoryAssignmentName,
                  { color: personColors.text },
                ]}
                numberOfLines={1}
              >
                {assignedPerson.name}
              </Text>
            </>
          ) : (
            <Ionicons
              name="add"
              size={16}
              color={COLORS.primaryDark}
            />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderListHeader = () => (
    <>
      <View style={styles.simpleHeader}>
        <View style={styles.simpleHeaderCopy}>
          <Text style={styles.simpleEyebrow}>
            MIJN BOODSCHAPPEN
          </Text>

          <Text style={styles.simpleTitle}>
            Boodschappen
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

        <View style={styles.simpleHeaderActions}>
          {isOffline && (
            <View
              style={styles.offlineIndicator}
              accessibilityRole="image"
              accessibilityLabel="Geen internet"
            >
              <Ionicons
                name="cloud-offline-outline"
                size={19}
                color={COLORS.textSoft}
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.cleanButton}
            onPress={clearCompleted}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Afgevinkte producten verwijderen"
          >
            <Ionicons
              name="checkmark-done-outline"
              size={20}
              color={COLORS.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cleanButton,
              styles.clearAllButton,
            ]}
            onPress={clearList}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Hele lijst leegmaken"
          >
            <Ionicons
              name="trash-outline"
              size={19}
              color={COLORS.danger}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listTabsBlock}>
        <Text style={styles.listTabsLabel}>MIJN LIJSTEN</Text>

        <View style={styles.listTabsRow}>
          <TouchableOpacity
            style={styles.storeSelector}
            onPress={() => setStoreModalVisible(true)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`Supermarkt kiezen. Huidige supermarkt: ${selectedStore}`}
          >
            <View style={styles.storeSelectorIcon}>
              {getStoreLogoSource(currentStore) ? (
                <Image
                  source={getStoreLogoSource(currentStore)}
                  style={styles.storeLogo}
                  resizeMode="contain"
                />
              ) : (
                <Ionicons
                  name="storefront-outline"
                  size={20}
                  color={COLORS.primary}
                />
              )}
            </View>

            <Text
              style={styles.storeSelectorText}
              numberOfLines={1}
            >
              {selectedStore}
            </Text>

            <Ionicons
              name="chevron-down"
              size={14}
              color={COLORS.textSoft}
            />
          </TouchableOpacity>

          <ScrollView
            horizontal
            style={styles.listTabsScroller}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listTabsContent}
          >
            {lists.map((list) => {
              const selected =
                list.id === activeListId;

              return (
                <View
                  key={list.id}
                  style={[
                    styles.listTab,
                    selected && styles.listTabSelected,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.listTabSelect}
                    onPress={() => selectList(list.id)}
                    activeOpacity={0.75}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                  >
                    {list.aiGenerated && (
                      <Ionicons
                        name="hardware-chip-outline"
                        size={14}
                        color={selected ? "#FFFFFF" : "#8A651B"}
                        style={styles.aiListTabIcon}
                      />
                    )}
                    <Text
                      style={[
                        styles.listTabText,
                        selected &&
                          styles.listTabTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {list.name}
                    </Text>
                  </TouchableOpacity>

                  {lists.length > 1 && (
                    <TouchableOpacity
                      style={styles.listTabDelete}
                      onPress={() =>
                        confirmRemoveList(list)
                      }
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`${list.name} verwijderen`}
                    >
                      <Ionicons
                        name="close"
                        size={15}
                        color={
                          selected
                            ? "#FFFFFF"
                            : COLORS.textSoft
                        }
                      />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            <TouchableOpacity
              style={styles.addListTab}
              onPress={openListModal}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Nieuwe lijst toevoegen"
            >
              <Ionicons
                name="add"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.addListTabText}>
                Lijst
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <View style={styles.listHeading}>
        <View style={styles.listTitleRow}>
          {activeList.aiGenerated && !isNotePadOpen && (
            <View style={styles.aiListTitleIcon}>
              <Ionicons name="hardware-chip" size={13} color="#8A651B" />
            </View>
          )}
          <Text style={styles.listTitle}>
            {isNotePadOpen
              ? `Notitieblok · ${activeList.name}`
              : activeList.name}
          </Text>
        </View>
        {premium.premiumActive && premium.consent?.granted === true && (
          <View style={styles.listAssistantToggle}>
            <Ionicons
              name="sparkles-outline"
              size={13}
              color={activeList.assistantEnabled ? COLORS.primary : COLORS.textSoft}
            />
            <Text style={styles.listAssistantToggleLabel}>AI</Text>
            <Switch
              value={activeList.assistantEnabled === true}
              onValueChange={setActiveListAssistantEnabled}
              trackColor={{ false: "#D8DEDA", true: "#9AC5A8" }}
              thumbColor={
                activeList.assistantEnabled ? COLORS.primary : "#F7F8F7"
              }
              style={styles.listAssistantSwitch}
              accessibilityLabel={`Slimme assistent voor ${activeList.name}`}
            />
          </View>
        )}
      </View>

      <PremiumAssistant
        items={items}
        listId={activeListId}
        enabled={activeList.assistantEnabled === true}
        isOnline={isOnline}
        navigation={navigation}
        onAddProduct={(name) => addProductByName(name)}
      />
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
        {isNotePadOpen ? (
          <ScrollView
            style={styles.notePadScroll}
            contentContainerStyle={[
              styles.listContent,
              styles.notePadContent,
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios"
                ? "interactive"
                : "on-drag"
            }
            showsVerticalScrollIndicator={false}
          >
            {renderListHeader()}

            <Pressable
              style={styles.notePadDismissArea}
              onPress={closeNotePad}
              accessible={false}
            >
              <Pressable
                style={styles.notePadCard}
                onPress={(event) => event.stopPropagation()}
              >
                <TextInput
                  style={styles.notePadInput}
                  value={activeListNote}
                  onChangeText={updateActiveListNote}
                  onBlur={flushPendingNote}
                  multiline
                  autoFocus
                  textAlignVertical="top"
                  placeholder="Schrijf hier je notities..."
                  placeholderTextColor="#9AA39D"
                  maxLength={10000}
                  accessibilityLabel={`Notities voor ${activeList.name}`}
                />
              </Pressable>
            </Pressable>
          </ScrollView>
        ) : (
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
        )}

        {storePresencePrompt && (
          <View
            style={styles.storePresencePrompt}
            accessibilityRole="alert"
          >
            <View style={styles.storePresencePromptIcon}>
              <Ionicons
                name="storefront-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.storePresencePromptCopy}>
              <Text style={styles.storePresencePromptTitle}>
                Ben je nu bij {storePresencePrompt.storeName}?
              </Text>
              <Text style={styles.storePresencePromptText}>
                {storePresencePrompt.address ||
                  "Adres niet beschikbaar"}
              </Text>
            </View>

            <View style={styles.storePresencePromptActions}>
              <TouchableOpacity
                style={styles.storePresenceNoButton}
                onPress={() =>
                  handleStorePresenceResponse(false)
                }
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Nee, ik ben niet bij deze winkel"
              >
                <Text style={styles.storePresenceNoText}>
                  Nee
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.storePresenceYesButton}
                onPress={() =>
                  handleStorePresenceResponse(true)
                }
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Ja, ik ben bij deze winkel"
              >
                <Text style={styles.storePresenceYesText}>
                  Ja
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.notePadIcon,
            isNotePadOpen && styles.notePadIconActive,
          ]}
          onPress={toggleNotePad}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={
            isNotePadOpen
              ? "Terug naar de boodschappenlijst"
              : "Notitieblok openen"
          }
          accessibilityState={{ selected: isNotePadOpen }}
        >
          <Ionicons
            name="document-text-outline"
            size={18}
            color={
              isNotePadOpen
                ? "#FFFFFF"
                : COLORS.primary
            }
          />
        </TouchableOpacity>

        {/* Profile button */}
        <TouchableOpacity
          style={[
            styles.profileButton,
            premium.premiumActive && styles.profileButtonPro,
          ]}
          onPress={() => {
            flushPendingNote();
            navigation.navigate("Profiel");
          }}
          activeOpacity={0.85}
        >
          <Ionicons
            name={premium.premiumActive ? "person" : "person-outline"}
            size={24}
            color={premium.premiumActive ? COLORS.text : "#FFFFFF"}
          />
          {premium.premiumActive && (
            <View style={styles.profileProBadge}>
              <Ionicons name="diamond" size={9} color="#FFFFFF" />
              <Text style={styles.profileProBadgeText}>PRO</Text>
            </View>
          )}
        </TouchableOpacity>

        {!isNotePadOpen && sections.length > 0 && (
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

                        measureInDragCoordinates(
                          node,
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
        visible={Boolean(assignmentCategory)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeAssignmentPicker}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            style={styles.centerModalBackdrop}
            onPress={closeAssignmentPicker}
          >
            <Pressable
              style={[styles.storeModal, styles.assignmentModal]}
              onPress={(event) => event.stopPropagation()}
            >
              <View style={styles.modalHeadingRow}>
                <View style={styles.assignmentHeadingCopy}>
                  <Text style={styles.modalEyebrow}>
                    TOEWIJZEN
                  </Text>
                  <Text style={styles.modalTitle} numberOfLines={2}>
                    {assignmentCategory}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeAssignmentPicker}
                  accessibilityLabel="Toewijzen sluiten"
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color={COLORS.text}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.assignmentDescription}>
                Wie neemt deze categorie mee?
              </Text>

              <ScrollView
                style={styles.assignmentPeopleScroll}
                contentContainerStyle={styles.assignmentPeopleList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {categoryAssignments[assignmentCategory] && (
                  <TouchableOpacity
                    style={styles.assignmentPersonOption}
                    onPress={() => assignPersonToCategory(null)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.assignmentNobodyIcon}>
                      <Ionicons
                        name="remove"
                        size={17}
                        color={COLORS.textSoft}
                      />
                    </View>
                    <Text style={styles.assignmentNobodyText}>
                      Niemand
                    </Text>
                  </TouchableOpacity>
                )}

                {people.map((person) => {
                  const colors = getPersonColors(person);
                  const selected =
                    categoryAssignments[assignmentCategory] ===
                    person.id;

                  return (
                    <TouchableOpacity
                      key={person.id}
                      style={[
                        styles.assignmentPersonOption,
                        selected && {
                          borderColor: colors.dot,
                          backgroundColor: colors.background,
                        },
                      ]}
                      onPress={() =>
                        assignPersonToCategory(person.id)
                      }
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.assignmentPersonAvatar,
                          { backgroundColor: colors.background },
                        ]}
                      >
                        <Text
                          style={[
                            styles.assignmentPersonInitial,
                            { color: colors.text },
                          ]}
                        >
                          {person.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.assignmentPersonName,
                          { color: colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {person.name}
                      </Text>

                      {selected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.dot}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}

                {people.length === 0 && (
                  <Text style={styles.assignmentEmptyText}>
                    Voeg hieronder eerst een naam toe.
                  </Text>
                )}
              </ScrollView>

              <Text style={styles.assignmentCreateLabel}>
                Nieuwe persoon
              </Text>

              <View style={styles.assignmentCreateRow}>
                <View
                  style={[
                    styles.inputContainer,
                    styles.assignmentInputContainer,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={19}
                    color={COLORS.textSoft}
                  />
                  <TextInput
                    style={styles.input}
                    value={newPersonName}
                    onChangeText={setNewPersonName}
                    placeholder="Naam"
                    placeholderTextColor="#98A19B"
                    returnKeyType="done"
                    onSubmitEditing={addPersonAndAssign}
                    maxLength={30}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.assignmentAddButton,
                    !newPersonName.trim() &&
                      styles.assignmentAddButtonDisabled,
                  ]}
                  onPress={addPersonAndAssign}
                  disabled={!newPersonName.trim()}
                  activeOpacity={0.75}
                  accessibilityLabel="Persoon toevoegen en toewijzen"
                >
                  <Ionicons name="add" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={itemModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeItemModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
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
        visible={listModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeListModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            style={styles.centerModalBackdrop}
            onPress={closeListModal}
          >
            <Pressable
              style={styles.storeModal}
              onPress={(event) => event.stopPropagation()}
            >
              <View style={styles.modalHeadingRow}>
                <View>
                  <Text style={styles.modalEyebrow}>
                    NIEUWE LIJST
                  </Text>
                  <Text style={styles.modalTitle}>
                    {newListMode === "ai" ? "Laat AI je lijst starten" : "Maak een lijst"}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeListModal}
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color={COLORS.text}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDescription}>
                Kies zelf een lege lijst of laat SortIt een praktische startlijst maken.
              </Text>

              <View style={styles.listModeRow}>
                <TouchableOpacity
                  style={[
                    styles.listModeOption,
                    newListMode === "standard" && styles.listModeOptionSelected,
                  ]}
                  onPress={() => setNewListMode("standard")}
                  activeOpacity={0.78}
                >
                  <View style={styles.listModeIcon}>
                    <Ionicons name="list-outline" size={18} color={COLORS.primaryDark} />
                  </View>
                  <Text style={styles.listModeTitle}>Zelf maken</Text>
                  <Text style={styles.listModeText}>Begin leeg</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.listModeOption,
                    styles.aiListModeOption,
                    newListMode === "ai" && styles.aiListModeOptionSelected,
                  ]}
                  onPress={() => setNewListMode("ai")}
                  activeOpacity={0.78}
                >
                  <View style={[styles.listModeIcon, styles.aiListModeIcon]}>
                    <Ionicons name="hardware-chip-outline" size={18} color="#8A651B" />
                  </View>
                  <Text style={styles.listModeTitle}>AI-lijst</Text>
                  <Text style={styles.listModeText}>Slimme start</Text>
                  {!premium.premiumActive && (
                    <Ionicons name="lock-closed" size={11} color="#8A651B" style={styles.aiListLock} />
                  )}
                </TouchableOpacity>
              </View>

              {newListMode === "standard" ? (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons name="list-outline" size={21} color={COLORS.textSoft} />
                    <TextInput
                      style={styles.input}
                      value={newListName}
                      onChangeText={setNewListName}
                      placeholder="Bijvoorbeeld Weekend"
                      placeholderTextColor="#98A19B"
                      returnKeyType="done"
                      onSubmitEditing={createList}
                      maxLength={30}
                      selectTextOnFocus
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.saveButton, !newListName.trim() && styles.saveButtonDisabled]}
                    onPress={createList}
                    disabled={!newListName.trim()}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add-circle-outline" size={21} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Lege lijst toevoegen</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={[styles.inputContainer, styles.aiGoalInput]}>
                    <Ionicons name="sparkles-outline" size={20} color="#8A651B" />
                    <TextInput
                      style={styles.input}
                      value={aiListGoal}
                      onChangeText={setAiListGoal}
                      placeholder="Bijv. weekboodschappen voor 2"
                      placeholderTextColor="#98A19B"
                      returnKeyType="done"
                      onSubmitEditing={createAiList}
                      maxLength={180}
                    />
                  </View>
                  <View style={styles.aiGoalExamples}>
                    {["Weekmenu", "BBQ", "Ontbijt", "Feestje"].map((goal) => (
                      <TouchableOpacity
                        key={goal}
                        style={styles.aiGoalChip}
                        onPress={() => setAiListGoal(goal)}
                        activeOpacity={0.72}
                      >
                        <Text style={styles.aiGoalChipText}>{goal}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      styles.aiListCreateButton,
                      (!aiListGoal.trim() || creatingAiList) && styles.saveButtonDisabled,
                    ]}
                    onPress={createAiList}
                    disabled={!aiListGoal.trim() || creatingAiList}
                    activeOpacity={0.8}
                  >
                    {creatingAiList ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Ionicons
                        name={premium.premiumActive ? "hardware-chip-outline" : "lock-closed-outline"}
                        size={20}
                        color="#FFFFFF"
                      />
                    )}
                    <Text style={styles.saveButtonText}>
                      {!premium.premiumActive
                        ? "Ontdek SortIt Pro"
                        : premium.consent?.granted !== true
                          ? "Activeer in Pro-instellingen"
                          : "Maak mijn AI-lijst"}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.aiListPrivacyText}>
                    Gebruikt je Pro-voorkeuren en historie; je kunt alles daarna aanpassen.
                  </Text>
                </>
              )}
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
              Kies een supermarkt in {currentCountry.label}. De volgorde van de
              categorieën past zich aan je keuze aan. SortIt is onafhankelijk
              en niet verbonden aan deze supermarktketens.
            </Text>

            <ScrollView
              style={styles.storeOptionsScroll}
              contentContainerStyle={styles.storeOptions}
              showsVerticalScrollIndicator={false}
            >
              {allStores.map((store) => {
                const selected = selectedStore === store.name;

                return (
                  <View
                    key={store.id}
                    style={[
                      styles.storeOption,
                      selected && styles.storeOptionSelected,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.storeOptionMain}
                      onPress={() => selectStore(store.name)}
                      activeOpacity={0.75}
                    >
                      {getStoreLogoSource(store) ? (
                        <Image
                          source={getStoreLogoSource(store)}
                          style={styles.storeOptionLogo}
                          resizeMode="contain"
                        />
                      ) : (
                        <View
                          style={styles.storeOptionLogoFallback}
                        >
                          <Ionicons
                            name="storefront-outline"
                            size={20}
                            color={COLORS.primary}
                          />
                        </View>
                      )}

                      <Text
                        style={[
                          styles.storeOptionText,
                          selected &&
                            styles.storeOptionTextSelected,
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

                    {store.isCustom && (
                      <TouchableOpacity
                        style={styles.customStoreDeleteButton}
                        onPress={() =>
                          confirmRemoveCustomStore(store)
                        }
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`${store.name} verwijderen`}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={19}
                          color={COLORS.danger}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}

              <TouchableOpacity
                style={styles.addCustomStoreOption}
                onPress={openCustomStoreModal}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Custom-winkel toevoegen"
              >
                <View style={styles.addCustomStoreIcon}>
                  <Ionicons
                    name="add"
                    size={22}
                    color={COLORS.primary}
                  />
                </View>
                <View style={styles.addCustomStoreCopy}>
                  <Text style={styles.addCustomStoreTitle}>
                    Custom winkel
                  </Text>
                  <Text style={styles.addCustomStoreText}>
                    Eigen naam, optionele afbeelding en volgorde
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.textSoft}
                />
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={customStoreModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeCustomStoreModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            style={styles.centerModalBackdrop}
            onPress={closeCustomStoreModal}
          >
            <Pressable
              style={[
                styles.storeModal,
                styles.customStoreEditor,
              ]}
              onPress={(event) => event.stopPropagation()}
            >
              <View style={styles.modalHeadingRow}>
                <View style={styles.customStoreHeadingCopy}>
                  <Text style={styles.modalEyebrow}>
                    CUSTOM WINKEL
                  </Text>
                  <Text style={styles.modalTitle}>
                    Maak je eigen winkel
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeCustomStoreModal}
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color={COLORS.text}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.customStoreDescription}>
                Voeg eventueel een afbeelding toe en zet de
                categorieën in de volgorde waarin je door de
                winkel loopt.
              </Text>

              <ScrollView
                style={styles.customStoreEditorScroll}
                contentContainerStyle={
                  styles.customStoreEditorContent
                }
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.customStoreFieldLabel}>
                  Afbeelding (optioneel)
                </Text>

                <TouchableOpacity
                  style={styles.customStoreLogoPicker}
                  onPress={pickCustomStoreLogo}
                  disabled={isPickingStoreLogo}
                  activeOpacity={0.75}
                >
                  {customStoreLogoUri ? (
                    <>
                      <Image
                        source={{
                          uri: customStoreLogoUri,
                        }}
                        style={styles.customStoreLogoPreview}
                        resizeMode="cover"
                      />
                      <View
                        style={styles.customStoreLogoEditBadge}
                      >
                        <Ionicons
                          name="pencil"
                          size={15}
                          color="#FFFFFF"
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <View
                        style={
                          styles.customStoreLogoPlaceholder
                        }
                      >
                        <Ionicons
                          name={
                            isPickingStoreLogo
                              ? "hourglass-outline"
                              : "image-outline"
                          }
                          size={30}
                          color={COLORS.primary}
                        />
                      </View>
                      <Text
                        style={styles.customStoreLogoPickerText}
                      >
                        {isPickingStoreLogo
                          ? "Afbeelding verwerken..."
                          : "Kies een afbeelding"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={styles.customStoreFieldLabel}>
                  Naam
                </Text>

                <View style={styles.inputContainer}>
                  <Ionicons
                    name="storefront-outline"
                    size={21}
                    color={COLORS.textSoft}
                  />
                  <TextInput
                    style={styles.input}
                    value={customStoreName}
                    onChangeText={setCustomStoreName}
                    placeholder="Bijvoorbeeld Buurtsuper"
                    placeholderTextColor="#98A19B"
                    returnKeyType="done"
                    maxLength={30}
                  />
                </View>

                <View style={styles.customStoreCategoryHeading}>
                  <View>
                    <Text style={styles.customStoreFieldLabel}>
                      Categorievolgorde
                    </Text>
                    <Text
                      style={styles.customStoreCategoryHelp}
                    >
                      Gebruik de pijlen om categorieën te
                      verplaatsen.
                    </Text>
                  </View>
                </View>

                <View style={styles.customStoreCategoryList}>
                  {orderedCustomStoreCategories.map(
                    (category, index) => (
                      <View
                        key={category}
                        style={styles.customStoreCategoryRow}
                      >
                        <Text
                          style={styles.customStoreCategoryNumber}
                        >
                          {index + 1}
                        </Text>
                        <View
                          style={styles.customStoreCategoryIcon}
                        >
                          <Ionicons
                            name={
                              categoryIcons[category] ??
                              "basket-outline"
                            }
                            size={17}
                            color={COLORS.primary}
                          />
                        </View>
                        <Text
                          style={styles.customStoreCategoryText}
                        >
                          {category}
                        </Text>
                        <View
                          style={styles.customStoreCategoryActions}
                        >
                          <TouchableOpacity
                            style={[
                              styles.customStoreCategoryMove,
                              index === 0 &&
                                styles.customStoreCategoryMoveDisabled,
                            ]}
                            onPress={() =>
                              moveCustomStoreCategory(index, -1)
                            }
                            disabled={index === 0}
                            accessibilityLabel={`${category} omhoog`}
                          >
                            <Ionicons
                              name="chevron-up"
                              size={17}
                              color={
                                index === 0
                                  ? "#BAC2BC"
                                  : COLORS.text
                              }
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.customStoreCategoryMove,
                              index ===
                                orderedCustomStoreCategories.length -
                                  1 &&
                                styles.customStoreCategoryMoveDisabled,
                            ]}
                            onPress={() =>
                              moveCustomStoreCategory(index, 1)
                            }
                            disabled={
                              index ===
                              orderedCustomStoreCategories.length -
                                1
                            }
                            accessibilityLabel={`${category} omlaag`}
                          >
                            <Ionicons
                              name="chevron-down"
                              size={17}
                              color={
                                index ===
                                orderedCustomStoreCategories.length -
                                  1
                                  ? "#BAC2BC"
                                  : COLORS.text
                              }
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )
                  )}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  styles.customStoreSaveButton,
                  (!customStoreName.trim() ||
                    isPickingStoreLogo) &&
                    styles.saveButtonDisabled,
                ]}
                onPress={createCustomStore}
                disabled={
                  !customStoreName.trim() ||
                  isPickingStoreLogo
                }
                activeOpacity={0.8}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={21}
                  color="#FFFFFF"
                />
                <Text style={styles.saveButtonText}>
                  Winkel opslaan en kiezen
                </Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
