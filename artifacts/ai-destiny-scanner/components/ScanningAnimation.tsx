import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const SCAN_SIZE = width * 0.75;

const MESSAGES = [
  "Считываю линии судьбы...",
  "Анализирую энергетические потоки...",
  "Определяю тип личности...",
  "Вычисляю совместимость душ...",
  "Раскрываю скрытые таланты...",
  "Читаю знаки вселенной...",
  "Сканирую ауру...",
  "Составляю карту судьбы...",
];

interface ScanningAnimationProps {
  progress: number;
  messageIndex: number;
}

export function ScanningAnimation({ progress, messageIndex }: ScanningAnimationProps) {
  const colors = useColors();
  const scanLine = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(scanLine, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: Platform.OS !== "web",
      }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    ).start();
  }, []);

  const scanTranslate = scanLine.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_SIZE],
  });

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.scanFrame, { transform: [{ scale: pulse }] }]}
      >
        <View
          style={[
            styles.scanBorder,
            {
              width: SCAN_SIZE,
              height: SCAN_SIZE,
              borderColor: colors.neonPurple,
              shadowColor: colors.neonPurple,
            },
          ]}
        >
          <View style={[styles.corner, styles.topLeft, { borderColor: colors.neonPurple }]} />
          <View style={[styles.corner, styles.topRight, { borderColor: colors.neonPurple }]} />
          <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.neonPurple }]} />
          <View style={[styles.corner, styles.bottomRight, { borderColor: colors.neonPurple }]} />

          <Animated.View
            style={[
              styles.scanLine,
              {
                backgroundColor: colors.neonPurple,
                shadowColor: colors.neonPurple,
                transform: [{ translateY: scanTranslate }],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.circle,
              {
                borderColor: colors.neonBlue,
                shadowColor: colors.neonBlue,
                transform: [{ rotate }],
              },
            ]}
          />

          <View style={[styles.palmIcon]}>
            <Text style={styles.palmEmoji}>✋</Text>
          </View>
        </View>
      </Animated.View>

      <View style={[styles.progressContainer]}>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: colors.secondary },
          ]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.neonPurple,
                width: `${progress}%`,
                shadowColor: colors.neonPurple,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.neonPurple }]}>
          {Math.round(progress)}%
        </Text>
      </View>

      <Text style={[styles.message, { color: colors.foreground }]}>
        {MESSAGES[messageIndex % MESSAGES.length]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 24,
  },
  scanFrame: {
    alignItems: "center",
    justifyContent: "center",
  },
  scanBorder: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderWidth: 3,
  },
  topLeft: { top: -1, left: -1, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: -1, right: -1, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: -1, left: -1, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: -1, right: -1, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  circle: {
    position: "absolute",
    width: SCAN_SIZE * 0.7,
    height: SCAN_SIZE * 0.7,
    borderRadius: SCAN_SIZE * 0.35,
    borderWidth: 1,
    borderStyle: "dashed",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  palmIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  palmEmoji: {
    fontSize: 80,
    opacity: 0.6,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: SCAN_SIZE,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  progressText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    width: 36,
    textAlign: "right",
  },
  message: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    opacity: 0.8,
  },
});
