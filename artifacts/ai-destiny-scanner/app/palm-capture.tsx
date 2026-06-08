import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function guessMimeFromUri(uri: string): string | null {
  const lower = uri.toLowerCase().split("?")[0];
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/jpeg";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return null;
}

export default function PalmCaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { setPalmImage } = useApp();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("image/jpeg");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 24 : insets.top;
  const botPad = Platform.OS === "web" ? 24 : insets.bottom;

  async function pickFromCamera() {
    setError(null);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setError("Нужен доступ к камере, чтобы сфотографировать ладонь.");
        return;
      }
      setLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });
      handleResult(result);
    } catch (e) {
      setError("Не удалось открыть камеру. Попробуй загрузить фото из галереи.");
    } finally {
      setLoading(false);
    }
  }

  async function pickFromLibrary() {
    setError(null);
    try {
      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });
      handleResult(result);
    } catch (e) {
      setError("Не удалось открыть галерею.");
    } finally {
      setLoading(false);
    }
  }

  function handleResult(result: ImagePicker.ImagePickerResult) {
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      setError("Не удалось получить изображение. Попробуй снова.");
      return;
    }
    const mime = asset.mimeType || guessMimeFromUri(asset.uri) || "image/jpeg";
    setImageUri(asset.uri);
    setImageBase64(asset.base64);
    setImageMimeType(mime);
  }

  function handleContinue() {
    if (!imageBase64) return;
    setPalmImage({ base64: imageBase64, mimeType: imageMimeType });
    router.push("/scanning");
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
          { paddingTop: topPad + 20, paddingBottom: botPad + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Сфотографируй ладонь
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            ИИ прочитает линии судьбы по твоему фото
          </Text>
        </View>

        <View
          style={[
            styles.previewBox,
            {
              backgroundColor: colors.card,
              borderColor: imageUri ? colors.neonPurple : colors.neonPurple + "40",
            },
          ]}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="hand-left-outline" size={72} color={colors.neonPurple} />
              <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>
                Здесь появится фото ладони
              </Text>
            </View>
          )}
          {loading && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator color={colors.neonPurple} size="large" />
            </View>
          )}
        </View>

        <View style={[styles.tipBox, { backgroundColor: colors.card, borderColor: colors.neonPurple + "30" }]}>
          <Ionicons name="bulb" size={20} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.tipTitle, { color: colors.foreground }]}>Как правильно</Text>
            <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
              • Раскрой ладонь полностью{"\n"}
              • Хорошее, ровное освещение{"\n"}
              • Снимай с близкого расстояния
            </Text>
          </View>
        </View>

        {error && (
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.neonPurple + "60" }]}
            onPress={pickFromCamera}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={22} color={colors.neonPurple} />
            <Text style={[styles.actionText, { color: colors.foreground }]}>Камера</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.neonPurple + "60" }]}
            onPress={pickFromLibrary}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name="images" size={22} color={colors.neonPurple} />
            <Text style={[styles.actionText, { color: colors.foreground }]}>Галерея</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.continueBtn, { opacity: imageBase64 ? 1 : 0.4, shadowColor: colors.neonPurple }]}
          onPress={handleContinue}
          disabled={!imageBase64}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.neonPurple, "#6D28D9"]}
            style={styles.continueBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.continueBtnText}>Анализировать ладонь</Text>
            <Ionicons name="scan" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, gap: 20 },
  backBtn: { alignSelf: "flex-start" },
  header: { gap: 8 },
  title: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  previewBox: {
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  preview: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center", gap: 12, padding: 24 },
  placeholderText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  tipBox: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  tipTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  tipText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  errorText: { fontSize: 14, fontFamily: "Inter_500Medium", textAlign: "center" },
  actions: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  actionText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  continueBtn: {
    borderRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  continueBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  continueBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
});
