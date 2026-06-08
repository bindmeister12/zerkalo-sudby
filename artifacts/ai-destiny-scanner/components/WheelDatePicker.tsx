import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

const ITEM_HEIGHT = 44;
const VISIBLE_COUNT = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;

const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function daysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

interface WheelColumnProps {
  values: (string | number)[];
  selectedIndex: number;
  onChange: (index: number) => void;
  width: number;
}

function WheelColumn({ values, selectedIndex, onChange, width }: WheelColumnProps) {
  const colors = useColors();
  const ref = useRef<ScrollView>(null);
  const scrollingRef = useRef(false);
  const lastReportedRef = useRef(selectedIndex);

  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!scrollingRef.current && selectedIndex !== lastReportedRef.current) {
      ref.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: true });
      lastReportedRef.current = selectedIndex;
    }
  }, [selectedIndex]);

  return (
    <View style={{ width, height: PICKER_HEIGHT }}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        nestedScrollEnabled
        onScrollBeginDrag={() => { scrollingRef.current = true; }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          const clamped = Math.max(0, Math.min(values.length - 1, idx));
          scrollingRef.current = false;
          if (clamped !== lastReportedRef.current) {
            lastReportedRef.current = clamped;
            onChange(clamped);
          }
        }}
        onScrollEndDrag={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          const clamped = Math.max(0, Math.min(values.length - 1, idx));
          // On web (and on native when drag ends without momentum), commit immediately
          // so the visual snap matches state before confirm.
          setTimeout(() => {
            if (scrollingRef.current) {
              scrollingRef.current = false;
              ref.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
              if (clamped !== lastReportedRef.current) {
                lastReportedRef.current = clamped;
                onChange(clamped);
              }
            }
          }, Platform.OS === "web" ? 0 : 120);
        }}
        contentContainerStyle={{
          paddingVertical: ITEM_HEIGHT * Math.floor(VISIBLE_COUNT / 2),
        }}
      >
        {values.map((v, i) => {
          const isSelected = i === selectedIndex;
          return (
            <Pressable
              key={i}
              onPress={() => {
                ref.current?.scrollTo({ y: i * ITEM_HEIGHT, animated: true });
                if (i !== lastReportedRef.current) {
                  lastReportedRef.current = i;
                  onChange(i);
                }
              }}
              style={[styles.item, { height: ITEM_HEIGHT }]}
            >
              <Text
                style={{
                  fontSize: isSelected ? 20 : 16,
                  fontFamily: isSelected ? "Inter_700Bold" : "Inter_400Regular",
                  color: isSelected ? colors.neonPurple : colors.mutedForeground,
                  opacity: isSelected ? 1 : 0.6,
                }}
              >
                {v}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export interface WheelDatePickerProps {
  visible: boolean;
  initialDate?: string; // ISO YYYY-MM-DD
  minYear?: number;
  maxYear?: number;
  title?: string;
  onClose: () => void;
  onConfirm: (isoDate: string) => void;
}

export function WheelDatePicker({
  visible,
  initialDate,
  minYear = 1940,
  maxYear = new Date().getFullYear(),
  title = "Выбери дату",
  onClose,
  onConfirm,
}: WheelDatePickerProps) {
  const colors = useColors();

  const init = (() => {
    if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
      const [y, m, d] = initialDate.split("-").map(Number);
      return { y, m: m - 1, d };
    }
    return { y: 1995, m: 0, d: 1 };
  })();

  const [year, setYear] = useState(init.y);
  const [month, setMonth] = useState(init.m);
  const [day, setDay] = useState(init.d);

  useEffect(() => {
    if (visible) {
      setYear(init.y);
      setMonth(init.m);
      setDay(init.d);
    }
  }, [visible]);

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  const maxDay = daysInMonth(month, year);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  useEffect(() => {
    if (day > maxDay) setDay(maxDay);
  }, [month, year, maxDay]);

  function handleConfirm() {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onConfirm(iso);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View style={styles.wheelsWrap}>
            <View
              pointerEvents="none"
              style={[
                styles.selectionBar,
                {
                  top: ITEM_HEIGHT * Math.floor(VISIBLE_COUNT / 2),
                  borderColor: colors.neonPurple + "60",
                  backgroundColor: colors.neonPurple + "12",
                },
              ]}
            />
            <View style={styles.wheelsRow}>
              <WheelColumn
                values={days}
                selectedIndex={day - 1}
                onChange={(i) => setDay(days[i])}
                width={70}
              />
              <WheelColumn
                values={MONTHS}
                selectedIndex={month}
                onChange={(i) => setMonth(i)}
                width={140}
              />
              <WheelColumn
                values={years}
                selectedIndex={years.indexOf(year)}
                onChange={(i) => setYear(years[i])}
                width={90}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: colors.neonPurple }]}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmText}>Подтвердить</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function formatRussianDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  sheet: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  wheelsWrap: {
    height: PICKER_HEIGHT,
    position: "relative",
  },
  wheelsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    height: PICKER_HEIGHT,
  },
  selectionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRadius: 8,
  },
  item: { alignItems: "center", justifyContent: "center" },
  confirmBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
