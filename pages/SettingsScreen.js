import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";


export default function SettingsScreen({ pills, setPills }) {

  const [pinVisible, setPinVisible] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState(null);
  const [pin, setPin] = React.useState("");

  const [editVisible, setEditVisible] = React.useState(false);
  const [editId, setEditId] = React.useState(null);

  const [editMode, setEditMode] = React.useState(false);

  const [editHour, setEditHour] = React.useState("08");
  const [editMinute, setEditMinute] = React.useState("00");
  const [editDays, setEditDays] = React.useState([]);

  const correctPin = "1234";

  const weekDays = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

  const toggleEditDay = (day) => {
    if (editDays.includes(day)) {
      setEditDays(editDays.filter((d) => d !== day));
    } else {
      setEditDays([...editDays, day]);
    }
  };

  const confirmDelete = () => {
    if (pin === correctPin) {
      setPills((currentPills) =>
        currentPills.filter((p) => p.id !== selectedId)
      );

      setPin("");
      setPinVisible(false);
      setSelectedId(null);
    } else {
      alert("Wrong PIN");
    }
  };

  const today = new Date();

  const scheduledPills = pills.filter(
    (pill) => pill.type === "scheduled"
  );

  const totalSupplements = scheduledPills.length;

  const totalTaken = scheduledPills.reduce(
    (sum, pill) => sum + (pill.completedDates || []).length,
    0
  );

  const totalScheduled = scheduledPills.reduce(
    (sum, pill) => sum + (pill.days?.length || 0),
    0
  );

  const saveEdit = () => {
    const time = `${editHour}:${editMinute}`;

    setPills(
      pills.map((p) =>
        p.id === editId
          ? { ...p, time, days: editDays }
          : p
      )
    );

    setEditVisible(false);
    setEditId(null);
  };

  const completionPercent =
    totalScheduled === 0
      ? 0
      : Math.min(
          100,
          Math.round((totalTaken / totalScheduled) * 100)
        );

  const normalizeCategory = (cat) => {
    if (!cat) return "Overig";

    const lower = cat.toLowerCase();

    if (lower === "voeding") return "Voeding";
    if (lower === "supplement") return "Supplementen";

    return "Overig";
  };

  const CATEGORIES = ["Voeding", "Overig", "Supplementen"];

  const groupedScheduled = CATEGORIES.map((cat) => ({
    category: cat,
    items: scheduledPills.filter(
      (p) => normalizeCategory(p.category) === cat
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#fff" }}>
      <View style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 15,
        marginBottom: 20,
      }}>
        <Text style={{ fontSize: 28, fontWeight: "bold", marginLeft: 5 }}>
          Overzicht
        </Text>

        <TouchableOpacity
          onPress={() => setEditMode(!editMode)}
          style={{ flexDirection: "row", alignItems: "center", marginRight: 5 }}
        >
          <MaterialIcons
            name={editMode ? "check" : "menu"}
            size={22}
            color="grey"
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Progress Card */}
        <View
          style={{
            backgroundColor: "#4CAF50",
            borderRadius: 24,
            padding: 22,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5, // Android
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 18,
              fontWeight: "700",
            }}
          >
            Je voortgang
          </Text>

          <Text
            style={{
              color: "white",
              fontSize: 42,
              fontWeight: "bold",
              marginTop: 10,
            }}
          >
            {completionPercent}%
          </Text>

          <Text style={{ color: "rgba(255,255,255,0.9)" }}>
            Algemene voortgang
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 20,
            }}
          >
            <View>
              <Text
                style={{
                  color: "white",
                  fontSize: 22,
                  fontWeight: "bold",
                }}
              >
                {totalSupplements}
              </Text>

              <Text style={{ color: "rgba(255,255,255,0.9)" }}>
                Supplementen
              </Text>
            </View>

            <View>
              <Text
                style={{
                  color: "white",
                  fontSize: 22,
                  fontWeight: "bold",
                }}
              >
                {totalTaken}
              </Text>

              <Text style={{ color: "rgba(255,255,255,0.9)" }}>
                Check-ins
              </Text>
            </View>
          </View>
        </View>

        {/* Empty State */}
        {scheduledPills.length === 0 ? (
          <View
            style={{
              backgroundColor: "white",
              padding: 30,
              borderRadius: 20,
              alignItems: "center",
              marginTop: 20,

              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 50 }}>💊</Text>

            <Text
              style={{
                marginTop: 10,
                fontWeight: "600",
                fontSize: 16,
                textAlign: "center",
              }}
            >
              Nog geen Voedingsmiddelen toegevoegd
            </Text>

            <Text
              style={{
                color: "gray",
                marginTop: 5,
                textAlign: "center",
              }}
            >
              Voeg je eerste voedingsmiddel toe door op de "+" knop te drukken.
            </Text>
          </View>
        ) : (
          groupedScheduled.map((group) => (
            <View key={group.category}>
              <View
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  marginTop: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "400",
                    color: "#111",
                    opacity: 0.6,
                  }}
                >
                  {group.category}
                </Text>
              </View>

              {group.items.map((pill) => {
                const last7Days = Array.from(
                  { length: 7 },
                  (_, index) => {
                    const date = new Date();
                    date.setDate(today.getDate() - (6 - index));
                    return date;
                  }
                );

                return (
                  <View
                    key={pill.id}
                    style={{
                      backgroundColor: "white",
                      padding: 15,
                      borderRadius: 20,
                      marginBottom: 10,
                      shadowColor: "#000",
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 3 },
                      elevation: 3,
                    }}
                  >
                {/* Header */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                      }}
                    >
                      {pill.name}
                    </Text>

                    <Text
                      style={{
                        color: "#666",
                        marginTop: 3,
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "600",
                          textDecorationLine: "underline",
                        }}
                      >
                        {pill.time}
                      </Text>
                      {" op "}
                      {(pill.days || []).join(", ")}
                    </Text>
                  </View>

                  {editMode && (
                    <TouchableOpacity
                      onPress={() => {
                        setEditId(pill.id);
                        const [h, m] = (pill.time || "08:00").split(":");
                        setEditHour(h);
                        setEditMinute(m);
                        setEditDays(pill.days || []);
                        setEditVisible(true);
                      }}
                    >
                      <MaterialIcons name="edit" size={22} color="grey" />
                    </TouchableOpacity>
                  )}

                  {editMode && (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedId(pill.id);
                        setPinVisible(true);
                      }}
                      style={{ padding: 6 }}
                    >
                      <Text style={{ color: "#ff0400", fontSize: 20, opacity: 0.6 }}>
                        ✕
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>


                {/* 7 Day Tracker */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 18,
                  }}
                >
                  {last7Days.map((date) => {
                    const dateString = date.toDateString();

                    const taken = (
                      pill.completedDates || []
                    ).includes(dateString);

                    return (
                      <View
                        key={dateString}
                        style={{ alignItems: "center" }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            color: "#777",
                            marginBottom: 6,
                          }}
                        >
                          {date.toLocaleDateString("nl-NL", { weekday: "short" })}
                        </Text>

                        <View
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 13,
                            backgroundColor: taken
                              ? "#4CAF50"
                              : "#ECECEC",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: taken ? "white" : "#999",
                              fontWeight: "700",
                              fontSize: 12,
                            }}
                          >
                            {taken ? "✓" : "•"}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
          </View>
        ))
      )}
      </ScrollView>

      <Modal visible={pinVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "85%",
              backgroundColor: "white",
              borderRadius: 20,
              padding: 20,
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 5 },
              elevation: 8,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 5 }}>
              Bevestig verwijdering
            </Text>

            <Text style={{ fontSize: 13, color: "#666", marginBottom: 15 }}>
              Voer je PIN in om dit supplement te verwijderen.
            </Text>

            <TextInput
              value={pin}
              onChangeText={setPin}
              keyboardType="numeric"
              secureTextEntry
              placeholder="••••"
              placeholderTextColor="#aaa"
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 12,
                padding: 12,
                fontSize: 16,
                marginBottom: 20,
                textAlign: "center",
                letterSpacing: 6,
              }}
            />

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <TouchableOpacity
                onPress={() => {
                  setPinVisible(false);
                  setPin("");
                  setSelectedId(null);
                }}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: "#eee",
                  marginRight: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "600", color: "#333" }}>
                  Annuleer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmDelete}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: "#ff4d4d",
                  marginLeft: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "600", color: "white" }}>
                  Verwijderen
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal> 

      <Modal visible={editVisible} transparent animationType="fade">
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center"
        }}>
          
          <View style={{
            backgroundColor: "white",
            padding: 18,
            borderRadius: 22,
            width: "85%"
          }}>

            <Text style={{ marginBottom: 6, color: "#666", fontWeight: "600" }}>
              Tijd
            </Text>

            <View style={{
              flexDirection: "row",
              marginBottom: 18,
              backgroundColor: "#FAFAFA",
              borderRadius: 12,
              padding: 6
            }}>
              
              <View style={{ flex: 1 }}>
                <Picker selectedValue={editHour} onValueChange={setEditHour}>
                  {Array.from({ length: 24 }, (_, i) => {
                    const v = i.toString().padStart(2, "0");
                    return <Picker.Item key={v} label={v} value={v} />;
                  })}
                </Picker>
              </View>

              <View style={{ flex: 1 }}>
                <Picker selectedValue={editMinute} onValueChange={setEditMinute}>
                  {Array.from({ length: 60 }, (_, i) => {
                    const v = i.toString().padStart(2, "0");
                    return <Picker.Item key={v} label={v} value={v} />;
                  })}
                </Picker>
              </View>

            </View>

            {/* DAYS (same buttons as AddScreen) */}
            <Text style={{ marginBottom: 8, color: "#666", fontWeight: "600" }}>
              Selecteer dagen
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 18 }}>
              {weekDays.map((day) => (
                <TouchableOpacity
                  key={day}
                  onPress={() => toggleEditDay(day)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    margin: 4,
                    backgroundColor: editDays.includes(day) ? "#4CAF50" : "#EAEAEA",
                  }}
                >
                  <Text style={{
                    color: editDays.includes(day) ? "white" : "#333",
                    fontWeight: "600"
                  }}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* SAVE */}
            <TouchableOpacity
              onPress={saveEdit}
              style={{
                backgroundColor: "#111",
                padding: 15,
                borderRadius: 14,
                alignItems: "center"
              }}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>
                Opslaan
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
}