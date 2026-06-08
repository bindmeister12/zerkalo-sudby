import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export interface UserProfile {
  name: string;
  birthDate: string;
  birthTime?: string;
  gender?: string;
}

export interface DestinyResult {
  personalityProfile: string;
  strengths: string[];
  weaknesses: string[];
  hiddenTalents: string;
  loveStyle: string;
  moneyEnergy: string;
  futurePrediction: string;
  soulmateType: string;
  auraType: string;
  auraColor: string;
  destinyScore: number;
  luckyNumbers: number[];
  luckyDays: string[];
  zodiacSign: string;
  destinyArchetype: string;
  lifePathNumber: number;
  portraitImageBase64?: string | null;
}

export interface DailyFortune {
  message: string;
  energyLevel: number;
  luckyColor: string;
  luckyNumber: number;
  affirmation: string;
  warningArea: string;
  spiritAnimal: string;
  spiritAnimalEmoji: string;
  loveInsight: string;
  careerInsight: string;
  healthInsight: string;
  bestTime: string;
  cosmicTip: string;
  date: string;
}

export interface CurrentUser {
  id: number;
  email: string | null;
  displayName: string | null;
  vkLinked: boolean;
  emailVerified: boolean;
}

interface AppState {
  userProfile: UserProfile | null;
  destinyResult: DestinyResult | null;
  isPremium: boolean;
  streak: number;
  dailyFortune: DailyFortune | null;
  hasCompletedOnboarding: boolean;
  palmImageBase64: string | null;
  palmImageMimeType: string | null;
  disclaimerAccepted: boolean;
  currentUser: CurrentUser | null;
  authToken: string | null;
  freeScansUsed: number;
  freeCompatibilityUsed: number;
}

interface AppContextType extends AppState {
  isHydrated: boolean;
  subscriptionsEnabled: boolean;
  setUserProfile: (profile: UserProfile) => void;
  setDestinyResult: (result: DestinyResult) => void;
  setIsPremium: (value: boolean) => void;
  setDailyFortune: (fortune: DailyFortune) => void;
  setHasCompletedOnboarding: (value: boolean) => void;
  setPalmImage: (image: { base64: string; mimeType: string } | null) => void;
  setDisclaimerAccepted: (value: boolean) => void;
  incrementStreak: () => void;
  resetAll: () => void;
  setAuth: (token: string, user: CurrentUser) => void;
  setCurrentUser: (user: CurrentUser) => void;
  signOut: () => void;
  incrementFreeScans: () => void;
  incrementFreeCompatibility: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = "ai_destiny_app_state";

const INITIAL_STATE: AppState = {
  userProfile: null,
  destinyResult: null,
  isPremium: false,
  streak: 0,
  dailyFortune: null,
  hasCompletedOnboarding: false,
  palmImageBase64: null,
  palmImageMimeType: null,
  disclaimerAccepted: false,
  currentUser: null,
  authToken: null,
  freeScansUsed: 0,
  freeCompatibilityUsed: 0,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isHydrated, setIsHydrated] = useState(false);
  const [subscriptionsEnabled, setSubscriptionsEnabled] = useState(false);
  const hydrated = useRef(false);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    setAuthTokenGetter(() => tokenRef.current);
    return () => setAuthTokenGetter(null);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Partial<AppState>;
          const merged: AppState = { ...INITIAL_STATE, ...parsed };
          setState(merged);
          tokenRef.current = merged.authToken ?? null;
        } catch {
          // ignore parse errors
        }
      }
      hydrated.current = true;
      setIsHydrated(true);
    });
  }, []);

  useEffect(() => {
    const domain = process.env["EXPO_PUBLIC_DOMAIN"] || "localhost";
    const base =
      typeof window !== "undefined" && !process.env["EXPO_PUBLIC_DOMAIN"]
        ? "/api"
        : `https://${domain}/api`;
    fetch(`${base}/app-config`)
      .then((r) => r.json())
      .then((data: { subscriptionsEnabled?: boolean }) => {
        setSubscriptionsEnabled(data.subscriptionsEnabled ?? false);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    tokenRef.current = state.authToken;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const update = useCallback((patch: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setUserProfile = useCallback(
    (profile: UserProfile) => update({ userProfile: profile }),
    [update],
  );
  const setDestinyResult = useCallback(
    (result: DestinyResult) => update({ destinyResult: result }),
    [update],
  );
  const setIsPremium = useCallback(
    (value: boolean) => update({ isPremium: value }),
    [update],
  );
  const setDailyFortune = useCallback(
    (fortune: DailyFortune) => update({ dailyFortune: fortune }),
    [update],
  );
  const setHasCompletedOnboarding = useCallback(
    (value: boolean) => update({ hasCompletedOnboarding: value }),
    [update],
  );
  const setPalmImage = useCallback(
    (image: { base64: string; mimeType: string } | null) =>
      update({
        palmImageBase64: image?.base64 ?? null,
        palmImageMimeType: image?.mimeType ?? null,
      }),
    [update],
  );
  const setDisclaimerAccepted = useCallback(
    (value: boolean) => update({ disclaimerAccepted: value }),
    [update],
  );
  const incrementStreak = useCallback(() => {
    setState((prev) => ({ ...prev, streak: prev.streak + 1 }));
  }, []);
  const resetAll = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);
  const setAuth = useCallback((token: string, user: CurrentUser) => {
    tokenRef.current = token;
    update({ authToken: token, currentUser: user });
  }, [update]);
  const setCurrentUser = useCallback((user: CurrentUser) => {
    update({ currentUser: user });
  }, [update]);
  const signOut = useCallback(() => {
    tokenRef.current = null;
    update({ authToken: null, currentUser: null });
  }, [update]);
  const incrementFreeScans = useCallback(() => {
    setState((prev) => ({ ...prev, freeScansUsed: prev.freeScansUsed + 1 }));
  }, []);
  const incrementFreeCompatibility = useCallback(() => {
    setState((prev) => ({ ...prev, freeCompatibilityUsed: prev.freeCompatibilityUsed + 1 }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        isHydrated,
        subscriptionsEnabled,
        setUserProfile,
        setDestinyResult,
        setIsPremium,
        setDailyFortune,
        setHasCompletedOnboarding,
        setPalmImage,
        setDisclaimerAccepted,
        incrementStreak,
        resetAll,
        setAuth,
        setCurrentUser,
        signOut,
        incrementFreeScans,
        incrementFreeCompatibility,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
