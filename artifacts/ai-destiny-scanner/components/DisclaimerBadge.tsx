import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  style?: ViewStyle;
  compact?: boolean;
}

export function DisclaimerBadge({ style, compact }: Props) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Ionicons
        name="information-circle-outline"
        size={compact ? 12 : 14}
        color={colors.mutedForeground}
      />
      <Text
        style={[
          styles.text,
          {
            color: colors.mutedForeground,
            fontSize: compact ? 10 : 11,
          },
        ]}
      >
        Развлекательный контент. Не является научным/медицинским советом.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  text: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
});
