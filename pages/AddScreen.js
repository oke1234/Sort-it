import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Switch } from "react-native";
import { Picker } from "@react-native-picker/picker";

export default function AddScreen({ pills, setPills, setScreen }) {
  const [category, setCategory] = useState(null);
  const [name, setName] = useState("");

  const [isScheduled, setIsScheduled] = useState(true);

  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");
  const [days, setDays] = useState([]);

  const [todoType, setTodoType] = useState("none");

  const [weekNumber, setWeekNumber] = useState("");
  const [monthNumber, setMonthNumber] = useState("");
  const [dateValue, setDateValue] = useState("");

  const weekDays = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

  const toggleDay = (day) => {
    if (days.includes(day)) {
      setDays(days.filter((d) => d !== day));
    } else {
      setDays([...days, day]);
    }
  };

  const addItem = () => {
    if (!category) {
      alert("Selecteer een categorie");
      return;
    }

    if (!name.trim()) {
      alert("Vul een naam in");
      return;
    }

    if (isScheduled && days.length === 0) {
      alert("Selecteer minstens één dag");
      return;
    }

    if (!isScheduled && todoType === "Week" && !weekNumber) {
      alert("Vul een weeknummer in");
      return;
    }

    if (!isScheduled && todoType === "Maand" && !monthNumber) {
      alert("Vul een maandnummer in");
      return;
    }

    if (!isScheduled && todoType === "Datum" && !dateValue) {
      alert("Vul een datum in");
      return;
    }

    let newItem = {
      id: Date.now().toString(),
      name,
      category,
      completedDates: [],
    };

    if (isScheduled) {
      newItem = {
        ...newItem,
        type: "scheduled",
        time: `${hour}:${minute}`,
        days,
      };
    } else {
      newItem = {
        ...newItem,
        type: "todo",
        todoType,
        weekNumber: todoType === "Week" ? weekNumber : null,
        monthNumber: todoType === "Maand" ? monthNumber : null,
        dueDate: todoType === "Datum" ? dateValue : null,
      };
    }

    setPills([...pills, newItem]);
    setScreen("home");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", padding: 20 }}>

      <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 20 }}>
        Nieuw item
      </Text>

      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 20,
          padding: 16,

          shadowColor: "#c72929",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,

          elevation: 5, // Android
        }}
      >
        {/* CATEGORY ROW */}
        <View style={{ flexDirection: "row" }}>
          {["voeding", "supplement", "overig"].map((c, index) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCategory(c)}
              style={{
                flex: 1,
                marginRight: index === 2 ? 0 : 5,
                padding: 10,
                backgroundColor: category === c ? "#4CAF50" : "#eee",
                borderRadius: 10,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontWeight: "600",
                  textAlign: "center",
                  width: "100%",
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* NAME */}
        <Text style={{ marginTop: 20, marginBottom: 6, color: "#666", fontWeight: "600", marginLeft: 1 }}>Naam</Text>
        <TextInput
          value={name}  
          onChangeText={setName}
          placeholder="Bijv. Vitamine D"
          placeholderTextColor="#aaa"
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            padding: 12,
            borderRadius: 12,
            marginBottom: 20,
            backgroundColor: "#FAFAFA",
          }}
        />

        {/* SWITCH */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <Text style={{ color: "#666", fontWeight: "600", marginLeft: 1}}>Schema</Text>
            <Switch
              style={{ marginLeft: 12 }}
              value={isScheduled}
              onValueChange={setIsScheduled}
            />
        </View>

        {/* SCHEDULED */}
        {isScheduled && (
          <View>
            <Text style={{ marginBottom: 6, color: "#666", fontWeight: "600", marginLeft: 1 }}>Tijd</Text>

            <View style={{
              flexDirection: "row",
              marginBottom: 18,
              backgroundColor: "#FAFAFA",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#ddd",
              padding: 6,
            }}>
              <View style={{ flex: 1 }}>
                <Picker selectedValue={hour} onValueChange={setHour} dropdownIconColor="#000000"
                  style={{ color: "#000000" }}
                  >
                  {Array.from({ length: 24 }, (_, i) => {
                    const v = i.toString().padStart(2, "0");
                    return <Picker.Item key={v} label={v} value={v} />;
                  })}
                </Picker>
              </View>

              <View style={{ flex: 1 }}>
                <Picker selectedValue={minute} onValueChange={setMinute}
                  dropdownIconColor="#000000"
                  style={{ color: "#000000"}}
                  >
                  {Array.from({ length: 60 }, (_, i) => {
                    const v = i.toString().padStart(2, "0");
                    return <Picker.Item key={v} label={v} value={v} />;
                  })}
                </Picker>
              </View>
            </View>

            <Text style={{ marginBottom: 8, color: "#666", fontWeight: "600", marginLeft: 1  }}>Dagen</Text>
            <View style={{
              flexDirection: "row",
              flexWrap: "wrap",
              marginBottom: 0,
              justifyContent: "space-between"
            }}>
              {weekDays.map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => toggleDay(d)}
                  style={{
                    flexBasis: "13%",   // makes 7 fit in a row
                    paddingVertical: 8,
                    borderRadius: 12,
                    marginBottom: 8,
                    backgroundColor: days.includes(d) ? "#4CAF50" : "#EAEAEA",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: days.includes(d) ? "white" : "#333", fontWeight: "600" }}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* TODO */}
        {!isScheduled && (
          <View>
            <Text style={{ marginBottom: 8, color: "#666", fontWeight: "600" }}>Planning</Text>

            {["Geen", "Week", "Maand", "Datum"].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTodoType(t)}
                style={{
                  padding: 12,
                  marginBottom: 8,
                  backgroundColor: todoType === t ? "#4CAF50" : "#eee",
                  borderRadius: 10,
                }}
              >
                <Text style={{ fontWeight: "600" }}>{t}</Text>
              </TouchableOpacity>
            ))}

            {todoType === "Week" && (
              <TextInput
                value={weekNumber}
                onChangeText={setWeekNumber}
                placeholder="Welke week? (bv 12)"
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 10, marginTop: 10, backgroundColor: "#FAFAFA" }}
              />
            )}

            {todoType === "Maand" && (
              <TextInput
                value={monthNumber}
                onChangeText={setMonthNumber}
                placeholder="Welke maand? (1-12)"
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 10, marginTop: 10, backgroundColor: "#FAFAFA" }}
              />
            )}

            {todoType === "Datum" && (
              <TextInput
                value={dateValue}
                onChangeText={setDateValue}
                placeholder="Datum (bv 2026-06-23)"
                style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 10, marginTop: 10, backgroundColor: "#FAFAFA" }}
              />
            )}
          </View>
        )}

        {/* SAVE */}
        <TouchableOpacity
          onPress={addItem}
          style={{
            marginTop: 20,
            backgroundColor: "#111",
            padding: 14,
            borderRadius: 12,
            alignItems: "center",
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
            Opslaan
          </Text>
        </TouchableOpacity>
      
      </View>
    </View>
  );
}