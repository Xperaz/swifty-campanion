import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  exchangeCodeForToken,
  getAuthorizeUrl,
  getRedirectUri,
} from "../services/intra";

// Optional: completes pending auth sessions on Android to avoid stuck browser
WebBrowser.maybeCompleteAuthSession();

export default function Index() {
  const handleLogin = async () => {
    const clientId = process.env.EXPO_PUBLIC_INTRA_CLIENT_UID as
      | string
      | undefined;
    const clientSecret = process.env.EXPO_PUBLIC_INTRA_CLIENT_SECRET as
      | string
      | undefined;
    console.log("Client ID:", clientId);
    console.log("Client Secret:", clientSecret);
    if (!clientId || !clientSecret) {
      console.warn("Missing INTRA client env vars. Check .env.local");
      return;
    }

    // Compute a redirect URI that will deep-link back to the app
    const redirectUri = getRedirectUri();
    console.log("Redirect URI:", redirectUri);

    // Open the auth page in a browser and wait for redirect
    const authUrl = getAuthorizeUrl(clientId, redirectUri);
    console.log("Auth URL:", authUrl);

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

  return (
    <View style={styles.container}>
      <View style={styles.loginContainer}>
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Image
            source={require("../../assets/icons/42.svg")}
            style={styles.logo}
          />
          <Text style={styles.loginText}>Login with 42</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00ebf3",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 20,
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  loginText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
