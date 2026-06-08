import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuraOrb } from "@/components/AuraOrb";
import { DisclaimerBadge } from "@/components/DisclaimerBadge";
import { GlowCard } from "@/components/GlowCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const ZODIAC_EMOJIS: Record<string, string> = {
  "Овен": "♈", "Телец": "♉", "Близнецы": "♊", "Рак": "♋",
  "Лев": "♌", "Дева": "♍", "Весы": "♎", "Скорпион": "♏",
  "Стрелец": "♐", "Козерог": "♑", "Водолей": "♒", "Рыбы": "♓",
};

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { destinyResult, userProfile } = useApp();
  const fadeIn = useRef(new Animated.Value(0)).current;

  async function shareResult() {
    if (!destinyResult || !userProfile) return;
    const zodiacEmoji = ZODIAC_EMOJIS[destinyResult.zodiacSign] || "✨";
    const luckyNums = destinyResult.luckyNumbers.join(", ");
    const message =
      `🔮 Моя судьба раскрыта!\n\n` +
      `👤 Архетип: ${destinyResult.destinyArchetype}\n` +
      `⭐ Индекс судьбы: ${destinyResult.destinyScore}/100\n` +
      `${zodiacEmoji} Знак зодиака: ${destinyResult.zodiacSign}\n` +
      `💜 Аура: ${destinyResult.auraType}\n` +
      `🔢 Число судьбы: ${destinyResult.lifePathNumber}\n` +
      `🎯 Счастливые числа: ${luckyNums}\n\n` +
      `Узнай свою судьбу в приложении «Зеркало Судьбы» — AI анализ линий ладони!`;
    try {
      await Share.share({ message, title: "Зеркало Судьбы" });
    } catch {
      // ignore
    }
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== "web" }).start();
  }, []);

  if (!destinyResult || !userProfile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.foreground }]}>
          Данные не найдены
        </Text>
      </View>
    );
  }

  const zodiacEmoji = ZODIAC_EMOJIS[destinyResult.zodiacSign] || "✨";
  const scoreColor =
    destinyResult.destinyScore >= 90
      ? colors.gold
      : destinyResult.destinyScore >= 75
        ? colors.neonPurple
        : colors.neonBlue;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.ScrollView
        style={{ opacity: fadeIn }}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 20, paddingBottom: botPad + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[destinyResult.auraColor + "20", "transparent"]}
          style={styles.topGradient}
        />

        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Судьба {userProfile.name}
          </Text>
          <Text style={[styles.archetype, { color: colors.foreground }]}>
            {destinyResult.destinyArchetype}
          </Text>
        </View>

        <View style={styles.auraSection}>
          <AuraOrb color={destinyResult.auraColor} size={100} />
          <Text style={[styles.auraLabel, { color: destinyResult.auraColor }]}>
            {destinyResult.auraType}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <GlowCard style={styles.statCard} glowColor={scoreColor}>
            <Text style={[styles.statValue, { color: scoreColor }]}>
              {destinyResult.destinyScore}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Индекс судьбы
            </Text>
          </GlowCard>
          <GlowCard style={styles.statCard} glowColor={colors.neonPurple}>
            <Text style={[styles.statValue, { color: colors.neonPurple }]}>
              {zodiacEmoji} {destinyResult.zodiacSign}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Знак зодиака
            </Text>
          </GlowCard>
          <GlowCard style={styles.statCard} glowColor={colors.gold}>
            <Text style={[styles.statValue, { color: colors.gold }]}>
              {destinyResult.lifePathNumber}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Число судьбы
            </Text>
          </GlowCard>
        </View>

        <GlowCard style={styles.card} glowColor={colors.neonPurple}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={18} color={colors.neonPurple} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Профиль личности
            </Text>
          </View>
          <Text style={[styles.cardText, { color: colors.foreground }]}>
            {destinyResult.personalityProfile}
          </Text>
        </GlowCard>

        <GlowCard style={styles.card} glowColor={colors.neonBlue}>
          <View style={styles.cardHeader}>
            <Ionicons name="star" size={18} color={colors.neonBlue} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Сильные стороны
            </Text>
          </View>
          {destinyResult.strengths.map((s, i) => (
            <View key={i} style={styles.listItem}>
              <View style={[styles.bullet, { backgroundColor: colors.neonBlue }]} />
              <Text style={[styles.listText, { color: colors.foreground }]}>{s}</Text>
            </View>
          ))}
        </GlowCard>

        <GlowCard style={styles.card} glowColor={colors.gold}>
          <View style={styles.cardHeader}>
            <Ionicons name="heart" size={18} color={colors.gold} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Любовный код
            </Text>
          </View>
          <Text style={[styles.cardText, { color: colors.foreground }]}>
            {destinyResult.loveStyle}
          </Text>
        </GlowCard>

        <GlowCard style={styles.card} glowColor={colors.neonPurple}>
          <View style={styles.cardHeader}>
            <Ionicons name="flash" size={18} color={colors.neonPurple} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Скрытые таланты
            </Text>
          </View>
          <Text style={[styles.cardText, { color: colors.foreground }]}>
            {destinyResult.hiddenTalents}
          </Text>
        </GlowCard>

        <View style={styles.luckySection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Счастливые числа
          </Text>
          <View style={styles.luckyNumbers}>
            {destinyResult.luckyNumbers.map((n, i) => (
              <View
                key={i}
                style={[
                  styles.luckyNum,
                  { backgroundColor: colors.card, borderColor: colors.gold + "60" },
                ]}
              >
                <Text style={[styles.luckyNumText, { color: colors.gold }]}>{n}</Text>
              </View>
            ))}
          </View>
          <View style={styles.luckyDays}>
            {destinyResult.luckyDays.map((d, i) => (
              <View
                key={i}
                style={[
                  styles.luckyDay,
                  { backgroundColor: colors.card, borderColor: colors.neonPurple + "40" },
                ]}
              >
                <Ionicons name="calendar" size={14} color={colors.neonPurple} />
                <Text style={[styles.luckyDayText, { color: colors.foreground }]}>{d}</Text>
              </View>
            ))}
          </View>
        </View>

        <GlowCard style={styles.card} glowColor={colors.neonPurple}>
          <View style={styles.cardHeader}>
            <Ionicons name="trending-up" size={18} color={colors.neonPurple} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Предсказание будущего
            </Text>
          </View>
          <Text style={[styles.cardText, { color: colors.foreground }]}>
            {destinyResult.futurePrediction}
          </Text>
        </GlowCard>

        <GlowCard style={styles.card} glowColor={colors.gold}>
          <View style={styles.cardHeader}>
            <Ionicons name="cash" size={18} color={colors.gold} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Энергия денег
            </Text>
          </View>
          <Text style={[styles.cardText, { color: colors.foreground }]}>
            {destinyResult.moneyEnergy}
          </Text>
        </GlowCard>

        <GlowCard style={styles.card} glowColor="#EC4899">
          <View style={styles.cardHeader}>
            <Ionicons name="people" size={18} color="#EC4899" />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Родственная душа
            </Text>
          </View>
          <Text style={[styles.cardText, { color: colors.foreground }]}>
            {destinyResult.soulmateType}
          </Text>
        </GlowCard>

        {destinyResult.portraitImageBase64 && (
          <View style={styles.portraitSection}>
            <Text style={[styles.portraitHeading, { color: colors.foreground }]}>
              Твой мистический портрет
            </Text>
            <Text style={[styles.portraitSubtitle, { color: colors.mutedForeground }]}>
              Так видит тебя вселенная
            </Text>
            <View
              style={[
                styles.portraitFrame,
                {
                  borderColor: destinyResult.auraColor,
                  shadowColor: destinyResult.auraColor,
                },
              ]}
            >
              <Image
                source={{
                  uri: `data:image/png;base64,${destinyResult.portraitImageBase64}`,
                }}
                style={styles.portraitImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(10,0,16,0.85)"]}
                style={styles.portraitOverlay}
              />
              <View style={styles.portraitCaption}>
                <Text style={[styles.portraitArchetype, { color: "#fff" }]}>
                  {destinyResult.destinyArchetype}
                </Text>
                <Text style={[styles.portraitName, { color: destinyResult.auraColor }]}>
                  {userProfile.name}
                </Text>
              </View>
            </View>
          </View>
        )}

        <DisclaimerBadge />

        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: colors.card, borderColor: colors.neonPurple + "40" }]}
          onPress={shareResult}
          activeOpacity={0.8}
        >
          <Ionicons name="share-social" size={18} color={colors.neonPurple} />
          <Text style={[styles.shareBtnText, { color: colors.neonPurple }]}>Поделиться результатом</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.continueBtn, { shadowColor: colors.neonPurple }]}
          onPress={() => router.replace("/(tabs)")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.neonPurple, "#6D28D9"]}
            style={styles.continueBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.continueBtnText}>Перейти к ежедневным предсказаниям</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 14 },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  errorText: { textAlign: "center", marginTop: 100, fontSize: 16 },
  header: { alignItems: "center", gap: 4, marginBottom: 8 },
  greeting: { fontSize: 15, fontFamily: "Inter_500Medium" },
  archetype: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  auraSection: { alignItems: "center", gap: 8 },
  auraLabel: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, padding: 14, alignItems: "center", gap: 4 },
  statValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  card: { gap: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  cardText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    opacity: 0.9,
  },
  listItem: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  luckySection: { gap: 10 },
  luckyNumbers: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  luckyNum: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  luckyNumText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  luckyDays: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  luckyDay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  luckyDayText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  portraitSection: { alignItems: "center", gap: 6, marginTop: 12 },
  portraitHeading: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  portraitSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  portraitFrame: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 24,
    borderWidth: 2,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 12,
  },
  portraitImage: { width: "100%", height: "100%" },
  portraitOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "45%",
  },
  portraitCaption: {
    position: "absolute",
    bottom: 18,
    left: 18,
    right: 18,
    gap: 2,
  },
  portraitArchetype: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    opacity: 0.85,
  },
  portraitName: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    width: "100%",
  },
  shareBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  continueBtn: {
    borderRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    marginTop: 8,
  },
  continueBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  continueBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    flex: 1,
    textAlign: "center",
  },
});
