import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, Platform, StyleSheet, View } from "react-native";

const { width, height } = Dimensions.get("window");

const COLORS = [
  "rgba(139, 92, 246, 0.8)",
  "rgba(59, 130, 246, 0.6)",
  "rgba(245, 158, 11, 0.5)",
  "rgba(236, 72, 153, 0.4)",
  "rgba(255, 255, 255, 0.3)",
];

interface ParticleProps {
  size: number;
  color: string;
  startX: number;
  delay: number;
  duration: number;
}

function Particle({ size, color, startX, delay, duration }: ParticleProps) {
  const translateY = useRef(new Animated.Value(height + 20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(height + 20);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -40,
          duration,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: duration * 0.3,
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: duration * 0.7,
            useNativeDriver: Platform.OS !== "web",
          }),
        ]),
      ]).start(() => animate());
    };
    const t = setTimeout(animate, delay);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
}

export function ParticleBackground({ count = 20 }: { count?: number }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      key: i,
      size: Math.random() * 4 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      startX: Math.random() * width,
      delay: i * 250,
      duration: Math.random() * 5000 + 5000,
    })),
  ).current;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <Particle
          key={p.key}
          size={p.size}
          color={p.color}
          startX={p.startX}
          delay={p.delay}
          duration={p.duration}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: "absolute",
    top: 0,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
});
