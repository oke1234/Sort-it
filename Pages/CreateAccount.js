import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles, COLORS } from "./styles";
import { SafeAreaView } from "react-native-safe-area-context";

// Importeer Firebase auth & extra tools om profiel te updaten
import { auth } from "./firebaseConfig";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

export default function CreateAccountScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      Alert.alert("Fout", "Vul alsjeblieft alle velden in.");
      return;
    }

    setLoading(true);
    try {
      // 1. Maak de gebruiker aan
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // 2. Update de display name met de ingevoerde naam
      await updateProfile(userCredential.user, {
        displayName: name.trim(),
      });

      Alert.alert("Succes", "Je account is aangemaakt!");
    } catch (error) {
      let errorMessage = "Er is iets misgegaan bij het registreren.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Dit e-mailadres is al in gebruik.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Vul een geldig e-mailadres in.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Het wachtwoord moet minimaal 6 tekens lang zijn.";
      }
      Alert.alert("Fout", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container2}>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20, marginBottom: 0 }}
        >
          <Ionicons
            name="arrow-back"
            size={28}
            color={COLORS.text}
          />
        </TouchableOpacity>

        <View style={{ marginTop: 20 }}>
          <Text style={styles.simpleEyebrow}>
            CREATE ACCOUNT
          </Text>

          <Text style={styles.simpleTitle}>
            Sign Up
          </Text>

          <Text style={styles.summaryText}>
            Create an account to save your shopping lists.
          </Text>
        </View>

        <View style={{ marginTop: 40 }}>

          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={20}
              color={COLORS.textSoft}
            />

            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#98A19B"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={[styles.inputContainer, { marginTop: 16 }]}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={COLORS.textSoft}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#98A19B"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={[styles.inputContainer, { marginTop: 16 }]}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={COLORS.textSoft}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#98A19B"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { marginTop: 28 }]}
            activeOpacity={0.8}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons
                  name="person-add-outline"
                  size={21}
                  color="#FFF"
                />
                <Text style={styles.saveButtonText}>
                  Create Account
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              alignSelf: "center",
              marginTop: 24,
            }}
            onPress={() => navigation.goBack()}
          >
            <Text
              style={{
                color: COLORS.primary,
                fontWeight: "700",
                fontSize: 15,
              }}
            >
              Already have an account? Sign In
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
}