import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { TextInput, Modal } from "react-native";

export default function HomeScreen({ pills, setPills }) {
    const [pinVisible, setPinVisible] = React.useState(false);
    const [selectedId, setSelectedId] = React.useState(null);
    const [pin, setPin] = React.useState("");
    const [showUpcoming, setShowUpcoming] = React.useState(false);

    const cleanOldTodos = (list) => {
        const now = Date.now();

        return list.filter((p) => {
            if (p.type !== "todo") return true;
            if (!p.completedDates?.length) return true;

            const lastDone = new Date(p.completedDates[p.completedDates.length - 1]).getTime();
            const diffHours = (now - lastDone) / (1000 * 60 * 60);

            return diffHours < 2;
        });
    };    

    React.useEffect(() => {
        const interval = setInterval(() => {
            setPills((prev) => cleanOldTodos(prev));
        }, 3600000); // check every 1 hour

        return () => clearInterval(interval);
    }, []);

    const correctPin = "1234";

    const toggleTaken = (id) => {
        const today = new Date().toDateString();
        setPills(
            pills.map((p) =>
                p.id === id
                    ? {
                        ...p,
                        completedDates: p.completedDates?.includes(today)
                            ? p.completedDates.filter((d) => d !== today)
                            : [...(p.completedDates || []), today],
                    }
                    : p
            )
        );
    };

    const dayMap = { 0: "Zo", 1: "Ma", 2: "Di", 3: "Wo", 4: "Do", 5: "Vr", 6: "Za" };
    const todayIndex = new Date().getDay();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIndex = tomorrow.getDay();
    const todayName = dayMap[todayIndex];
    const tomorrowName = dayMap[tomorrowIndex];
    const weekDays = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];

    const today = new Date().toDateString();

    const todayPills = pills.filter(
        (p) => p.type === "scheduled" && p.days?.includes(todayName)
    );
    const todoPills = pills.filter((p) => p.type === "todo");
    const tomorrowPills = pills.filter(
        (p) => p.type === "scheduled" && p.days?.includes(tomorrowName)
    );
    const upcomingPills = pills.filter(
        (p) =>
            p.type === "scheduled" &&
            p.days?.some((day) => {
                const dayIndex = weekDays.indexOf(day);
                return dayIndex !== todayIndex && dayIndex !== tomorrowIndex;
            })
    );

    const deletePill = (id) => setPills(pills.filter((p) => p.id !== id));
    const confirmDelete = () => {
        if (pin === correctPin) {
            deletePill(selectedId);
            setPin("");
            setPinVisible(false);
        } else {
            alert("Wrong PIN");
        }
    };

    const completed = todayPills.filter((p) => p.completedDates?.includes(today)).length;
    const total = todayPills.length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    const size = 70;
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - circumference * (total === 0 ? 0 : completed / total);

    const normalizeCategory = (cat) => {
        if (!cat) return "Overig";
        const lower = cat.toLowerCase();
        if (lower === "voeding") return "Voeding";
        if (lower === "supplement") return "Supplementen";
        return "Overig";
    };

    const CATEGORIES = ["Voeding", "Overig", "Supplementen"];
    
    const groupByCategory = (list) => {
        return CATEGORIES.map((cat) => ({
            category: cat,
            items: list.filter((p) => normalizeCategory(p.category) === cat),
        })).filter((g) => g.items.length > 0);
    };

    const renderScheduledItem = (item, canToggle = true) => {
        const isTakenToday = canToggle && item.completedDates?.includes(today);
        return (
            <View
                key={item.id}
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "white",
                    padding: 15,
                    borderRadius: 16,
                    marginBottom: 5,
                    shadowColor: "#000",
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 3,
                    opacity: canToggle ? 1 : 0.6,
                }}
            >
                <View style={{
                    width: 12, height: 12, borderRadius: 6,
                    backgroundColor: isTakenToday ? "#4CAF50" : "#D0D0D0",
                    marginRight: 12,
                }} />
                <TouchableOpacity style={{ flex: 1 }} disabled={!canToggle} onPress={() => toggleTaken(item.id)}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: isTakenToday ? "#4CAF50" : "#111" }}>
                        {item.time} · {item.name}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderTodoItem = (item) => {
        const isTaken = item.completedDates?.includes(today);
        return (
            <View
                key={item.id}
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "white",
                    padding: 15,
                    borderRadius: 16,
                    marginBottom: 5,
                    shadowColor: "#000",
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 3,
                }}
            >
                <View style={{
                    width: 12, height: 12, borderRadius: 6,
                    backgroundColor: isTaken ? "#4CAF50" : "#D0D0D0",
                    marginRight: 12,
                }} />
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => toggleTaken(item.id)}>

                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>

                        {/* LEFT: name + time */}
                        <Text style={{ fontSize: 16, fontWeight: "600", color: isTaken ? "#4CAF50" : "#111" }}>
                        {item.name}
                        </Text>

                        {/* RIGHT: planning info */}
                        <Text style={{ fontSize: 12, color: "#888" }}>
                        {item.weekNumber
                            ? `Week: ${item.weekNumber}`
                            : item.monthNumber
                            ? `Maand: ${item.monthNumber}`
                            : item.dueDate
                            ? `Datum: ${item.dueDate}`
                            : ""}
                        </Text>

                    </View>

                    </TouchableOpacity>
            </View>
        );
    };

    const renderGroupedSection = (pillList, canToggle = true, showDays = false) => {
        const groups = groupByCategory(pillList);
        if (groups.length === 0) return null;
        return groups.map((group) => (
            <View key={group.category} style={{ marginBottom: 3 }}>
                <Text style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: "#888",
                    marginBottom: 4,
                    marginTop: 10,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                }}>
                    {group.category}
                </Text>
                {group.items.map((item) => (
                    <View key={item.id}>
                        {showDays && item.days?.length > 0 && (
                            <Text style={{ fontSize: 12, color: "#aaa", marginBottom: 1 }}>
                                Aankomend op: {item.days.join(", ")}
                            </Text>
                        )}
                        {renderScheduledItem(item, canToggle)}
                    </View>
                ))}
            </View>
        ));
    };

    return (
        <View style={{ flex: 1, padding: 10, paddingTop: 15, backgroundColor: "#fff"}}>
            {/* Header */}
            <View style={{
                flexDirection: "row", justifyContent: "space-between",
                alignItems: "center", marginBottom: 25, paddingHorizontal: 10,
            }}>
                <Text style={{ fontSize: 28, fontWeight: "bold" }}>Mijn Voeding</Text>
                <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
                    <Svg width={size} height={size}>
                        <Circle stroke="#D3D3D3" fill="none" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
                        <Circle
                            stroke="#4CAF50" fill="none" cx={size / 2} cy={size / 2} r={radius}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${circumference} ${circumference}`}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`}
                        />
                    </Svg>
                    <View style={{ position: "absolute", justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ fontWeight: "bold", fontSize: 16 }}>{percent}%</Text>
                    </View>
                </View>
            </View>

            <FlatList
                data={[]}
                ListHeaderComponent={
                    <>
                        {/* 1. VANDAAG */}
                        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 0 }}>Vandaag</Text>
                        {todayPills.length > 0
                            ? renderGroupedSection(
                                [...todayPills].sort((a, b) => {
                                    const toMinutes = (t) => {
                                        const [h, m] = (t || "00:00").split(":").map(Number);
                                        return h * 60 + m;
                                    };
                                    return toMinutes(a.time) - toMinutes(b.time);
                                }),
                                true
                            )
                            : <Text style={{ color: "gray", marginBottom: 20 }}>Geen supplementen of voeding vandaag.</Text>
                        }

                        {/* 2. TO DO */}
                        <Text style={{ fontSize: 20, fontWeight: "bold", marginTop: 20, marginBottom: 5 }}>To do</Text>
                        {todoPills.length > 0
                            ? todoPills.map((item) => renderTodoItem(item))
                            : <Text style={{ color: "gray", marginBottom: 20 }}>Geen taken.</Text>
                        }

                        {/* 3. AANKOMEND */}
                        <TouchableOpacity onPress={() => setShowUpcoming(!showUpcoming)} style={{ marginTop: 20, marginBottom: 10 }}>
                            <Text style={{ color: "#666", fontWeight: "600" }}>
                                Aankomend {showUpcoming ? "▴" : "▾"}
                            </Text>
                        </TouchableOpacity>

                        {showUpcoming && (
                            upcomingPills.length > 0
                                ? renderGroupedSection(upcomingPills, false, true)
                                : <Text style={{ color: "gray" }}>Geen aankomende items.</Text>
                        )}
                    </>
                }
                keyExtractor={() => "dummy"}
                contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 10 }}
            />

            <Modal visible={pinVisible} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}>
                    <View style={{ width: "85%", backgroundColor: "white", borderRadius: 20, padding: 20, elevation: 8 }}>
                        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 5 }}>Confirm Delete</Text>
                        <Text style={{ fontSize: 13, color: "#666", marginBottom: 15 }}>Enter your PIN to remove this item</Text>
                        <TextInput
                            value={pin} onChangeText={setPin} keyboardType="numeric" secureTextEntry
                            placeholder="••••" placeholderTextColor="#aaa"
                            style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 20, textAlign: "center", letterSpacing: 6 }}
                        />
                        <View style={{ flexDirection: "row" }}>
                            <TouchableOpacity onPress={() => { setPinVisible(false); setPin(""); }}
                                style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: "#eee", marginRight: 8, alignItems: "center" }}>
                                <Text style={{ fontWeight: "600", color: "#333" }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={confirmDelete}
                                style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: "#ff4d4d", marginLeft: 8, alignItems: "center" }}>
                                <Text style={{ fontWeight: "600", color: "white" }}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}