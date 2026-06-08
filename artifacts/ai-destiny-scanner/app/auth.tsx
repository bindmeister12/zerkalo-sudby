import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
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
import {
  authLogin,
  authRegister,
  authUpdateMe,
  authVkConfig,
  authVkExchange,
  type PublicUser,
} from "@workspace/api-client-react";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type Mode = "login" | "register";

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { setAuth, setCurrentUser, userProfile } = useApp();

  async function attachLocalProfile(user: PublicUser) {
    if (!userProfile) return user;
    const needs =
      (!user.displayName && userProfile.name) ||
      (!user.birthDate && userProfile.birthDate) ||
      (!user.birthTime && userProfile.birthTime) ||
      (!user.gender && userProfile.gender);
    if (!needs) return user;
    try {
      const updated = await authUpdateMe({
        displayName: user.displayName ?? userProfile.name,
        birthDate: user.birthDate ?? userProfile.birthDate ?? null,
        birthTime: user.birthTime ?? userProfile.birthTime ?? null,
        gender: user.gender ?? userProfile.gender ?? null,
      });
      setCurrentUser(updated.user);
      return updated.user;
    } catch {
      return user;
    }
  }
  const params = useLocalSearchParams<{ redirect?: string }>();
  const redirectTo = typeof params.redirect === "string" ? params.redirect : null;

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [vkLoading, setVkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 24 : insets.top + 8;
  const botPad = Platform.OS === "web" ? 24 : insets.bottom + 16;

  function goBack() {
    if (redirectTo) router.replace("/(tabs)");
    else if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  }

  function afterAuth() {
    if (redirectTo) router.replace(redirectTo as never);
    else router.replace("/(tabs)");
  }

  async function handleSubmit() {
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) {
      setError("Введите email и пароль.");
      return;
    }
    if (mode === "register") {
      if (password.length < 8) {
        setError("Пароль должен содержать минимум 8 символов.");
        return;
      }
      if (password !== password2) {
        setError("Пароли не совпадают.");
        return;
      }
    }
    setLoading(true);
    try {
      const result =
        mode === "login"
          ? await authLogin({ email: email.trim(), password })
          : await authRegister({
              email: email.trim(),
              password,
              displayName: displayName.trim() || undefined,
            });
      setAuth(result.token, result.user);
      await attachLocalProfile(result.user);
      if (mode === "register" && result.mailerWarning) {
        setInfo(result.mailerWarning);
        setTimeout(afterAuth, 1500);
      } else {
        afterAuth();
      }
    } catch (e: unknown) {
      setError(extractError(e, mode === "login" ? "Не удалось войти." : "Не удалось зарегистрироваться."));
    } finally {
      setLoading(false);
    }
  }

  async function handleVk() {
    setError(null);
    setInfo(null);
    setVkLoading(true);
    try {
      const cfg = await authVkConfig();
      if (!cfg.configured || !cfg.authUrl || !cfg.redirectUri || !cfg.state) {
        setError(cfg.error || "Вход через VK временно недоступен.");
        return;
      }
      const result = await WebBrowser.openAuthSessionAsync(cfg.authUrl, cfg.redirectUri);
      if (result.type !== "success" || !result.url) {
        return;
      }
      const parsed = Linking.parse(result.url);
      const code = (parsed.queryParams?.code as string | undefined) || null;
      if (!code) {
        setError("VK не вернул код авторизации.");
        return;
      }
      const session = await authVkExchange({ code, redirectUri: cfg.redirectUri, state: cfg.state });
      setAuth(session.token, session.user);
      await attachLocalProfile(session.user);
      afterAuth();
    } catch (e: unknown) {
      setError(extractError(e, "Не удалось войти через VK."));
    } finally {
      setVkLoading(false);
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
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topPad, paddingBottom: botPad },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.foreground }]}>Аккаунт</Text>
            <View style={{ width: 24 }} />
          </View>

          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Войдите, чтобы сохранять историю и видеть свою судьбу на всех устройствах.
          </Text>

          <View style={[styles.tabs, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.tab, mode === "login" && { backgroundColor: colors.neonPurple }]}
              onPress={() => setMode("login")}
            >
              <Text style={[styles.tabText, { color: mode === "login" ? "#fff" : colors.foreground }]}>
                Вход
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === "register" && { backgroundColor: colors.neonPurple }]}
              onPress={() => setMode("register")}
            >
              <Text style={[styles.tabText, { color: mode === "register" ? "#fff" : colors.foreground }]}>
                Регистрация
              </Text>
            </TouchableOpacity>
          </View>

          {mode === "register" && (
            <Field
              label="Имя (необязательно)"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Как к вам обращаться"
              colors={colors}
            />
          )}
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
            label="Пароль"
            value={password}
            onChangeText={setPassword}
            placeholder="Минимум 8 символов"
            secureTextEntry
            colors={colors}
          />
          {mode === "register" && (
            <Field
              label="Повторите пароль"
              value={password2}
              onChangeText={setPassword2}
              placeholder="Тот же пароль"
              secureTextEntry
              colors={colors}
            />
          )}

          {error && (
            <Text style={[styles.error, { color: "#ff6b6b" }]}>{error}</Text>
          )}
          {info && (
            <Text style={[styles.info, { color: colors.gold }]}>{info}</Text>
          )}

          <TouchableOpacity
            style={[styles.cta, { shadowColor: colors.neonPurple, opacity: loading ? 0.6 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={[colors.neonPurple, "#6D28D9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ctaText}>
                  {mode === "login" ? "Войти" : "Создать аккаунт"}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {mode === "login" && (
            <TouchableOpacity onPress={() => router.push("/forgot-password")} style={{ alignSelf: "center" }}>
              <Text style={[styles.link, { color: colors.neonPurple }]}>Забыли пароль?</Text>
            </TouchableOpacity>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.orText, { color: colors.mutedForeground }]}>или</Text>

          <TouchableOpacity
            style={[styles.vkBtn, { backgroundColor: "#0077FF", opacity: vkLoading ? 0.6 : 1 }]}
            onPress={handleVk}
            disabled={vkLoading}
          >
            {vkLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="logo-vk" size={20} color="#fff" />
                <Text style={styles.vkText}>Войти через VK ID</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.fineprint, { color: colors.mutedForeground }]}>
            Продолжая, вы соглашаетесь с правилами и подтверждаете, что контент носит развлекательный характер.
          </Text>
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
  scroll: { paddingHorizontal: 20, gap: 14 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 4 },
  tabs: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
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
    marginTop: 6,
  },
  ctaGradient: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  link: { fontSize: 14, fontFamily: "Inter_500Medium", paddingVertical: 4 },
  divider: { height: 1, marginTop: 14 },
  orText: { textAlign: "center", marginTop: -10, marginBottom: -4, alignSelf: "center", paddingHorizontal: 10, fontSize: 12 },
  vkBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
  },
  vkText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  fineprint: { fontSize: 11, textAlign: "center", marginTop: 8, lineHeight: 16 },
  error: { fontSize: 14, fontFamily: "Inter_500Medium" },
  info: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
