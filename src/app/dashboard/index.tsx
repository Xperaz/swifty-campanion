import {
  getMe,
  IntraSearchResult,
  IntraUser,
  searchUsers,
} from "@/src/services/intra";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Home = () => {
  const [me, setMe] = useState<IntraUser | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<IntraSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const data = await getMe();
        setMe(data);
      } catch (e: any) {
        console.error("Failed to get me:", e?.message ?? e);
      }
    };
    run();
  }, []);

  // Debounce search input
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeText = useCallback((text: string) => {
    setQ(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!text.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const hits = await searchUsers(text.trim());
        setResults(hits);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    }, 350);
  }, []);

  const onPressUser = useCallback((login: string) => {
    router.push({ pathname: "/dashboard/details/[login]", params: { login } });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: IntraSearchResult }) => (
      <TouchableOpacity
        style={styles.item}
        onPress={() => onPressUser(item.login)}
      >
        <Image
          source={{ uri: item.cdn_uri }}
          style={styles.avatar}
          contentFit="cover"
        />
        <Text style={styles.login}>{item.login}</Text>
      </TouchableOpacity>
    ),
    [onPressUser]
  );

  const keyExtractor = useCallback((item: IntraSearchResult) => item.login, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome{me ? `, ${me.login}` : ""}</Text>
      <TextInput
        placeholder="Search 42 users…"
        value={q}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={results}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 8 }}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 52,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "#f3f4f6",
  },
  login: {
    fontSize: 16,
  },
  error: {
    color: "#ef4444",
    marginTop: 8,
  },
});
