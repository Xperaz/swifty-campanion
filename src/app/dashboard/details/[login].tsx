import UserProfile from "@/src/components/UserProfile";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

export default function UserDetails() {
  const { login } = useLocalSearchParams<{ login: string }>();
  return (
    <View style={styles.container}>
      {login ? <UserProfile mode="login" login={login} showBack /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});
