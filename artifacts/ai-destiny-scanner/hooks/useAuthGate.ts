import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useApp } from "@/context/AppContext";

/**
 * Returns a helper that ensures the user is authenticated before continuing.
 * If not, it redirects to /auth with a return path.
 */
export function useRequireAuth() {
  const router = useRouter();
  const { currentUser, isHydrated } = useApp();
  return useCallback(
    (redirectTo: string): boolean => {
      if (!isHydrated) return false;
      if (currentUser) return true;
      router.push(`/auth?redirect=${encodeURIComponent(redirectTo)}` as never);
      return false;
    },
    [router, currentUser, isHydrated],
  );
}
