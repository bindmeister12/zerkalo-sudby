import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { View } from "react-native";
import { useApp } from "@/context/AppContext";

export default function IndexScreen() {
  const router = useRouter();
  const { hasCompletedOnboarding, disclaimerAccepted } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!disclaimerAccepted) {
        router.replace("/disclaimer");
      } else if (hasCompletedOnboarding) {
        router.replace("/(tabs)");
      } else {
        router.replace("/welcome");
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [hasCompletedOnboarding, disclaimerAccepted]);

  return <View style={{ flex: 1, backgroundColor: "#0A0010" }} />;
}
