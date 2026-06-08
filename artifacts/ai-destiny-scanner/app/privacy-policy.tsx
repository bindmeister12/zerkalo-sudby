import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlowCard } from "@/components/GlowCard";
import {
  PRIVACY_POLICY_TEXT,
  PRIVACY_POLICY_TITLE,
  PRIVACY_POLICY_VERSION,
} from "@/constants/privacy";
import { useColors } from "@/hooks/useColors";

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 12, paddingBottom: botPad + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {PRIVACY_POLICY_TITLE}
          </Text>
          <View style={{ width: 32 }} />
        </View>
        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          Версия от {PRIVACY_POLICY_VERSION}
        </Text>
        <GlowCard glowColor={colors.neonPurple}>
          <Text style={[styles.body, { color: colors.foreground }]}>
            {PRIVACY_POLICY_TEXT}
          </Text>
        </GlowCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 12 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 18, fontFamily: "Inter_700Bold" },
  version: { fontSize: 12, textAlign: "center", marginBottom: 4 },
  body: { fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular" },
});
