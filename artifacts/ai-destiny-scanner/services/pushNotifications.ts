import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPushPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleDailyFortuneNotification(): Promise<void> {
  if (Platform.OS === "web") return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const granted = await requestPushPermissions();
  if (!granted) return;

  const messages = [
    { title: "🔮 Зеркало Судьбы", body: "Твоё ежедневное предсказание готово — загляни в будущее!" },
    { title: "✨ Энергия дня", body: "Вселенная приготовила для тебя послание на сегодня." },
    { title: "💜 Оракул ждёт", body: "Узнай, что звёзды говорят о твоём дне прямо сейчас." },
    { title: "🌟 Предсказание дня", body: "Твоя аура активна — посмотри ежедневный прогноз." },
  ];

  const random = messages[Math.floor(Math.random() * messages.length)];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: random.title,
      body: random.body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.DEFAULT,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
