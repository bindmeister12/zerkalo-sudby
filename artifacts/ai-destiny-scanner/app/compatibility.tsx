import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DisclaimerBadge } from "@/components/DisclaimerBadge";
import { GlowCard } from "@/components/GlowCard";
import { WheelDatePicker, formatRussianDate } from "@/components/WheelDatePicker";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { useRequireAuth } from "@/hooks/useAuthGate";
import { useAds } from "@/services/ads";

const ZODIAC_EMOJIS: Record<string, string> = {
  "Овен": "♈", "Телец": "♉", "Близнецы": "♊", "Рак": "♋",
  "Лев": "♌", "Дева": "♍", "Весы": "♎", "Скорпион": "♏",
  "Стрелец": "♐", "Козерог": "♑", "Водолей": "♒", "Рыбы": "♓",
};

interface CompatibilityResult {
  score: number;
  partnerZodiacSign: string;
  summary: string;
  loveCompatibility: number;
  friendshipCompatibility: number;
  passionLevel: number;
  strengths: string[];
  challenges: string[];
  advice: string;
  sharedDestiny: string;
}

export default function CompatibilityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { userProfile, destinyResult, isHydrated, currentUser, freeCompatibilityUsed, incrementFreeCompatibility } = useApp();
  const requireAuth = useRequireAuth();
  const ads = useAds();

  const [partnerName, setPartnerName] = useState("");
  const [partnerBirthDate, setPartnerBirthDate] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompatibilityResult | null>(null);

  React.useEffect(() => {
    if (isHydrated) requireAuth("/compatibility");
  }, [isHydrated, requireAuth]);

  if (isHydrated && !currentUser) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function checkCompatibility() {
    if (!userProfile || !destinyResult) {
      Alert.alert("Сначала пройди сканирование", "Тебе нужен личный отчёт перед проверкой совместимости.");
      return;
    }
    if (!partnerName.trim()) {
      Alert.alert("Имя", "Введи имя партнёра.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(partnerBirthDate)) {
      Alert.alert("Дата", "Введи дату партнёра в формате ГГГГ-ММ-ДД.");
      return;
    }

    if (freeCompatibilityUsed >= 1) {
      const proceed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          "Получите повторную проверку бесплатно",
          "Первая проверка совместимости была бесплатной. Посмотрите короткую рекламу, чтобы продолжить.",
          [
            { text: "Отмена", style: "cancel", onPress: () => resolve(false) },
            { text: "Смотреть рекламу", onPress: () => resolve(true) },
          ],
          { cancelable: true, onDismiss: () => resolve(false) },
        );
      });
      if (!proceed) return;
      const { rewarded } = await ads.showRewarded();
      if (!rewarded) return;
    }

    setLoading(true);
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN || "localhost";
      const base = Platform.OS === "web" ? "/api" : `https://${domain}/api`;

      const response = await fetch(`${base}/destiny/compatibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: userProfile.name,
          userBirthDate: userProfile.birthDate,
          userZodiacSign: destinyResult.zodiacSign,
          partnerName: partnerName.trim(),
          partnerBirthDate,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        Alert.alert("Ошибка", err.error || "Не удалось проверить совместимость.");
        return;
      }

      const data = await response.json() as CompatibilityResult;
      setResult(data);
      incrementFreeCompatibility();
    } catch {
      Alert.alert("Ошибка", "Звёзды не отвечают. Попробуй позже.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setPartnerName("");
    setPartnerBirthDate("");
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: botPad + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Совместимость</Text>
          <View style={{ width: 32 }} />
        </View>

        {!result ? (
          <>
            <View style={styles.heroSection}>
              <View style={[styles.heartIcon, { backgroundColor: colors.neonPink + "20", borderColor: colors.neonPink }]}>
                <Ionicons name="heart" size={36} color={colors.neonPink} />
              </View>
              <Text style={[styles.heroTitle, { color: colors.foreground }]}>
                Узнай вашу совместимость
              </Text>
              <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
                AI проанализирует ваши знаки зодиака, числа судьбы и космическую совместимость
              </Text>
            </View>

            <DisclaimerBadge />

            <GlowCard style={styles.formCard} glowColor={colors.neonPink}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                Имя партнёра
              </Text>
              <TextInput
                value={partnerName}
                onChangeText={setPartnerName}
                placeholder="Например, Анна"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border },
                ]}
              />

              <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 14 }]}>
                Дата рождения партнёра
              </Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.dateBtn,
                  {
                    backgroundColor: colors.input,
                    borderColor: partnerBirthDate ? colors.neonPink + "60" : colors.border,
                  },
                ]}
                onPress={() => setPickerOpen(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: "Inter_400Regular",
                    color: partnerBirthDate ? colors.foreground : colors.mutedForeground,
                  }}
                >
                  {partnerBirthDate ? formatRussianDate(partnerBirthDate) : "Выбери дату"}
                </Text>
                <Ionicons name="calendar" size={20} color={colors.neonPink} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.neonPink }]}
                onPress={checkCompatibility}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colors.neonPink, colors.neonPurple]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#fff" />
                    <Text style={styles.submitText}>Проверить совместимость</Text>
                  </>
                )}
              </TouchableOpacity>
            </GlowCard>
          </>
        ) : (
          <>
            <GlowCard style={styles.scoreCard} glowColor={colors.neonPink} intensity="high">
              <LinearGradient
                colors={[colors.neonPink + "25", colors.neonPurple + "10", "transparent"]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={[styles.coupleNames, { color: colors.foreground }]}>
                {userProfile?.name} & {partnerName}
              </Text>
              <View style={styles.zodiacPair}>
                <Text style={styles.zodiacBig}>
                  {ZODIAC_EMOJIS[destinyResult?.zodiacSign || ""] || "✨"}
                </Text>
                <Ionicons name="heart" size={20} color={colors.neonPink} />
                <Text style={styles.zodiacBig}>
                  {ZODIAC_EMOJIS[result.partnerZodiacSign] || "✨"}
                </Text>
              </View>
              <Text style={[styles.zodiacLabel, { color: colors.mutedForeground }]}>
                {destinyResult?.zodiacSign} + {result.partnerZodiacSign}
              </Text>
              <Text style={[styles.bigScore, { color: colors.neonPink }]}>
                {result.score}%
              </Text>
              <Text style={[styles.scoreLabel, { color: colors.foreground }]}>
                Космическая совместимость
              </Text>
            </GlowCard>

            <GlowCard style={styles.metricsCard} glowColor={colors.neonPurple}>
              <MetricRow
                icon="heart"
                label="Любовь"
                value={result.loveCompatibility}
                color={colors.neonPink}
                colors={colors}
              />
              <MetricRow
                icon="people"
                label="Дружба"
                value={result.friendshipCompatibility}
                color={colors.neonBlue}
                colors={colors}
              />
              <MetricRow
                icon="flame"
                label="Страсть"
                value={result.passionLevel}
                color={colors.gold}
                colors={colors}
              />
            </GlowCard>

            <GlowCard glowColor={colors.neonPurple}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Звёзды говорят...
              </Text>
              <Text style={[styles.bodyText, { color: colors.foreground }]}>
                {result.summary}
              </Text>
            </GlowCard>

            <GlowCard glowColor={colors.gold}>
              <View style={styles.sectionHeader}>
                <Ionicons name="checkmark-circle" size={20} color={colors.gold} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Ваши сильные стороны
                </Text>
              </View>
              {(Array.isArray(result.strengths) ? result.strengths : []).map((s, i) => (
                <View key={i} style={styles.bullet}>
                  <Text style={[styles.bulletDot, { color: colors.gold }]}>✦</Text>
                  <Text style={[styles.bulletText, { color: colors.foreground }]}>{s}</Text>
                </View>
              ))}
            </GlowCard>

            <GlowCard glowColor={colors.neonBlue}>
              <View style={styles.sectionHeader}>
                <Ionicons name="alert-circle" size={20} color={colors.neonBlue} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Что важно понимать
                </Text>
              </View>
              {(Array.isArray(result.challenges) ? result.challenges : []).map((c, i) => (
                <View key={i} style={styles.bullet}>
                  <Text style={[styles.bulletDot, { color: colors.neonBlue }]}>◆</Text>
                  <Text style={[styles.bulletText, { color: colors.foreground }]}>{c}</Text>
                </View>
              ))}
            </GlowCard>

            <GlowCard glowColor={colors.neonPink}>
              <View style={styles.sectionHeader}>
                <Ionicons name="sparkles" size={20} color={colors.neonPink} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Совет Вселенной
                </Text>
              </View>
              <Text style={[styles.bodyText, { color: colors.foreground, fontStyle: "italic" }]}>
                {result.advice}
              </Text>
            </GlowCard>

            <GlowCard glowColor={colors.neonPurple} intensity="high">
              <View style={styles.sectionHeader}>
                <Ionicons name="infinite" size={20} color={colors.neonPurple} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Общая судьба
                </Text>
              </View>
              <Text style={[styles.bodyText, { color: colors.foreground }]}>
                {result.sharedDestiny}
              </Text>
            </GlowCard>

            <TouchableOpacity
              style={[styles.resetBtn, { borderColor: colors.neonPurple, backgroundColor: colors.card }]}
              onPress={reset}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={18} color={colors.neonPurple} />
              <Text style={[styles.resetBtnText, { color: colors.neonPurple }]}>
                Проверить другого
              </Text>
            </TouchableOpacity>

            <DisclaimerBadge />
          </>
        )}
      </ScrollView>

      <WheelDatePicker
        visible={pickerOpen}
        initialDate={partnerBirthDate || "1995-01-01"}
        title="Дата рождения партнёра"
        onClose={() => setPickerOpen(false)}
        onConfirm={(iso) => {
          setPartnerBirthDate(iso);
          setPickerOpen(false);
        }}
      />
    </View>
  );
}

function MetricRow({
  icon,
  label,
  value,
  color,
  colors,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.metricRow}>
      <View style={[styles.metricIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.metricLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={[styles.metricBarBg, { backgroundColor: colors.secondary }]}>
        <View style={[styles.metricBarFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}%</Text>
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
  heroSection: { alignItems: "center", gap: 12, marginTop: 8 },
  heartIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  heroSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, paddingHorizontal: 20 },
  formCard: { gap: 4 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 46,
  },
  submitBtn: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    overflow: "hidden",
  },
  submitText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  scoreCard: { alignItems: "center", gap: 8, paddingVertical: 24, overflow: "hidden" },
  coupleNames: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  zodiacPair: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 4 },
  zodiacBig: { fontSize: 40 },
  zodiacLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  bigScore: { fontSize: 60, fontFamily: "Inter_700Bold", letterSpacing: -2, marginTop: 4 },
  scoreLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  metricsCard: { gap: 14 },
  metricRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  metricIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", width: 70 },
  metricBarBg: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  metricBarFill: { height: "100%", borderRadius: 3 },
  metricValue: { fontSize: 13, fontFamily: "Inter_700Bold", width: 44, textAlign: "right" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  bodyText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  bullet: { flexDirection: "row", gap: 8, marginTop: 8 },
  bulletDot: { fontSize: 14, fontFamily: "Inter_700Bold", marginTop: 2 },
  bulletText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  resetBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
