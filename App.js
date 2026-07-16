import React, { useState, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Importeer Firebase auth en de onAuthStateChanged listener
import { auth } from "./firebaseConfig"; // Zorg dat het pad naar je config klopt!
import { onAuthStateChanged } from "firebase/auth";

import HomeScreen from "./Pages/HomeScreen";
import LoginScreen from "./Pages/LoginScreen";
import CreateAccountScreen from "./Pages/CreateAccount";

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Luister naar veranderingen in de inlogstatus van de gebruiker
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Schoon de listener op als de app sluit
    return unsubscribe;
  }, []);

  // Toon een laadschermpje terwijl Firebase controleert of de gebruiker is ingelogd
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4CAF50" /> 
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Ingelogd? Dan kan de gebruiker alleen bij het startscherm
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          // Niet ingelogd? Dan krijgt de gebruiker de inlog/registratie-schermen
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="CreateAccount"
              component={CreateAccountScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}