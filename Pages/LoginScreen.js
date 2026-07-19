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
import { styles, COLORS } from "../styles";
import { SafeAreaView } from "react-native-safe-area-context";

// Importeer Firebase auth
import { auth } from "../firebaseConfig"; 
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingResetLink, setSendingResetLink] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Fout", "Vul alsjeblieft alle velden in.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Firebase handelt de state change af. Je navigator stuurt de gebruiker 
      // idealiter door naar het hoofdscherm zodra de auth-status verandert.
      Alert.alert("Succes", "Je bent ingelogd!");
    } catch (error) {
      let errorMessage = "Er is iets misgegaan bij het inloggen.";
      if (error.code === "auth/invalid-credential") {
        errorMessage = "Onjuist e-mailadres of wachtwoord.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Vul een geldig e-mailadres in.";
      }
      Alert.alert("Fout", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedEmail) {
      Alert.alert(
        "E-mailadres nodig",
        "Vul eerst je e-mailadres in om een wachtwoordlink te ontvangen."
      );
      return;
    }

    setSendingResetLink(true);
    try {
      auth.languageCode = "nl";
      await sendPasswordResetEmail(auth, cleanedEmail);
      Alert.alert(
        "Wachtwoordlink verstuurd",
        `Open de e-mail die we naar ${cleanedEmail} hebben gestuurd om een nieuw wachtwoord te kiezen.`
      );
    } catch (error) {
      let errorMessage = "De wachtwoordlink kon niet worden verstuurd.";

      if (error.code === "auth/invalid-email") {
        errorMessage = "Vul een geldig e-mailadres in.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Er zijn te veel verzoeken verstuurd. Probeer het later opnieuw.";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Controleer je internetverbinding en probeer het opnieuw.";
      }

      Alert.alert("Link niet verstuurd", errorMessage);
    } finally {
      setSendingResetLink(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container2}>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20, marginBottom: 20 }}
        >
          <Ionicons
            name="arrow-back"
            size={28}
            color={COLORS.text}
          />
        </TouchableOpacity>

        <View style={{ marginTop: 20 }}>
          <Text style={styles.simpleEyebrow}>
            WELCOME BACK
          </Text>

          <Text style={styles.simpleTitle}>
            Sign in
          </Text>

          <Text style={styles.summaryText}>
            Sign in to access your shopping lists.
          </Text>
        </View>

        <View style={{ marginTop: 40 }}>

          <View style={styles.inputContainer}>
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
            style={{ alignSelf: "flex-end", marginTop: 12 }}
            onPress={handleForgotPassword}
            disabled={loading || sendingResetLink}
            activeOpacity={0.75}
          >
            {sendingResetLink ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text
                style={{
                  color: COLORS.primary,
                  fontWeight: "700",
                  fontSize: 14,
                }}
              >
                Wachtwoord vergeten?
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, { marginTop: 28 }]}
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={loading || sendingResetLink}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons
                  name="log-in-outline"
                  size={21}
                  color="#FFF"
                />
                <Text style={styles.saveButtonText}>
                  Sign In
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              alignSelf: "center",
              marginTop: 24,
            }}
            onPress={() => navigation.navigate("CreateAccount")}
          >
            <Text
              style={{
                color: COLORS.primary,
                fontWeight: "700",
                fontSize: 15,
              }}
            >
              Create Account
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
}
