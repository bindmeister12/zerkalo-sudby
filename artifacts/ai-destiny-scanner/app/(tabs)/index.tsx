import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlowCard } from "@/components/GlowCard";
import { AuraOrb } from "@/components/AuraOrb";
import { DisclaimerBadge } from "@/components/DisclaimerBadge";
import { useApp, type DailyFortune } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const ZODIAC_EMOJIS: Record<string, string> = {
  "Овен": "♈", "Телец": "♉", "Близнецы": "♊", "Рак": "♋",
  "Лев": "♌", "Дева": "♍", "Весы": "♎", "Скорпион": "♏",
  "Стрелец": "♐", "Козерог": "♑", "Водолей": "♒", "Рыбы": "♓",
};

function InsightRow({
  icon,
  color,
  label,
  text,
  colors,
}: {
  icon: any;
  color: string;
  label: string;
  text: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.insightRow, { borderColor: color + "30" }]}>
      <View style={[styles.insightIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={styles.insightContent}>
        <Text style={[styles.insightLabel, { color }]}>{label}</Text>
        <Text style={[styles.insightText, { color: colors.foreground }]}>{text}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { userProfile, destinyResult, dailyFortune, setDailyFortune, streak, incrementStreak } = useApp();

  const [loadingFortune, setLoadingFortune] = useState(false);
  const [fortuneError, setFortuneError] = useState<string | null>(null);
  const fadeIn = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: Platform.OS !== "web" }).start();

    const today = new Date().toDateString();
    if (!dailyFortune || dailyFortune.date !== today) {
      fetchDailyFortune();
    }
  }, []);

  async function fetchDailyFortune() {
    if (!userProfile || !destinyResult) return;
    setLoadingFortune(true);
    setFortuneError(null);

    const domain = process.env.EXPO_PUBLIC_DOMAIN || "localhost";
    const base = Platform.OS === "web" ? "/api" : `https://${domain}/api`;

    try {
      const response = await fetch(`${base}/destiny/daily`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userProfile.name,
          zodiacSign: destinyResult.zodiacSign,
          auraType: destinyResult.auraType,
          lifePathNumber: destinyResult.lifePathNumber,
          destinyArchetype: destinyResult.destinyArchetype,
          birthDate: userProfile.birthDate,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json() as DailyFortune;
      setDailyFortune({ ...data, date: new Date().toDateString() });
      incrementStreak();
    } catch {
      setFortuneError("Звёзды молчат. Попробуй ещё раз.");
    } finally {
      setLoadingFortune(false);
    }
  }

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 6) return "Доброй ночи";
    if (h < 12) return "Доброе утро";
    if (h < 18) return "Добрый день";
    return "Добрый вечер";
  };

  if (!destinyResult || !userProfile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyState, { paddingTop: topPad + 40 }]}>
          <Ionicons name="eye-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Нет данных
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Сначала пройди сканирование судьбы
          </Text>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: colors.neonPurple }]}
            onPress={() => router.push("/welcome")}
          >
            <Text style={styles.emptyBtnText}>Начать</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const zodiacEmoji = ZODIAC_EMOJIS[destinyResult.zodiacSign] || "✨";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.ScrollView
        style={{ opacity: fadeIn }}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: botPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topHeader}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.userName, { color: colors.foreground }]}>
              {userProfile.name}
            </Text>
          </View>
          <View style={[styles.streakBadge, { backgroundColor: colors.card, borderColor: colors.gold + "40" }]}>
            <Ionicons name="flame" size={18} color={colors.gold} />
            <Text style={[styles.streakText, { color: colors.gold }]}>{streak}</Text>
          </View>
        </View>

        <View style={styles.identityRow}>
          <GlowCard style={styles.identityCard} glowColor={destinyResult.auraColor}>
            <AuraOrb color={destinyResult.auraColor} size={50} />
            <Text style={[styles.identityLabel, { color: colors.mutedForeground }]}>Аура</Text>
            <Text style={[styles.identityValue, { color: destinyResult.auraColor }]}>
              {destinyResult.auraType.split(" ")[0]}
            </Text>
          </GlowCard>

          <GlowCard style={styles.identityCard} glowColor={colors.neonPurple}>
            <Text style={styles.zodiacEmoji}>{zodiacEmoji}</Text>
            <Text style={[styles.identityLabel, { color: colors.mutedForeground }]}>Зодиак</Text>
            <Text style={[styles.identityValue, { color: colors.neonPurple }]}>
              {destinyResult.zodiacSign}
            </Text>
          </GlowCard>

          <GlowCard style={styles.identityCard} glowColor={colors.gold}>
            <Text style={[styles.scoreNum, { color: colors.gold }]}>
              {destinyResult.destinyScore}
            </Text>
            <Text style={[styles.identityLabel, { color: colors.mutedForeground }]}>Индекс</Text>
            <Text style={[styles.identityValue, { color: colors.gold }]}>Судьбы</Text>
          </GlowCard>
        </View>

        <GlowCard style={styles.fortuneCard} glowColor={colors.neonPurple} intensity="high">
          <View style={styles.fortuneHeader}>
            <View style={styles.fortuneTitleRow}>
              <Ionicons name="sunny" size={20} color={colors.gold} />
              <Text style={[styles.fortuneTitle, { color: colors.foreground }]}>
                Предсказание на сегодня
              </Text>
            </View>
          </View>

          {loadingFortune ? (
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Читаю звёзды...
            </Text>
          ) : dailyFortune ? (
            <View style={styles.fortuneContent}>
              <Text style={[styles.fortuneMessage, { color: colors.foreground }]}>
                {dailyFortune.message}
              </Text>

              <View style={styles.fortuneStats}>
                <View style={[styles.energyBar, { backgroundColor: colors.secondary }]}>
                  <View
                    style={[
                      styles.energyFill,
                      {
                        width: `${dailyFortune.energyLevel}%`,
                        backgroundColor: colors.neonPurple,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.energyLabel, { color: colors.mutedForeground }]}>
                  Энергия дня: {dailyFortune.energyLevel}%
                </Text>
              </View>

              <View style={styles.fortuneRow}>
                <View
                  style={[styles.fortuneChip, { backgroundColor: colors.secondary, borderColor: colors.neonPurple + "30" }]}
                >
                  <Ionicons name="color-palette" size={14} color={colors.neonPurple} />
                  <Text style={[styles.fortuneChipText, { color: colors.foreground }]}>
                    {dailyFortune.luckyColor}
                  </Text>
                </View>
                <View
                  style={[styles.fortuneChip, { backgroundColor: colors.secondary, borderColor: colors.destructive + "30" }]}
                >
                  <Ionicons name="warning" size={14} color={colors.destructive} />
                  <Text style={[styles.fortuneChipText, { color: colors.foreground }]}>
                    {dailyFortune.warningArea}
                  </Text>
                </View>
              </View>

              {dailyFortune.spiritAnimal && (
                <View style={[
                  styles.spiritAnimalBox,
                  { backgroundColor: colors.neonPink + "12", borderColor: colors.neonPink + "40" },
                ]}>
                  <Text style={styles.spiritAnimalEmoji}>
                    {dailyFortune.spiritAnimalEmoji}
                  </Text>
                  <View style={styles.spiritAnimalInfo}>
                    <Text style={[styles.spiritAnimalLabel, { color: colors.mutedForeground }]}>
                      Талисман дня
                    </Text>
                    <Text style={[styles.spiritAnimalName, { color: colors.neonPink }]}>
                      {dailyFortune.spiritAnimal}
                    </Text>
                  </View>
                  {!!dailyFortune.luckyNumber && (
                    <View style={[styles.luckyNumberBox, { borderColor: colors.gold + "60", backgroundColor: colors.gold + "15" }]}>
                      <Text style={[styles.luckyNumberLabel, { color: colors.mutedForeground }]}>Число</Text>
                      <Text style={[styles.luckyNumberValue, { color: colors.gold }]}>
                        {dailyFortune.luckyNumber}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {!!dailyFortune.loveInsight && (
                <InsightRow
                  icon="heart"
                  color={colors.neonPink}
                  label="Любовь"
                  text={dailyFortune.loveInsight}
                  colors={colors}
                />
              )}
              {!!dailyFortune.careerInsight && (
                <InsightRow
                  icon="briefcase"
                  color={colors.neonBlue}
                  label="Карьера и деньги"
                  text={dailyFortune.careerInsight}
                  colors={colors}
                />
              )}
              {!!dailyFortune.healthInsight && (
                <InsightRow
                  icon="leaf"
                  color={colors.gold}
                  label="Тело и энергия"
                  text={dailyFortune.healthInsight}
                  colors={colors}
                />
              )}

              {!!dailyFortune.bestTime && (
                <View style={[styles.bestTimeBox, { borderColor: colors.neonBlue + "50", backgroundColor: colors.neonBlue + "12" }]}>
                  <Ionicons name="time" size={18} color={colors.neonBlue} />
                  <Text style={[styles.bestTimeText, { color: colors.foreground }]}>
                    {dailyFortune.bestTime}
                  </Text>
                </View>
              )}

              {!!dailyFortune.cosmicTip && (
                <View style={[styles.cosmicTipBox, { borderColor: colors.neonPurple + "50", backgroundColor: colors.neonPurple + "12" }]}>
                  <View style={styles.cosmicTipHeader}>
                    <Ionicons name="moon" size={16} color={colors.neonPurple} />
                    <Text style={[styles.cosmicTipLabel, { color: colors.neonPurple }]}>
                      Космический ритуал
                    </Text>
                  </View>
                  <Text style={[styles.cosmicTipText, { color: colors.foreground }]}>
                    {dailyFortune.cosmicTip}
                  </Text>
                </View>
              )}

              <View style={[styles.affirmationBox, { backgroundColor: colors.neonPurple + "20", borderColor: colors.neonPurple + "50" }]}>
                <Text style={[styles.affirmationText, { color: colors.foreground }]}>
                  "{dailyFortune.affirmation}"
                </Text>
              </View>

              <DisclaimerBadge />
            </View>
          ) : (
            <View style={{ alignItems: "center", gap: 12, paddingVertical: 8 }}>
              <Text style={[styles.loadingText, { color: colors.mutedForeground, textAlign: "center" }]}>
                {fortuneError || "Готовим персональное предсказание..."}
              </Text>
              {fortuneError && (
                <TouchableOpacity
                  onPress={fetchDailyFortune}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: 10,
                    paddingHorizontal: 18,
                    borderRadius: 12,
                    backgroundColor: colors.neonPurple + "20",
                    borderWidth: 1,
                    borderColor: colors.neonPurple + "60",
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={16} color={colors.neonPurple} />
                  <Text style={{ color: colors.neonPurple, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                    Попробовать снова
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </GlowCard>

        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Быстрые действия
          </Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.neonPink + "40" }]}
              onPress={() => router.push("/compatibility")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.neonPink + "25", "transparent"]}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="heart" size={24} color={colors.neonPink} />
              <Text style={[styles.actionText, { color: colors.foreground }]}>
                Совместимость
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.neonPurple + "40" }]}
              onPress={() => router.push("/results")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.neonPurple + "25", "transparent"]}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="document-text" size={24} color={colors.neonPurple} />
              <Text style={[styles.actionText, { color: colors.foreground }]}>
                Мой отчёт
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.neonBlue + "40" }]}
              onPress={() => router.push("/onboarding")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.neonBlue + "25", "transparent"]}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="scan" size={24} color={colors.neonBlue} />
              <Text style={[styles.actionText, { color: colors.foreground }]}>
                Новый скан
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <GlowCard style={styles.archetypeCard} glowColor={colors.neonPurple}>
          <Text style={[styles.archetypeLabel, { color: colors.mutedForeground }]}>
            Твой архетип
          </Text>
          <Text style={[styles.archetypeValue, { color: colors.foreground }]}>
            {destinyResult.destinyArchetype}
          </Text>
          <Text style={[styles.archetypeDesc, { color: colors.mutedForeground }]}>
            {destinyResult.personalityProfile.slice(0, 120)}...
          </Text>
          <TouchableOpacity onPress={() => router.push("/results")}>
            <Text style={[styles.readMore, { color: colors.neonPurple }]}>
              Читать полностью
            </Text>
          </TouchableOpacity>
        </GlowCard>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  emptyBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  emptyBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular" },
  userName: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  streakText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  identityRow: { flexDirection: "row", gap: 10 },
  identityCard: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  zodiacEmoji: { fontSize: 36 },
  scoreNum: { fontSize: 28, fontFamily: "Inter_700Bold" },
  identityLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  identityValue: { fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "center" },
  fortuneCard: { gap: 14 },
  fortuneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fortuneTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  fortuneTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 12 },
  fortuneContent: { gap: 12 },
  fortuneMessage: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
  },
  fortuneStats: { gap: 6 },
  energyBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  energyFill: {
    height: "100%",
    borderRadius: 2,
  },
  energyLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  fortuneRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  fortuneChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  fortuneChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  affirmationBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  affirmationText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    fontStyle: "italic",
    lineHeight: 22,
    textAlign: "center",
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  quickActions: { gap: 12 },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionCard: {
    flexGrow: 1,
    flexBasis: "30%",
    minWidth: 100,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    overflow: "hidden",
  },
  spiritAnimalBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  spiritAnimalEmoji: { fontSize: 36 },
  spiritAnimalInfo: { flex: 1, gap: 2 },
  spiritAnimalLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  spiritAnimalName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  luckyNumberBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 56,
  },
  luckyNumberLabel: { fontSize: 9, fontFamily: "Inter_500Medium" },
  luckyNumberValue: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  insightRow: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  insightIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  insightContent: { flex: 1, gap: 2 },
  insightLabel: { fontSize: 11, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  insightText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  bestTimeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  bestTimeText: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  cosmicTipBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  cosmicTipHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  cosmicTipLabel: { fontSize: 11, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  cosmicTipText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, fontStyle: "italic" },
  actionText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  archetypeCard: { gap: 8 },
  archetypeLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  archetypeValue: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  archetypeDesc: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  readMore: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 4 },
});
