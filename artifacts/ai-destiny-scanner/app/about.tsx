import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
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
  APP_NAME,
  APP_VERSION,
  DISCLAIMER_FULL_TEXT,
} from "@/constants/disclaimer";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { setDisclaimerAccepted } = useApp();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  function handleReviewConsent() {
    Alert.alert(
      "Пересмотреть согласие",
      "Вы вернётесь к экрану согласия и сможете заново принять условия.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Продолжить",
          onPress: () => {
            setDisclaimerAccepted(false);
            router.replace("/disclaimer");
          },
        },
      ],
    );
  }

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
            О приложении
          </Text>
          <View style={{ width: 32 }} />
        </View>

        <GlowCard glowColor={colors.neonPurple} style={styles.appCard}>
          <View style={[styles.iconCircle, { borderColor: colors.neonPurple, backgroundColor: colors.card }]}>
            <Ionicons name="eye" size={28} color={colors.neonPurple} />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>
            {APP_NAME}
          </Text>
          <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
            Версия {APP_VERSION}
          </Text>
        </GlowCard>

        <GlowCard glowColor={colors.neonPurple}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={20} color={colors.neonPurple} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Юридическая информация
            </Text>
          </View>
          <Text style={[styles.bodyText, { color: colors.foreground }]}>
            {DISCLAIMER_FULL_TEXT}
          </Text>
        </GlowCard>

        <TouchableOpacity
          style={[styles.reviewBtn, { borderColor: colors.neonPurple, backgroundColor: colors.card }]}
          onPress={() => router.push("/privacy-policy" as never)}
          activeOpacity={0.8}
        >
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.neonPurple} />
          <Text style={[styles.reviewBtnText, { color: colors.neonPurple }]}>
            Политика конфиденциальности (152-ФЗ)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.reviewBtn, { borderColor: colors.neonPurple, backgroundColor: colors.card }]}
          onPress={handleReviewConsent}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh-circle-outline" size={20} color={colors.neonPurple} />
          <Text style={[styles.reviewBtnText, { color: colors.neonPurple }]}>
            Пересмотреть согласие с дисклеймером
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  appCard: { alignItems: "center", gap: 8, paddingVertical: 24 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  versionText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  bodyText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  reviewBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
