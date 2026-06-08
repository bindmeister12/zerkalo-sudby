import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface GlowCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glowColor?: string;
  intensity?: "low" | "medium" | "high";
}

export function GlowCard({
  children,
  style,
  glowColor,
  intensity = "medium",
}: GlowCardProps) {
  const colors = useColors();
  const glow = glowColor || colors.neonPurple;

  const shadowRadius = intensity === "low" ? 8 : intensity === "medium" ? 16 : 24;
  const shadowOpacity = intensity === "low" ? 0.2 : intensity === "medium" ? 0.35 : 0.5;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: glow + "40",
          shadowColor: glow,
          shadowRadius,
          shadowOpacity,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
});
