import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
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
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { useRequireAuth } from "@/hooks/useAuthGate";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { userProfile, destinyResult, streak, resetAll, currentUser, signOut, isHydrated } = useApp();
  const requireAuth = useRequireAuth();

  useFocusEffect(
    useCallback(() => {
      if (isHydrated) requireAuth("/(tabs)/profile");
    }, [isHydrated, requireAuth]),
  );

  function handleSignOut() {
    Alert.alert("Выйти из аккаунта?", "Локальный профиль сохранится на устройстве.", [
      { text: "Отмена", style: "cancel" },
      { text: "Выйти", style: "destructive", onPress: () => { signOut(); router.replace("/auth"); } },
    ]);
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  function handleReset() {
    Alert.alert(
      "Сбросить данные",
      "Твой профиль и результаты будут удалены. Продолжить?",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Сбросить",
          style: "destructive",
          onPress: () => {
            resetAll();
            router.replace("/welcome");
          },
        },
      ],
    );
  }

  const menuItems = [
    { icon: "heart", label: "Совместимость с партнёром", action: () => router.push("/compatibility"), color: colors.neonPink },
    { icon: "scan", label: "Новое сканирование", action: () => router.push("/onboarding"), color: colors.neonPurple },
    { icon: "document-text", label: "Мой отчёт судьбы", action: () => router.push("/results"), color: colors.neonBlue },
    { icon: "person-circle", label: "Личные данные и согласия", action: () => router.push("/personal-data" as never), color: colors.neonBlue },
    { icon: "shield-checkmark", label: "Политика конфиденциальности", action: () => router.push("/privacy-policy" as never), color: colors.gold },
    { icon: "information-circle", label: "О приложении", action: () => router.push("/about"), color: colors.gold },
    { icon: "notifications", label: "Уведомления", action: () => {}, color: colors.foreground },
    { icon: "share", label: "Поделиться приложением", action: () => {}, color: colors.foreground },
    { icon: "help-circle", label: "Поддержка", action: () => {}, color: colors.foreground },
  ];

  const ZODIAC_EMOJIS: Record<string, string> = {
    "Овен": "♈", "Телец": "♉", "Близнецы": "♊", "Рак": "♋",
    "Лев": "♌", "Дева": "♍", "Весы": "♎", "Скорпион": "♏",
    "Стрелец": "♐", "Козерог": "♑", "Водолей": "♒", "Рыбы": "♓",
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: botPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Профиль</Text>

        <GlowCard style={styles.profileCard} glowColor={colors.neonPurple}>
          <View style={[styles.avatar, { backgroundColor: colors.neonPurple + "20", borderColor: colors.neonPurple }]}>
            <Ionicons name="person" size={32} color={colors.neonPurple} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.foreground }]} numberOfLines={1}>
              {userProfile?.name || currentUser?.displayName || "Неизвестный"}
            </Text>
            {currentUser && (
              <Text style={[styles.profileArchetype, { color: colors.mutedForeground }]} numberOfLines={1}>
                {currentUser.email ?? (currentUser.vkLinked ? "Вход через VK" : "")}
              </Text>
            )}
            {destinyResult && (
              <>
                <Text
                  style={[styles.profileArchetype, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {destinyResult.destinyArchetype}
                </Text>
                <View style={[
                  styles.zodiacChip,
                  { backgroundColor: colors.neonPurple + "20", borderColor: colors.neonPurple + "50" },
                ]}>
                  <Text style={styles.zodiacChipEmoji}>
                    {ZODIAC_EMOJIS[destinyResult.zodiacSign] || "✨"}
                  </Text>
                  <Text style={[styles.zodiacChipText, { color: colors.neonPurple }]}>
                    {destinyResult.zodiacSign}
                  </Text>
                </View>
              </>
            )}
          </View>
        </GlowCard>

        <View style={styles.statsRow}>
          <View style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="flame" size={20} color={colors.gold} />
            <Text style={[styles.statNum, { color: colors.foreground }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Серия дней</Text>
          </View>
          {destinyResult && (
            <>
              <View style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="star" size={20} color={colors.neonPurple} />
                <Text style={[styles.statNum, { color: colors.foreground }]}>
                  {destinyResult.destinyScore}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Индекс судьбы</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="infinite" size={20} color={colors.neonBlue} />
                <Text style={[styles.statNum, { color: colors.foreground }]}>
                  {destinyResult.lifePathNumber}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Число судьбы</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.menuItem,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={item.action}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBg, { backgroundColor: item.color + "15" }]}>
                <Ionicons name={item.icon as any} size={18} color={item.color} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        {currentUser && (
          <TouchableOpacity
            style={[styles.resetBtn, { borderColor: colors.border }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.foreground} />
            <Text style={[styles.resetText, { color: colors.foreground }]}>
              Выйти из аккаунта
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.resetBtn, { borderColor: colors.destructive + "40" }]}
          onPress={handleReset}
        >
          <Ionicons name="trash-outline" size={18} color={colors.destructive} />
          <Text style={[styles.resetText, { color: colors.destructive }]}>
            Сбросить профиль
          </Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          Зеркало Судьбы v1.0
        </Text>
        <Text style={[styles.version, { color: colors.mutedForeground, fontSize: 10, marginTop: 4 }]}>
          Развлекательный контент. Не является научным, медицинским или финансовым советом.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  title: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: { flex: 1, gap: 6 },
  profileName: { fontSize: 22, fontFamily: "Inter_700Bold" },
  profileArchetype: { fontSize: 13, fontFamily: "Inter_400Regular" },
  zodiacChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 2,
  },
  zodiacChipEmoji: { fontSize: 14 },
  zodiacChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 2,
  },
  premiumBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  statsRow: { flexDirection: "row", gap: 10 },
  statItem: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  statNum: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  menuSection: { gap: 8 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  resetText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  version: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 8 },
});
