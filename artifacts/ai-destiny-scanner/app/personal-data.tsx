import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import {
  profileDeleteAccount,
  profileExport,
  profileGetPersonalData,
  profilePutPersonalData,
  type PersonalData,
} from "@workspace/api-client-react";
import { GlowCard } from "@/components/GlowCard";
import {
  CONSENT_CHECKBOX_TEXT,
  PRIVACY_POLICY_VERSION,
} from "@/constants/privacy";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { useRequireAuth } from "@/hooks/useAuthGate";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s\-()]{7,20}$/;

export default function PersonalDataScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { currentUser, isHydrated, signOut } = useApp();
  const requireAuth = useRequireAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<PersonalData | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [personalizationConsent, setPersonalizationConsent] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [needsPolicyGate, setNeedsPolicyGate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (isHydrated) requireAuth("/personal-data" as never);
    }, [isHydrated, requireAuth]),
  );

  useEffect(() => {
    if (!isHydrated || !currentUser) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await profileGetPersonalData();
        if (cancelled) return;
        setData(res.data);
        setEmail(res.data.email ?? currentUser.email ?? "");
        setPhone(res.data.phone ?? "");
        setCity(res.data.city ?? "");
        setMarketingConsent(res.data.marketingConsent);
        setPersonalizationConsent(res.data.personalizationConsent);
        // We have no client-side cache of consent records; gate first save
        // until we know whether the server has a current consent on file.
        // The PUT endpoint returns 409 when missing, which we handle below.
        setNeedsPolicyGate(!res.data.updatedAt);
      } catch {
        if (!cancelled) setError("Не удалось загрузить данные.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isHydrated, currentUser]);

  function validate(): string | null {
    if (email && !EMAIL_RE.test(email)) return "Введите корректный email.";
    if (phone && !PHONE_RE.test(phone)) {
      return "Телефон в международном формате, напр. +7 999 000-00-00.";
    }
    if (needsPolicyGate && !policyAccepted) {
      return "Поставьте галочку согласия на обработку данных.";
    }
    return null;
  }

  async function handleSave() {
    setError(null);
    setInfo(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSaving(true);
    try {
      const res = await profilePutPersonalData({
        email: email.trim() || null,
        phone: phone.trim() || null,
        city: city.trim() || null,
        marketingConsent,
        personalizationConsent,
        policyVersion: needsPolicyGate ? PRIVACY_POLICY_VERSION : undefined,
      });
      setData(res.data);
      setNeedsPolicyGate(false);
      setInfo("Сохранено.");
    } catch (e: unknown) {
      const data = (e as { data?: { error?: string; requiredPolicyVersion?: string } }).data;
      if (data?.requiredPolicyVersion) {
        setNeedsPolicyGate(true);
        setError("Сначала примите политику обработки персональных данных.");
      } else {
        setError(data?.error || "Не удалось сохранить.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    try {
      const res = await profileExport();
      const json = JSON.stringify(res, null, 2);
      if (Platform.OS === "web") {
        Alert.alert("Экспорт готов", "Скопируйте JSON из консоли.", [{ text: "OK" }]);
        // eslint-disable-next-line no-console
        console.log(json);
        return;
      }
      const dir = FileSystem.cacheDirectory;
      if (!dir) {
        Alert.alert("Экспорт", "Файловая система недоступна.");
        return;
      }
      const path = `${dir}zerkalo-sudby-export.json`;
      await FileSystem.writeAsStringAsync(path, json);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: "application/json" });
      } else {
        Alert.alert("Экспорт сохранён", path);
      }
    } catch {
      Alert.alert("Ошибка", "Не удалось выгрузить данные.");
    }
  }

  function handleDelete() {
    Alert.alert(
      "Удалить аккаунт?",
      "Все данные, согласия и история будут безвозвратно стёрты. Это действие нельзя отменить.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Продолжить",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Подтвердите окончательно",
              "Введя действие удаления, вы соглашаетесь с необратимым удалением.",
              [
                { text: "Назад", style: "cancel" },
                {
                  text: "Удалить навсегда",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await profileDeleteAccount({ confirm: "DELETE" });
                      signOut();
                      router.replace("/welcome");
                    } catch {
                      Alert.alert("Ошибка", "Не удалось удалить аккаунт.");
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!isHydrated || !currentUser) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topPad + 12, paddingBottom: botPad + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.foreground }]}>Личные данные</Text>
            <View style={{ width: 32 }} />
          </View>

          {loading ? (
            <ActivityIndicator color={colors.neonPurple} style={{ marginTop: 40 }} />
          ) : (
            <>
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                colors={colors}
              />
              <Field
                label="Телефон"
                value={phone}
                onChangeText={setPhone}
                placeholder="+7 999 000-00-00"
                keyboardType="phone-pad"
                colors={colors}
              />
              <Field
                label="Город"
                value={city}
                onChangeText={setCity}
                placeholder="Москва"
                colors={colors}
              />

              <CheckRow
                label="Согласен(-на) получать маркетинговые письма и спецпредложения"
                value={marketingConsent}
                onChange={setMarketingConsent}
                colors={colors}
              />
              <CheckRow
                label="Согласен(-на) на персонализированные предсказания и рекомендации"
                value={personalizationConsent}
                onChange={setPersonalizationConsent}
                colors={colors}
              />

              {needsPolicyGate && (
                <GlowCard glowColor={colors.gold} style={{ marginTop: 4 }}>
                  <Text style={[styles.consentTitle, { color: colors.foreground }]}>
                    Согласие на обработку персональных данных
                  </Text>
                  <Text style={[styles.consentBody, { color: colors.mutedForeground }]}>
                    Перед сохранением данных необходимо принять политику обработки персональных
                    данных (152-ФЗ).
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/privacy-policy" as never)}
                    style={{ marginTop: 6 }}
                  >
                    <Text style={[styles.link, { color: colors.neonPurple }]}>
                      Открыть политику конфиденциальности →
                    </Text>
                  </TouchableOpacity>
                  <CheckRow
                    label={CONSENT_CHECKBOX_TEXT}
                    value={policyAccepted}
                    onChange={setPolicyAccepted}
                    colors={colors}
                  />
                </GlowCard>
              )}

              {error && <Text style={[styles.error, { color: "#ff6b6b" }]}>{error}</Text>}
              {info && <Text style={[styles.info, { color: colors.gold }]}>{info}</Text>}

              <TouchableOpacity
                style={[
                  styles.cta,
                  {
                    backgroundColor: colors.neonPurple,
                    opacity: saving || (needsPolicyGate && !policyAccepted) ? 0.5 : 1,
                  },
                ]}
                onPress={handleSave}
                disabled={saving || (needsPolicyGate && !policyAccepted)}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.ctaText}>Сохранить</Text>
                )}
              </TouchableOpacity>

              <View style={{ height: 8 }} />

              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
                onPress={handleExport}
              >
                <Ionicons name="download-outline" size={18} color={colors.foreground} />
                <Text style={[styles.secondaryText, { color: colors.foreground }]}>
                  Скачать мои данные (JSON)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.destructive + "60" }]}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                <Text style={[styles.secondaryText, { color: colors.destructive }]}>
                  Удалить мой аккаунт и все данные
                </Text>
              </TouchableOpacity>

              <Text style={[styles.versionNote, { color: colors.mutedForeground }]}>
                Текущая версия политики: {data?.updatedAt ? PRIVACY_POLICY_VERSION : PRIVACY_POLICY_VERSION}
                {"  •  "}
                <Text
                  style={{ color: colors.neonPurple, textDecorationLine: "underline" }}
                  onPress={() => router.push("/privacy-policy" as never)}
                >
                  Открыть политику
                </Text>
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences";
  colors: ReturnType<typeof useColors>;
}
function Field({ label, colors, ...rest }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        {...rest}
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          {
            color: colors.foreground,
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      />
    </View>
  );
}

function CheckRow({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      style={styles.checkRow}
      onPress={() => onChange(!value)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.checkBox,
          {
            borderColor: value ? colors.neonPurple : colors.border,
            backgroundColor: value ? colors.neonPurple : "transparent",
          },
        ]}
      >
        {value && <Ionicons name="checkmark" size={16} color="#fff" />}
      </View>
      <Text style={[styles.checkLabel, { color: colors.foreground }]}>{label}</Text>
    </TouchableOpacity>
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
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 6 },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkLabel: { flex: 1, fontSize: 13, lineHeight: 18, fontFamily: "Inter_400Regular" },
  consentTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 6 },
  consentBody: { fontSize: 13, lineHeight: 18, fontFamily: "Inter_400Regular" },
  link: { fontSize: 13, fontFamily: "Inter_500Medium" },
  cta: { paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 8 },
  ctaText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  versionNote: { fontSize: 11, textAlign: "center", marginTop: 8 },
  error: { fontSize: 14, fontFamily: "Inter_500Medium" },
  info: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
