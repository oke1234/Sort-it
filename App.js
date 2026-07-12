import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const STORAGE_KEY = "SHOPPING_ITEMS";
const STORE_KEY = "SELECTED_STORE";

const stores = ["Lidl", "Jumbo", "Albert Heijn"];

const storeRoutes = {
  Lidl: [
    "Groente en fruit",
    "Brood",
    "Ontbijt",
    "Conserven",
    "Pasta en rijst",
    "Sauzen en kruiden",
    "Drinken",
    "Snacks en snoep",
    "Koeling en zuivel",
    "Vlees en vis",
    "Diepvries",
    "Huishouden",
    "Overig",
  ],

  Jumbo: [
    "Groente en fruit",
    "Brood",
    "Vlees en vis",
    "Koeling en zuivel",
    "Ontbijt",
    "Pasta en rijst",
    "Conserven",
    "Sauzen en kruiden",
    "Snacks en snoep",
    "Drinken",
    "Diepvries",
    "Huishouden",
    "Overig",
  ],

  "Albert Heijn": [
    "Groente en fruit",
    "Brood",
    "Vlees en vis",
    "Koeling en zuivel",
    "Ontbijt",
    "Pasta en rijst",
    "Sauzen en kruiden",
    "Conserven",
    "Snacks en snoep",
    "Drinken",
    "Diepvries",
    "Huishouden",
    "Overig",
  ],
};

const categoryKeywords = {
  "Groente en fruit": [
    "appel",
    "banaan",
    "peer",
    "sinaasappel",
    "mandarijn",
    "aardbei",
    "druif",
    "tomaat",
    "komkommer",
    "sla",
    "paprika",
    "ui",
    "knoflook",
    "aardappel",
    "wortel",
    "courgette",
    "broccoli",
    "bloemkool",
    "fruit",
    "groente",
  ],

  Brood: [
    "brood",
    "bolletje",
    "croissant",
    "stokbrood",
    "wrap",
    "toast",
    "beschuit",
  ],

  "Koeling en zuivel": [
    "melk",
    "kaas",
    "yoghurt",
    "kwark",
    "boter",
    "room",
    "vla",
    "ei",
    "eieren",
    "zuivel",
  ],

  "Vlees en vis": [
    "kip",
    "gehakt",
    "vlees",
    "vis",
    "zalm",
    "worst",
    "hamburger",
    "spek",
    "tonijn",
  ],

  Ontbijt: [
    "cornflakes",
    "muesli",
    "havermout",
    "ontbijt",
    "jam",
    "hagelslag",
    "pindakaas",
  ],

  "Pasta en rijst": [
    "pasta",
    "spaghetti",
    "macaroni",
    "rijst",
    "noedels",
    "couscous",
  ],

  Conserven: [
    "blik",
    "bonen",
    "mais",
    "erwten",
    "soep",
    "tomatenblokjes",
  ],

  "Sauzen en kruiden": [
    "saus",
    "ketchup",
    "mayonaise",
    "mosterd",
    "kruiden",
    "zout",
    "peper",
    "olie",
    "azijn",
  ],

  Drinken: [
    "cola",
    "water",
    "sap",
    "limonade",
    "koffie",
    "thee",
    "bier",
    "wijn",
    "drinken",
  ],

  "Snacks en snoep": [
    "chips",
    "snoep",
    "koek",
    "chocolade",
    "nootjes",
    "popcorn",
    "snack",
  ],

  Diepvries: [
    "diepvries",
    "ijs",
    "pizza",
    "friet",
    "patat",
    "bevroren",
  ],

  Huishouden: [
    "toiletpapier",
    "keukenrol",
    "wasmiddel",
    "afwasmiddel",
    "schoonmaak",
    "vuilniszak",
    "zeep",
    "shampoo",
    "tandpasta",
  ],
};

function getCategory(itemName) {
  const name = itemName.toLowerCase();

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    const match = keywords.some((keyword) => name.includes(keyword));

    if (match) {
      return category;
    }
  }

  return "Overig";
}

export default function App() {
  const [items, setItems] = useState([]);
  const [selectedStore, setSelectedStore] = useState("Lidl");
  const [newItem, setNewItem] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [storeMenuVisible, setStoreMenuVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loaded) return;

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  useEffect(() => {
    if (!loaded) return;

    AsyncStorage.setItem(STORE_KEY, selectedStore);
  }, [selectedStore, loaded]);

  const loadData = async () => {
    try {
      const savedItems = await AsyncStorage.getItem(STORAGE_KEY);
      const savedStore = await AsyncStorage.getItem(STORE_KEY);

      if (savedItems) {
        setItems(JSON.parse(savedItems));
      }

      if (savedStore) {
        setSelectedStore(savedStore);
      }
    } catch (error) {
      Alert.alert("Fout", "De boodschappen konden niet worden geladen.");
    } finally {
      setLoaded(true);
    }
  };

  const addItem = () => {
    const cleanedName = newItem.trim();

    if (!cleanedName) {
      return;
    }

    const item = {
      id: Date.now().toString(),
      name: cleanedName,
      category: getCategory(cleanedName),
      completed: false,
    };

    setItems((currentItems) => [...currentItems, item]);
    setNewItem("");
    setModalVisible(false);
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

  const clearCompleted = () => {
    const completedItems = items.filter((item) => item.completed);

    if (completedItems.length === 0) {
      Alert.alert("Geen producten", "Er zijn nog geen producten afgevinkt.");
      return;
    }

    Alert.alert(
      "Afgevinkte producten verwijderen",
      "Weet je zeker dat je alle afgevinkte producten wilt verwijderen?",
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

  const sortedSections = useMemo(() => {
    const route = storeRoutes[selectedStore];

    return route
      .map((category) => ({
        category,
        items: items
          .filter((item) => item.category === category)
          .sort((a, b) => {
            if (a.completed === b.completed) {
              return a.name.localeCompare(b.name);
            }

            return a.completed ? 1 : -1;
          }),
      }))
      .filter((section) => section.items.length > 0);
  }, [items, selectedStore]);

  const renderShoppingItem = ({ item }) => (
    <View style={styles.itemRow}>
      <TouchableOpacity
        style={styles.itemMain}
        onPress={() => toggleItem(item.id)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={item.completed ? "checkmark-circle" : "ellipse-outline"}
          size={27}
          color={item.completed ? "#2f8f4e" : "#707070"}
        />

        <Text
          style={[
            styles.itemText,
            item.completed && styles.completedItemText,
          ]}
        >
          {item.name}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => removeItem(item.id)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash-outline" size={21} color="#cc3b3b" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.smallTitle}>Mijn boodschappen</Text>
            <Text style={styles.title}>Smart Shopping</Text>
          </View>

          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearCompleted}
          >
            <Ionicons name="checkmark-done" size={22} color="#2f8f4e" />
          </TouchableOpacity>
        </View>

        <Text style={styles.storeLabel}>Welke winkel?</Text>

        <TouchableOpacity
          style={styles.storeSelector}
          onPress={() => setStoreMenuVisible(true)}
        >
          <View style={styles.storeSelectorLeft}>
            <Ionicons name="storefront-outline" size={23} color="#222" />

            <Text style={styles.storeSelectorText}>
              {selectedStore}
            </Text>
          </View>

          <Ionicons name="chevron-down" size={22} color="#555" />
        </TouchableOpacity>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Boodschappenlijst</Text>

          <Text style={styles.itemCount}>
            {items.filter((item) => !item.completed).length} open
          </Text>
        </View>

        {sortedSections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="basket-outline" size={70} color="#bbbbbb" />

            <Text style={styles.emptyTitle}>
              Je lijst is nog leeg
            </Text>

            <Text style={styles.emptyText}>
              Druk op de plusknop om je eerste boodschap toe te voegen.
            </Text>
          </View>
        ) : (
          <FlatList
            data={sortedSections}
            keyExtractor={(section) => section.category}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item: section }) => (
              <View style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>
                    {section.category}
                  </Text>

                  <Text style={styles.categoryCount}>
                    {section.items.length}
                  </Text>
                </View>

                <FlatList
                  data={section.items}
                  keyExtractor={(item) => item.id}
                  renderItem={renderShoppingItem}
                  scrollEnabled={false}
                />
              </View>
            )}
          />
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={34} color="white" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackground}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>
              Boodschap toevoegen
            </Text>

            <Text style={styles.modalDescription}>
              Vul een product in. De app kiest automatisch een categorie.
            </Text>

            <TextInput
              style={styles.input}
              value={newItem}
              onChangeText={setNewItem}
              placeholder="Bijvoorbeeld: 2 pakken melk"
              placeholderTextColor="#999"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={addItem}
            />

            <TouchableOpacity
              style={[
                styles.saveButton,
                !newItem.trim() && styles.disabledButton,
              ]}
              onPress={addItem}
              disabled={!newItem.trim()}
            >
              <Text style={styles.saveButtonText}>
                Toevoegen
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={storeMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStoreMenuVisible(false)}
      >
        <Pressable
          style={styles.storeModalBackground}
          onPress={() => setStoreMenuVisible(false)}
        >
          <View style={styles.storeModalCard}>
            <Text style={styles.storeModalTitle}>
              Kies een winkel
            </Text>

            {stores.map((store) => (
              <TouchableOpacity
                key={store}
                style={styles.storeOption}
                onPress={() => {
                  setSelectedStore(store);
                  setStoreMenuVisible(false);
                }}
              >
                <Text style={styles.storeOptionText}>{store}</Text>

                {selectedStore === store && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color="#2f8f4e"
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f7f4",
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 26,
  },

  smallTitle: {
    fontSize: 14,
    color: "#707070",
    marginBottom: 3,
  },

  title: {
    fontSize: 29,
    fontWeight: "800",
    color: "#1c1c1c",
  },

  clearButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },

  storeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },

  storeSelector: {
    backgroundColor: "white",
    borderRadius: 17,
    paddingHorizontal: 17,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 7,
  },

  storeSelectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  storeSelectorText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
  },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  listTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#222",
  },

  itemCount: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#e8ebe5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  listContent: {
    paddingBottom: 130,
  },

  categorySection: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
  },

  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },

  categoryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#2f8f4e",
  },

  categoryCount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#777",
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 49,
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
  },

  itemMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 10,
  },

  itemText: {
    flex: 1,
    fontSize: 16,
    color: "#292929",
  },

  completedItemText: {
    color: "#999",
    textDecorationLine: "line-through",
  },

  deleteButton: {
    padding: 10,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
    paddingHorizontal: 35,
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#333",
    marginTop: 17,
    marginBottom: 7,
  },

  emptyText: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
    lineHeight: 22,
  },

  addButton: {
    position: "absolute",
    right: 23,
    bottom: 30,
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#2f8f4e",
    alignItems: "center",
    justifyContent: "center",
    elevation: 7,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.38)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "white",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 35,
  },

  modalHandle: {
    alignSelf: "center",
    width: 45,
    height: 5,
    borderRadius: 10,
    backgroundColor: "#d5d5d5",
    marginBottom: 22,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#222",
    marginBottom: 8,
  },

  modalDescription: {
    fontSize: 15,
    color: "#777",
    lineHeight: 21,
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#dadada",
    backgroundColor: "#fafafa",
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 17,
    color: "#222",
    marginBottom: 15,
  },

  saveButton: {
    backgroundColor: "#2f8f4e",
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 15,
  },

  disabledButton: {
    opacity: 0.45,
  },

  saveButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "800",
  },

  storeModalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.38)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  storeModalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "white",
    borderRadius: 22,
    padding: 20,
  },

  storeModalTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#222",
    marginBottom: 12,
  },

  storeOption: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
  },

  storeOptionText: {
    flex: 1,
    fontSize: 17,
    color: "#333",
  },
});