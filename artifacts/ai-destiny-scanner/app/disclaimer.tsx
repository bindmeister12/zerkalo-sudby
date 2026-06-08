import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  APP_NAME,
  DISCLAIMER_CHECKBOX_TEXT,
  DISCLAIMER_FULL_TEXT,
} from "@/constants/disclaimer";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function DisclaimerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { setDisclaimerAccepted, hasCompletedOnboarding } = useApp();

  const [checked, setChecked] = useState(false);

  const topPad = Platform.OS === "web" ? 24 : insets.top;
  const botPad = Platform.OS === "web" ? 24 : insets.bottom;

  function handleAccept() {
    if (!checked) return;
    setDisclaimerAccepted(true);
    if (hasCompletedOnboarding) {
      router.replace("/(tabs)");
    } else {
      router.replace("/welcome");
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["rgba(139, 92, 246, 0.15)", "transparent"]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 24, paddingBottom: botPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.iconCircle, { borderColor: colors.neonPurple, backgroundColor: colors.card }]}>
          <Ionicons name="shield-checkmark" size={32} color={colors.neonPurple} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {APP_NAME}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Важная информация перед началом
        </Text>

        <View
          style={[
            styles.textBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.bodyText, { color: colors.foreground }]}>
            {DISCLAIMER_FULL_TEXT}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.checkboxRow,
            {
              backgroundColor: colors.card,
              borderColor: checked ? colors.neonPurple : colors.border,
            },
          ]}
          onPress={() => setChecked((v) => !v)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: checked ? colors.neonPurple : "transparent",
                borderColor: checked ? colors.neonPurple : colors.mutedForeground,
              },
            ]}
          >
            {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={[styles.checkboxText, { color: colors.foreground }]}>
            {DISCLAIMER_CHECKBOX_TEXT}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, { opacity: checked ? 1 : 0.4 }]}
          onPress={handleAccept}
          disabled={!checked}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.neonPurple, "#6D28D9"]}
            style={styles.btnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.btnText}>Принять и продолжить</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, gap: 16, alignItems: "center" },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 8,
  },
  textBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  bodyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  btn: {
    width: "100%",
    borderRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    marginTop: 4,
  },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
