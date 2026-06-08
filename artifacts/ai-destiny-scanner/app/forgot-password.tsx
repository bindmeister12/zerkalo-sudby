import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { authForgotPassword, authResetPassword } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const [stage, setStage] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 24 : insets.top + 8;

  async function handleRequest() {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError("Введите email.");
      return;
    }
    setLoading(true);
    try {
      const res = await authForgotPassword({ email: email.trim() });
      if (!res.mailerConfigured) {
        setInfo("Email-провайдер ещё не настроен. Код временно нельзя получить по почте — обратитесь в поддержку.");
      } else {
        setInfo("Если такой email зарегистрирован, на него отправлен код восстановления. Введите его ниже.");
      }
      setStage("reset");
    } catch (e: unknown) {
      setError(extractError(e, "Не удалось отправить запрос."));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setError(null);
    setInfo(null);
    if (!token.trim() || password.length < 8) {
      setError("Введите код и новый пароль (минимум 8 символов).");
      return;
    }
    setLoading(true);
    try {
      await authResetPassword({ token: token.trim(), newPassword: password });
      setInfo("Пароль обновлён. Теперь войдите с новым паролем.");
      setTimeout(() => router.replace("/auth"), 800);
    } catch (e: unknown) {
      setError(extractError(e, "Не удалось сменить пароль."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(139, 92, 246, 0.18)", "transparent"]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topPad }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.foreground }]}>Восстановление</Text>
            <View style={{ width: 24 }} />
          </View>

          {stage === "request" ? (
            <>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Введите email, который использовали при регистрации.
              </Text>
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                colors={colors}
              />
              {error && <Text style={[styles.error, { color: "#ff6b6b" }]}>{error}</Text>}
              <CtaButton loading={loading} label="Получить код" onPress={handleRequest} colors={colors} />
            </>
          ) : (
            <>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Введите код из письма и новый пароль.
              </Text>
              <Field
                label="Код из письма"
                value={token}
                onChangeText={setToken}
                placeholder="Вставьте код"
                autoCapitalize="none"
                colors={colors}
              />
              <Field
                label="Новый пароль"
                value={password}
                onChangeText={setPassword}
                placeholder="Минимум 8 символов"
                secureTextEntry
                colors={colors}
              />
              {info && <Text style={[styles.info, { color: colors.gold }]}>{info}</Text>}
              {error && <Text style={[styles.error, { color: "#ff6b6b" }]}>{error}</Text>}
              <CtaButton loading={loading} label="Сменить пароль" onPress={handleReset} colors={colors} />
              <TouchableOpacity onPress={() => setStage("request")} style={{ alignSelf: "center" }}>
                <Text style={[styles.link, { color: colors.neonPurple }]}>Отправить код снова</Text>
              </TouchableOpacity>
            </>
          )}
          {info && stage === "request" && <Text style={[styles.info, { color: colors.gold }]}>{info}</Text>}
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
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
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
          { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
        ]}
      />
    </View>
  );
}

function CtaButton({
  loading,
  label,
  onPress,
  colors,
}: {
  loading: boolean;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      style={[styles.cta, { shadowColor: colors.neonPurple, opacity: loading ? 0.6 : 1 }]}
      onPress={onPress}
      disabled={loading}
    >
      <LinearGradient
        colors={[colors.neonPurple, "#6D28D9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.ctaGradient}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{label}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );
}

function extractError(e: unknown, fallback: string): string {
  if (e && typeof e === "object" && "data" in e) {
    const data = (e as { data?: { error?: string } }).data;
    if (data && typeof data.error === "string") return data.error;
  }
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 14, paddingBottom: 40 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
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
  cta: {
    borderRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
  ctaGradient: { paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  ctaText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  link: { fontSize: 14, fontFamily: "Inter_500Medium", paddingVertical: 4 },
  error: { fontSize: 14, fontFamily: "Inter_500Medium" },
  info: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
