import { Platform } from "react-native";
import { setBaseUrl } from "@workspace/api-client-react";

let initialized = false;

export function ensureApiBaseUrl(): void {
  if (initialized) return;
  initialized = true;
  if (Platform.OS === "web") {
    setBaseUrl(null);
    return;
  }
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) {
    setBaseUrl(`https://${domain}`);
  }
}
