import UserProfile from "@/src/components/UserProfile";
import { clearToken } from "@/src/utlis/storage";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import { router } from "expo-router";
import React, { useCallback } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function MyProfileEntry() {
  const onLogout = useCallback(async () => {
    await clearToken();
    router.replace("/");
  }, []);

  return (
    <View style={styles.container}>
      <UserProfile
        mode="me"
        rightAccessory={
          <TouchableOpacity onPress={onLogout} style={styles.iconBtn}>
            <SimpleLineIcons name="logout" size={22} color="#ef4444" />
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  iconBtn: { padding: 6 },
});
