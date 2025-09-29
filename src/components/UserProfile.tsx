import { getMe, getUser, IntraUser } from "@/src/services/intra";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props =
  | { mode: "me"; showBack?: boolean }
  | { mode: "login"; login: string; showBack?: boolean };

export default function UserProfile(props: Props) {
  const [user, setUser] = useState<IntraUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const login = props.mode === "login" ? props.login : undefined;
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data =
          props.mode === "me" ? await getMe() : await getUser(login!);
        if (mounted) setUser(data);
      } catch (e: unknown) {
        if (mounted) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [props.mode, login]);

  const mainCursus = useMemo(() => {
    if (!user?.cursus_users?.length) return undefined;
    return [...(user.cursus_users ?? [])].sort(
      (a, b) => (b.level ?? 0) - (a.level ?? 0)
    )[0];
  }, [user]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading profile…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        {props.showBack && (
          <Text style={styles.link} onPress={() => router.back()}>
            Go back
          </Text>
        )}
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>User not found.</Text>
        {props.showBack && (
          <Text style={styles.link} onPress={() => router.back()}>
            Go back
          </Text>
        )}
      </View>
    );
  }

  const avatar = user.image?.versions?.large ?? user.image?.link ?? undefined;
  const details: [string, string | number | null | undefined][] = [
    ["Login", user.login],
    ["Email", user.email],
    ["Phone", user.phone ?? "hidden"],
    ["Location", user.location ?? "—"],
    ["Wallet", user.wallet],
    ["Correction pts", user.correction_point],
    ["Level", mainCursus?.level?.toFixed(2)],
  ];

  const skills = mainCursus?.skills ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
    >
      <View style={styles.header}>
        {avatar ? (
          <Image
            source={{ uri: avatar }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.display}>{user.displayname ?? user.login}</Text>
          <Text style={styles.subtle}>
            {user.first_name} {user.last_name}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Details</Text>
        {details.map(([k, v]) => (
          <View key={k} style={styles.row}>
            <Text style={styles.k}>{k}</Text>
            <Text style={styles.v}>{String(v ?? "—")}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Skills</Text>
        {skills.length === 0 ? (
          <Text style={styles.subtle}>No skills found.</Text>
        ) : (
          skills.flatMap((s): React.ReactElement[] => {
            if (!s?.name) return [] as React.ReactElement[];
            const pct = Math.max(0, Math.min(100, ((s.level ?? 0) * 100) / 21));
            return [
              <View key={s.name} style={{ marginBottom: 10 }}>
                <View style={styles.row}>
                  <Text style={styles.k}>{s.name}</Text>
                  <Text style={styles.v}>{(s.level ?? 0).toFixed(2)}</Text>
                </View>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${pct}%` }]} />
                </View>
              </View>,
            ];
          })
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Projects</Text>
        {(user.projects_users ?? []).filter((p) => p.status === "finished")
          .length === 0 ? (
          <Text style={styles.subtle}>No finished projects.</Text>
        ) : (
          (user.projects_users ?? []).flatMap((p): React.ReactElement[] => {
            if (p.status !== "finished") return [] as React.ReactElement[];
            return [
              <View key={p.id} style={styles.row}>
                <Text style={styles.k}>{p.project?.name ?? `#${p.id}`}</Text>
                <Text
                  style={[
                    styles.v,
                    { color: p["validated?"] ? "#16a34a" : "#ef4444" },
                  ]}
                >
                  {p["validated?"]
                    ? `Passed (${p.final_mark ?? 0})`
                    : `Failed (${p.final_mark ?? 0})`}
                </Text>
              </View>,
            ];
          })
        )}
      </View>

      {props.showBack && (
        <Text
          style={[styles.link, { marginBottom: 24 }]}
          onPress={() => router.back()}
        >
          Back
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 12,
    backgroundColor: "#f3f4f6",
  },
  avatarFallback: { backgroundColor: "#e5e7eb" },
  display: { fontSize: 20, fontWeight: "700" },
  subtle: { color: "#6b7280", marginTop: 2 },
  card: {
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  k: {
    color: "#6b7280",
    maxWidth: "70%",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  v: { fontWeight: "600" },
  progressBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  progressFill: { height: 8, backgroundColor: "#3b82f6" },
  link: { color: "#3b82f6", marginTop: 8 },
  errorTitle: { fontWeight: "700", fontSize: 16, marginBottom: 4 },
  errorText: { color: "#ef4444", textAlign: "center" },
});
