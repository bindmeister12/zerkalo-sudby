import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ParticleBackground } from "@/components/ParticleBackground";
import { useColors } from "@/hooks/useColors";

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const orbPulse = useRef(new Animated.Value(1)).current;
  const useNative = Platform.OS !== "web";

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulse, { toValue: 1.08, duration: 2500, useNativeDriver: useNative }),
        Animated.timing(orbPulse, { toValue: 1, duration: 2500, useNativeDriver: useNative }),
      ]),
    ).start();
  }, []);

  const topPad = Platform.OS === "web" ? 24 : insets.top;
  const botPad = Platform.OS === "web" ? 24 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ParticleBackground count={30} />

      <LinearGradient
        colors={["rgba(139, 92, 246, 0.18)", "transparent", "rgba(59, 130, 246, 0.12)"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={[styles.content, { paddingTop: topPad + 20, paddingBottom: botPad + 20 }]}>
        <Animated.View style={[styles.orbContainer, { transform: [{ scale: orbPulse }] }]}>
          <View style={[styles.outerRing, { borderColor: colors.neonPurple + "30" }]}>
            <View style={[styles.middleRing, { borderColor: colors.neonPurple + "50" }]}>
              <View
                style={[
                  styles.innerOrb,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.neonPurple,
                    shadowColor: colors.neonPurple,
                  },
                ]}
              >
                <Ionicons name="eye" size={48} color={colors.neonPurple} />
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={styles.textSection}>
          <Text style={[styles.appName, { color: colors.foreground }]}>Зеркало</Text>
          <Text style={[styles.appName, { color: colors.neonPurple }]}>Судьбы</Text>
        </View>

        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
          Твоя судьба закодирована{"\n"}в линиях ладони и звёздах
        </Text>

        <View style={styles.features}>
          {["Чтение ладони", "Нумерология", "Анализ ауры", "Предсказание судьбы"].map((f) => (
            <View
              key={f}
              style={[
                styles.featureChip,
                { backgroundColor: colors.card, borderColor: colors.neonPurple + "40" },
              ]}
            >
              <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={styles.btnContainer}>
          <TouchableOpacity
            style={[styles.ctaButton, { shadowColor: colors.neonPurple }]}
            onPress={() => router.push("/onboarding")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.neonPurple, "#6D28D9"]}
              style={styles.ctaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.ctaText}>Открыть мою судьбу</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
            Бесплатно · Без регистрации
          </Text>
          <Text style={[styles.disclaimer, { color: colors.mutedForeground, fontSize: 11, textAlign: "center", paddingHorizontal: 8 }]}>
            Развлекательный контент. Не является научным, медицинским, психологическим или финансовым советом.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 24,
    gap: 12,
  },
  orbContainer: { alignItems: "center", justifyContent: "center" },
  outerRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  middleRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  innerOrb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  textSection: { alignItems: "center" },
  appName: {
    fontSize: 42,
    fontFamily: "Inter_700Bold",
    lineHeight: 48,
    textAlign: "center",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 26,
  },
  features: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  featureChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  featureText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  btnContainer: { width: "100%", alignItems: "center", gap: 12 },
  ctaButton: {
    width: "100%",
    borderRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  ctaText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  disclaimer: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
