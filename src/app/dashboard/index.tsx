import {
  getMe,
  IntraSearchResult,
  IntraUser,
  searchUsers,
} from "@/src/services/intra";
import AntDesign from "@expo/vector-icons/AntDesign";
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

  const clearQuery = useCallback(() => {
    setQ("");
    setResults([]);
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
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

  const hasQuery = q.trim().length > 0;
  const showEmpty = hasQuery && !loading && !error && results.length === 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome{me ? `, ${me.login}` : ""}</Text>
      <Text style={styles.subtitle}>Search 42 users</Text>

      <View style={styles.inputWrap}>
        <AntDesign
          name="search"
          size={18}
          color="#6b7280"
          style={{ marginRight: 8 }}
        />
        <TextInput
          placeholder="Type a login, e.g. jdoe"
          value={q}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        {!!q && (
          <TouchableOpacity
            onPress={clearQuery}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AntDesign name="close" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {showEmpty && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No users found</Text>
          <Text style={styles.emptyText}>
            We couldn’t find matches for “{q.trim()}”.
          </Text>
        </View>
      )}

      {results.length > 0 && <Text style={styles.resultsHeader}>Results</Text>}
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
  subtitle: {
    color: "#6b7280",
    marginBottom: 12,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 6,
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
  empty: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyTitle: { fontWeight: "700", marginBottom: 4 },
  emptyText: { color: "#6b7280" },
  resultsHeader: {
    marginTop: 8,
    marginBottom: 4,
    fontWeight: "700",
    color: "#374151",
  },
});
