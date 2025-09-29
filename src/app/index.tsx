import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  exchangeCodeForToken,
  getAuthorizeUrl,
  getMe,
  getRedirectUri,
} from "../services/intra";
import { getToken } from "../utlis/storage";

// Optional: completes pending auth sessions on Android to avoid stuck browser
WebBrowser.maybeCompleteAuthSession();

export default function Index() {
  const [checking, setChecking] = useState(true);

  // If a valid session exists, skip the login screen
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        try {
          await getMe();
          if (!cancelled) router.replace("/dashboard");
          return;
        } catch {
          // Token might be expired/invalid; stay on login
          console.warn("Session check failed, staying on login.");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = async () => {
    const clientId = process.env.EXPO_PUBLIC_INTRA_CLIENT_UID as
      | string
      | undefined;
    const clientSecret = process.env.EXPO_PUBLIC_INTRA_CLIENT_SECRET as
      | string
      | undefined;
    if (!clientId || !clientSecret) {
      console.warn("Missing INTRA client env vars. Check .env.local");
      return;
    }

    // Compute a redirect URI that will deep-link back to the app
    const redirectUri = getRedirectUri();

    // Open the auth page in a browser and wait for redirect
    const authUrl = getAuthorizeUrl(clientId, redirectUri);

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
    console.log("Auth result:", result);
    if (result.type !== "success" || !result.url) return;

    // Parse the returned URL to extract the ?code
    const parsed = Linking.parse(result.url);
    const code = parsed.queryParams?.code as string | undefined;
    if (!code) return;

    try {
      const token = await exchangeCodeForToken(code, {
        clientId,
        clientSecret,
        redirectUri,
      });

      await AsyncStorage.setItem("intra_token", JSON.stringify(token));
      // await AsyncStorage.setItem("access_token", )

      // You can navigate now, or store in context
      router.replace("/dashboard");
    } catch (e) {
      console.warn("Token exchange failed", e);
    }
  };

  if (checking) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator />
          <Text style={[styles.helpText, { marginTop: 12 }]}>
            Checking session…
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroMark}>
          <Text style={styles.heroMarkText}>SC</Text>
        </View>
        <Text style={styles.title}>Swifty Companion</Text>
        <Text style={styles.subtitle}>
          Sign in with your 42 account to explore profiles, skills and projects.
        </Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
          <View style={styles.badge42}>
            <Text style={styles.badge42Text}>42</Text>
          </View>
          <Text style={styles.primaryBtnText}>Continue with 42</Text>
        </TouchableOpacity>

        <Text style={styles.helpText}>
          You’ll be redirected to 42 to authorize this app.
        </Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ using Expo</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 32,
  },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  heroMark: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: "#e5f0ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroMarkText: { fontSize: 28, fontWeight: "800", color: "#2563eb" },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 6, color: "#111827" },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  badge42: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  badge42Text: { fontWeight: "900", fontSize: 16, color: "#2563eb" },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  helpText: { color: "#6b7280", fontSize: 12, marginTop: 10 },
  footer: { alignItems: "center" },
  footerText: { color: "#9ca3af", fontSize: 12 },
});
