import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";

interface AuraOrbProps {
  color: string;
  size?: number;
}

export function AuraOrb({ color, size = 120 }: AuraOrbProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.4)).current;
  const useNative = Platform.OS !== "web";

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulse, { toValue: 1.1, duration: 2000, useNativeDriver: useNative }),
          Animated.timing(glow, { toValue: 0.7, duration: 2000, useNativeDriver: useNative }),
        ]),
        Animated.parallel([
          Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: useNative }),
          Animated.timing(glow, { toValue: 0.4, duration: 2000, useNativeDriver: useNative }),
        ]),
      ]),
    ).start();
  }, []);

  return (
    <View style={[styles.container, { width: size * 1.6, height: size * 1.6 }]}>
      <Animated.View
        style={[
          styles.outerGlow,
          {
            width: size * 1.6,
            height: size * 1.6,
            borderRadius: size * 0.8,
            backgroundColor: color,
            opacity: glow,
            transform: [{ scale: pulse }],
          },
        ]}
      />
      <View
        style={[
          styles.orb,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            shadowColor: color,
            shadowRadius: 30,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  outerGlow: {
    position: "absolute",
  },
  orb: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    elevation: 20,
  },
});
