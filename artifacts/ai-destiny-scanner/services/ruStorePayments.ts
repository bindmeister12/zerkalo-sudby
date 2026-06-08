import { NativeModules, Platform } from "react-native";

export const PRODUCT_IDS = {
  MONTHLY: "zerkalo_premium_monthly",
  ANNUAL: "zerkalo_premium_annual",
} as const;

export interface RuStoreProduct {
  productId: string;
  type: string;
  amountLabel: string;
  price?: number;
  currency: string;
  title: string;
  description?: string;
  subscriptionInfo?: unknown;
}

export interface SubscriptionPurchase {
  purchaseId: string;
  productId: string;
  status: string;
  expirationDate?: string;
  sandbox: boolean;
}

export type PurchaseResult =
  | { type: "SUCCESS"; productId: string; purchaseId: string }
  | { type: "CANCELLED" }
  | { type: "ERROR"; message: string }
  | { type: "UNAVAILABLE"; reason: string };

function getRuStorePay(): typeof NativeModules.RuStoreReactPay | null {
  if (Platform.OS !== "android") return null;
  return NativeModules.RuStoreReactPay ?? null;
}

export async function checkPurchaseAvailability(): Promise<{
  available: boolean;
  reason?: string;
}> {
  const pay = getRuStorePay();
  if (!pay) {
    return { available: false, reason: "RuStore доступен только на Android" };
  }
  try {
    const result = await pay.getPurchaseAvailability();
    if (result?.isAvailable) {
      return { available: true };
    }
    return { available: false, reason: result?.cause?.message ?? "Платежи недоступны" };
  } catch (e: unknown) {
    return { available: false, reason: e instanceof Error ? e.message : "Ошибка проверки платежей" };
  }
}

export async function purchaseSubscription(
  productId: string,
  userId?: string,
  userEmail?: string
): Promise<PurchaseResult> {
  const pay = getRuStorePay();
  if (!pay) {
    return { type: "UNAVAILABLE", reason: "RuStore доступен только на Android" };
  }

  const availability = await checkPurchaseAvailability();
  if (!availability.available) {
    return { type: "UNAVAILABLE", reason: availability.reason ?? "Платежи недоступны" };
  }

  try {
    const result = await pay.purchase({
      productId,
      appUserId: userId,
      appUserEmail: userEmail,
    });

    if (result?.subscriptionPurchase) {
      const sub = result.subscriptionPurchase as SubscriptionPurchase;
      if (sub.status === "ACTIVE" || sub.status === "PROCESSING") {
        return { type: "SUCCESS", productId, purchaseId: sub.purchaseId };
      }
    }
    if (result?.productPurchase) {
      const p = result.productPurchase as { purchaseId: string; status: string };
      if (p.status === "CONFIRMED" || p.status === "PAID") {
        return { type: "SUCCESS", productId, purchaseId: p.purchaseId };
      }
    }

    return { type: "CANCELLED" };
  } catch (e: unknown) {
    if (e instanceof Error) {
      const msg = e.message.toLowerCase();
      if (msg.includes("cancel") || msg.includes("dismiss") || msg.includes("отмен")) {
        return { type: "CANCELLED" };
      }
      return { type: "ERROR", message: e.message };
    }
    return { type: "ERROR", message: "Неизвестная ошибка при покупке" };
  }
}

export async function getActiveSubscriptions(): Promise<SubscriptionPurchase[]> {
  const pay = getRuStorePay();
  if (!pay) return [];

  try {
    const purchases = await pay.getPurchases({ productType: "SUBSCRIPTION" });
    if (!Array.isArray(purchases)) return [];
    return purchases
      .map((p: { subscriptionPurchase?: SubscriptionPurchase }) => p.subscriptionPurchase)
      .filter((s): s is SubscriptionPurchase => !!s && (s.status === "ACTIVE" || s.status === "PAUSED"));
  } catch {
    return [];
  }
}

export async function restorePurchases(): Promise<boolean> {
  const subs = await getActiveSubscriptions();
  return subs.length > 0;
}

export function isRuStoreAvailable(): boolean {
  return Platform.OS === "android" && !!NativeModules.RuStoreReactPay;
}
