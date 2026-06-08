import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WheelDatePicker, formatRussianDate } from "@/components/WheelDatePicker";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { useRequireAuth } from "@/hooks/useAuthGate";
import { useAds } from "@/services/ads";

const GENDERS = ["Мужской", "Женский", "Другой"];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { setUserProfile, destinyResult, currentUser, isHydrated, freeScansUsed } = useApp();
  const requireAuth = useRequireAuth();
  const ads = useAds();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState(""); // ISO YYYY-MM-DD
  const [birthTime, setBirthTime] = useState("");
  const [gender, setGender] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  // Soft-wall: first scan is free, repeat scans require auth.
  React.useEffect(() => {
    if (isHydrated && destinyResult && !currentUser) {
      requireAuth("/onboarding");
    }
  }, [isHydrated, destinyResult, currentUser, requireAuth]);

  if (isHydrated && destinyResult && !currentUser) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const isValid = name.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(birthDate);

  async function handleContinue() {
    if (!isValid) return;
    const proceed = () => {
      setUserProfile({
        name: name.trim(),
        birthDate,
        birthTime: birthTime || undefined,
        gender: gender || undefined,
      });
      router.push("/palm-capture");
    };

    if (freeScansUsed >= 1) {
      Alert.alert(
        "Получите повторный скан бесплатно",
        "Первый скан личности был бесплатным. Чтобы пройти ещё один, посмотрите короткий рекламный ролик.",
        [
          { text: "Отмена", style: "cancel" },
          {
            text: "Смотреть рекламу",
            onPress: async () => {
              const { rewarded } = await ads.showRewarded();
              if (rewarded) proceed();
            },
          },
        ],
      );
      return;
    }
    proceed();
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={["rgba(139, 92, 246, 0.12)", "transparent"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 20, paddingBottom: botPad + 30 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Расскажи о себе
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Чем точнее данные — тем точнее предсказание
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Имя *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: name ? colors.neonPurple + "60" : colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="Твоё имя"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Дата рождения *
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.dateBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: birthDate ? colors.neonPurple + "60" : colors.border,
                },
              ]}
              onPress={() => setPickerOpen(true)}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Inter_400Regular",
                  color: birthDate ? colors.foreground : colors.mutedForeground,
                }}
              >
                {birthDate ? formatRussianDate(birthDate) : "Выбери дату"}
              </Text>
              <Ionicons name="calendar" size={20} color={colors.neonPurple} />
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Время рождения{" "}
              <Text style={{ color: colors.mutedForeground }}>(необязательно)</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="ЧЧ:ММ"
              placeholderTextColor={colors.mutedForeground}
              value={birthTime}
              onChangeText={setBirthTime}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Пол{" "}
              <Text style={{ color: colors.mutedForeground }}>(необязательно)</Text>
            </Text>
            <View style={styles.genderRow}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderBtn,
                    {
                      backgroundColor:
                        gender === g ? colors.neonPurple : colors.card,
                      borderColor:
                        gender === g ? colors.neonPurple : colors.border,
                    },
                  ]}
                  onPress={() => setGender(gender === g ? "" : g)}
                >
                  <Text
                    style={[
                      styles.genderText,
                      { color: gender === g ? "#fff" : colors.foreground },
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.palmHint, { backgroundColor: colors.card, borderColor: colors.neonPurple + "30" }]}>
            <Ionicons name="hand-left" size={24} color={colors.neonPurple} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.palmHintTitle, { color: colors.foreground }]}>
                AI сканирует твою ладонь
              </Text>
              <Text style={[styles.palmHintText, { color: colors.mutedForeground }]}>
                Наш ИИ проанализирует линии судьбы автоматически
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.continueBtn, { opacity: isValid ? 1 : 0.4 }]}
          onPress={handleContinue}
          disabled={!isValid}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.neonPurple, "#6D28D9"]}
            style={styles.continueBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.continueBtnText}>Начать сканирование</Text>
            <Ionicons name="scan" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <WheelDatePicker
        visible={pickerOpen}
        initialDate={birthDate || "1995-01-01"}
        title="Дата рождения"
        onClose={() => setPickerOpen(false)}
        onConfirm={(iso) => {
          setBirthDate(iso);
          setPickerOpen(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  backBtn: { marginBottom: 24, alignSelf: "flex-start" },
  header: { marginBottom: 32, gap: 8 },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
  },
  form: { gap: 20, marginBottom: 32 },
  field: { gap: 8 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  input: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  genderRow: { flexDirection: "row", gap: 10 },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  genderText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  palmHint: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    alignItems: "center",
  },
  palmHintTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  palmHintText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  continueBtn: {
    borderRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
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
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
});
