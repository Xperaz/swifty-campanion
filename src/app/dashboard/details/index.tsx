import { getMe } from "@/src/services/intra";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function DetailsIndex() {
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const me = await getMe();
        if (!cancelled) {
          router.replace({
            pathname: "/dashboard/details/[login]",
            params: { login: me.login },
          });
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.center}>
      {!error ? (
        <>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Opening details…</Text>
        </>
      ) : (
        <>
          <Text style={{ fontWeight: "700", marginBottom: 4 }}>Error</Text>
          <Text style={{ color: "#ef4444", textAlign: "center" }}>{error}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
});
