import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";

import { auth } from "../firebaseConfig";

const COLORS = {
  background: "#F8F8F8",
  primary: "#4CAF50",
  text: "#222",
  gray: "#777",
  white: "#FFFFFF",
  border: "#E5E5E5",
};

export default function ProfielScreen({ navigation }) {
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container2}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={26}
            color={COLORS.text}
          />
        </TouchableOpacity>

        <Text style={styles.simpleEyebrow}>
          PROFILE
        </Text>

        <Text style={styles.simpleTitle}>
          Mijn profiel
        </Text>
      </View>


      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Ionicons
          name="person-circle"
          size={110}
          color={COLORS.primary}
        />
      </View>


      {/* User info */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Naam
        </Text>

        <Text style={styles.value}>
          {user?.displayName || "Gebruiker"}
        </Text>
      </View>


      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          E-mailadres
        </Text>

        <Text style={styles.value}>
          {user?.email || "Geen e-mailadres"}
        </Text>
      </View>


      {/* Settings */}
      <View style={styles.settingsCard}>

        <TouchableOpacity style={styles.settingRow}>
          <Ionicons
            name="mail-outline"
            size={22}
            color={COLORS.primary}
          />

          <Text style={styles.settingText}>
            E-mailadres
          </Text>
        </TouchableOpacity>


        <TouchableOpacity style={styles.settingRow}>
          <Ionicons
            name="lock-closed-outline"
            size={22}
            color={COLORS.primary}
          />

          <Text style={styles.settingText}>
            Wachtwoord wijzigen (later)
          </Text>
        </TouchableOpacity>


        <View style={styles.settingRow}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color={COLORS.primary}
          />

          <Text style={styles.settingText}>
            App versie 1.0.0
          </Text>
        </View>

      </View>


      {/* Logout */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleLogout}
      >
        <Ionicons
          name="log-out-outline"
          size={21}
          color="#FFF"
        />

        <Text style={styles.saveButtonText}>
          Log uit
        </Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },


  header: {
    marginTop: 20,
  },


  backButton: {
    marginBottom: 25,
  },


  simpleEyebrow: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "700",
    letterSpacing: 2,
  },


  simpleTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 5,
  },


  avatarContainer: {
    alignItems: "center",
    marginVertical: 25,
  },


  inputContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },


  label: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 6,
  },


  value: {
    fontSize: 17,
    color: COLORS.text,
    fontWeight: "600",
  },


  settingsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 18,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },


  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },


  settingText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 14,
  },


  saveButton: {
    marginTop: 35,
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },


  saveButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 10,
  },

});