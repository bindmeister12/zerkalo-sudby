import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ParticleBackground } from "@/components/ParticleBackground";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import {
  PRODUCT_IDS,
  checkPurchaseAvailability,
  isRuStoreAvailable,
  purchaseSubscription,
  restorePurchases,
} from "@/services/ruStorePayments";

const BENEFITS = [
  { icon: "infinite", label: "Безлимитные сканы ладони" },
  { icon: "star", label: "Детальный анализ всех линий" },
  { icon: "calendar", label: "Ежедневные персональные прогнозы" },
  { icon: "heart", label: "Совместимость с партнёром" },
  { icon: "sparkles" as "star", label: "Мистический AI-портрет" },
  { icon: "shield-checkmark", label: "Без рекламы" },
] as const;

const PLANS = [
  {
    id: PRODUCT_IDS.MONTHLY,
    label: "Месяц",
    price: "199 ₽",
    per: "в месяц",
    badge: null as string | null,
    highlight: false,
  },
  {
    id: PRODUCT_IDS.ANNUAL,
    label: "Год",
    price: "990 ₽",
    per: "≈ 82 ₽ / мес",
    badge: "Выгода 59%",
    highlight: true,
  },
] as const;

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { setIsPremium, currentUser } = useApp();

  const [selectedPlan, setSelectedPlan] = useState<string>(PRODUCT_IDS.ANNUAL);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== "web" }),
      Animated.timing(cardSlide, { toValue: 0, duration: 700, delay: 200, useNativeDriver: Platform.OS !== "web" }),
    ]).start();
  }, []);

  async function handlePurchase() {
    if (Platform.OS !== "android") {
      Alert.alert("Только Android", "Подписка через RuStore доступна только на Android-устройствах.");
      return;
    }

    if (!isRuStoreAvailable()) {
      Alert.alert(
        "RuStore не найден",
        "Для оформления подписки установите приложение RuStore или используйте официальную версию из RuStore.",
        [{ text: "OK" }]
      );
      return;
    }

    setLoading(true);
    try {
      const avail = await checkPurchaseAvailability();
      if (!avail.available) {
        Alert.alert("Платежи недоступны", avail.reason ?? "Попробуйте позже.");
        return;
      }

      const result = await purchaseSubscription(
        selectedPlan,
        currentUser?.id?.toString(),
        currentUser?.email ?? undefined
      );

      if (result.type === "SUCCESS") {
        setIsPremium(true);
        Alert.alert("🎉 Премиум активирован!", "Добро пожаловать в Зеркало Судьбы Premium!", [
          { text: "Продолжить", onPress: () => router.back() },
        ]);
      } else if (result.type === "CANCELLED") {
        // Пользователь отменил — ничего не делаем
      } else if (result.type === "UNAVAILABLE") {
        Alert.alert("Недоступно", result.reason);
      } else {
        Alert.alert("Ошибка", result.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    if (Platform.OS !== "android") return;
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        setIsPremium(true);
        Alert.alert("✅ Готово", "Покупка восстановлена!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Покупок не найдено", "Активных подписок для этого аккаунта не найдено.");
      }
    } finally {
      setRestoring(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ParticleBackground count={20} />
      <LinearGradient
        colors={["rgba(139, 92, 246, 0.25)", "transparent", "rgba(59, 130, 246, 0.1)"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <TouchableOpacity
        style={[styles.closeBtn, { top: topPad + 8 }]}
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="close" size={24} color={colors.mutedForeground} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 52, paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: titleOpacity }]}>
          <Text style={styles.crown}>👑</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Зеркало Судьбы</Text>
          <LinearGradient
            colors={[colors.neonPurple, colors.gold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.premiumBadge}
          >
            <Text style={styles.premiumBadgeText}>PREMIUM</Text>
          </LinearGradient>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Раскрой полный потенциал своей судьбы
          </Text>
        </Animated.View>

        <Animated.View
          style={[styles.benefitsCard, { backgroundColor: colors.card, borderColor: colors.neonPurple + "30", transform: [{ translateY: cardSlide }], opacity: titleOpacity }]}
        >
          {BENEFITS.map((b) => (
            <View key={b.label} style={styles.benefitRow}>
              <View style={[styles.benefitIcon, { backgroundColor: colors.neonPurple + "20" }]}>
                <Ionicons name={b.icon as "infinite"} size={16} color={colors.neonPurple} />
              </View>
              <Text style={[styles.benefitText, { color: colors.foreground }]}>{b.label}</Text>
            </View>
          ))}
        </Animated.View>

        <View style={styles.plansRow}>
          {PLANS.map((plan) => {
            const selected = selectedPlan === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: selected ? colors.neonPurple + "18" : colors.card,
                    borderColor: selected ? colors.neonPurple : colors.mutedForeground + "30",
                  },
                ]}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.8}
              >
                {plan.badge && (
                  <LinearGradient
                    colors={[colors.gold, "#F59E0B"]}
                    style={styles.planBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.planBadgeText}>{plan.badge}</Text>
                  </LinearGradient>
                )}
                <View style={[styles.planRadio, { borderColor: selected ? colors.neonPurple : colors.mutedForeground + "50" }]}>
                  {selected && <View style={[styles.planRadioInner, { backgroundColor: colors.neonPurple }]} />}
                </View>
                <Text style={[styles.planLabel, { color: colors.mutedForeground }]}>{plan.label}</Text>
                <Text style={[styles.planPrice, { color: colors.foreground }]}>{plan.price}</Text>
                <Text style={[styles.planPer, { color: colors.mutedForeground }]}>{plan.per}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.purchaseBtn, { shadowColor: colors.neonPurple, opacity: loading ? 0.7 : 1 }]}
          onPress={handlePurchase}
          activeOpacity={0.85}
          disabled={loading}
        >
          <LinearGradient
            colors={[colors.neonPurple, "#6D28D9"]}
            style={styles.purchaseBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="logo-android" size={20} color="#fff" />
                <Text style={styles.purchaseBtnText}>Оформить через RuStore</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {Platform.OS === "android" && (
          <TouchableOpacity
            style={styles.restoreBtn}
            onPress={handleRestore}
            disabled={restoring}
          >
            {restoring ? (
              <ActivityIndicator color={colors.mutedForeground} size="small" />
            ) : (
              <Text style={[styles.restoreText, { color: colors.mutedForeground }]}>
                Восстановить покупку
              </Text>
            )}
          </TouchableOpacity>
        )}

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Подписка автоматически продлевается через RuStore. Отмените в любое время в настройках RuStore.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, alignItems: "center", gap: 20 },
  closeBtn: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  header: { alignItems: "center", gap: 8 },
  crown: { fontSize: 48 },
  title: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  premiumBadge: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
  },
  premiumBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 4,
  },
  benefitsCard: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  benefitIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  plansRow: { flexDirection: "row", gap: 12, width: "100%" },
  planCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    alignItems: "center",
    gap: 6,
    position: "relative",
    minHeight: 130,
    justifyContent: "center",
  },
  planBadge: {
    position: "absolute",
    top: -12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  planBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#000",
  },
  planRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  planRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  planLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  planPrice: { fontSize: 22, fontFamily: "Inter_700Bold" },
  planPer: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  purchaseBtn: {
    width: "100%",
    borderRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  purchaseBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
  },
  purchaseBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  restoreBtn: {
    paddingVertical: 8,
  },
  restoreText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textDecorationLine: "underline",
  },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 12,
  },
});
