import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const DAILY_LIMIT_SECONDS = 7200;
const BOOSTER_SECONDS = 1800;
const AD_GATE_COUNT = 3;
const BOOSTER_AD_COUNT = 5;
const PERIODIC_AD_INTERVAL_SECONDS = 15 * 60;
const STORAGE_KEY = "@elite_net_v1";

export type Phase =
  | "idle"
  | "ad-gate"
  | "watching-ad"
  | "connecting"
  | "connected"
  | "time-up"
  | "booster-gate";

export type AdSource = "gate" | "booster" | "periodic";

interface VpnContextValue {
  phase: Phase;
  adSource: AdSource;
  gateAdsWatched: number;
  boosterAdsWatched: number;
  timeRemaining: number;
  totalTime: number;
  nextAdIn: number;
  requestConnect: () => void;
  disconnect: () => void;
  startWatchAd: () => void;
  finishAdWatch: () => void;
  cancelAdGate: () => void;
  requestBooster: () => void;
}

const VpnContext = createContext<VpnContextValue | null>(null);

export function useVpn() {
  const ctx = useContext(VpnContext);
  if (!ctx) throw new Error("useVpn must be used within VpnProvider");
  return ctx;
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

interface StoredData {
  date: string;
  usedSeconds: number;
}

export function VpnProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [adSource, setAdSource] = useState<AdSource>("gate");
  const [gateAdsWatched, setGateAdsWatched] = useState(0);
  const [boosterAdsWatched, setBoosterAdsWatched] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(DAILY_LIMIT_SECONDS);
  const [nextAdIn, setNextAdIn] = useState(PERIODIC_AD_INTERVAL_SECONDS);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const adCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data: StoredData = JSON.parse(raw);
          if (data.date === getTodayDate()) {
            const rem = Math.max(0, DAILY_LIMIT_SECONDS - data.usedSeconds);
            setTimeRemaining(rem);
            if (rem <= 0) setPhase("time-up");
          } else {
            await AsyncStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ date: getTodayDate(), usedSeconds: 0 })
            );
          }
        }
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  const persistUsage = useCallback(async (remaining: number) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          date: getTodayDate(),
          usedSeconds: DAILY_LIMIT_SECONDS - remaining,
        })
      );
    } catch {
      // ignore
    }
  }, []);

  const stopAllTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (adCountdownRef.current) {
      clearInterval(adCountdownRef.current);
      adCountdownRef.current = null;
    }
  }, []);

  const startSession = useCallback(() => {
    stopAllTimers();
    setNextAdIn(PERIODIC_AD_INTERVAL_SECONDS);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          stopAllTimers();
          setPhase("time-up");
          persistUsage(0);
          return 0;
        }
        persistUsage(next);
        return next;
      });
    }, 1000);

    adCountdownRef.current = setInterval(() => {
      setNextAdIn((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          if (phaseRef.current === "connected") {
            setAdSource("periodic");
            setPhase("watching-ad");
          }
          return PERIODIC_AD_INTERVAL_SECONDS;
        }
        return next;
      });
    }, 1000);
  }, [stopAllTimers, persistUsage]);

  useEffect(() => {
    return () => stopAllTimers();
  }, [stopAllTimers]);

  const requestConnect = useCallback(() => {
    if (phase === "connected") {
      stopAllTimers();
      setPhase("idle");
      return;
    }
    if (timeRemaining <= 0) {
      setPhase("time-up");
      return;
    }
    setGateAdsWatched(0);
    setAdSource("gate");
    setPhase("ad-gate");
  }, [phase, timeRemaining, stopAllTimers]);

  const disconnect = useCallback(() => {
    stopAllTimers();
    setPhase("idle");
    setGateAdsWatched(0);
  }, [stopAllTimers]);

  const startWatchAd = useCallback(() => {
    setPhase("watching-ad");
  }, []);

  const finishAdWatch = useCallback(() => {
    const src = adSource;
    if (src === "gate") {
      setGateAdsWatched((prev) => {
        const next = prev + 1;
        if (next >= AD_GATE_COUNT) {
          setPhase("connecting");
          setTimeout(() => {
            setPhase("connected");
            startSession();
          }, 2200);
        } else {
          setPhase("ad-gate");
        }
        return next;
      });
    } else if (src === "booster") {
      setBoosterAdsWatched((prev) => {
        const next = prev + 1;
        if (next >= BOOSTER_AD_COUNT) {
          setTimeRemaining((t) => {
            const boosted = t + BOOSTER_SECONDS;
            persistUsage(boosted);
            return boosted;
          });
          setBoosterAdsWatched(0);
          setPhase("connecting");
          setTimeout(() => {
            setPhase("connected");
            startSession();
          }, 2200);
        } else {
          setPhase("booster-gate");
        }
        return next;
      });
    } else {
      // periodic
      setPhase("connected");
    }
  }, [adSource, startSession, persistUsage]);

  const cancelAdGate = useCallback(() => {
    setPhase("idle");
    setGateAdsWatched(0);
  }, []);

  const requestBooster = useCallback(() => {
    setBoosterAdsWatched(0);
    setAdSource("booster");
    setPhase("booster-gate");
  }, []);

  return (
    <VpnContext.Provider
      value={{
        phase,
        adSource,
        gateAdsWatched,
        boosterAdsWatched,
        timeRemaining,
        totalTime: DAILY_LIMIT_SECONDS,
        nextAdIn,
        requestConnect,
        disconnect,
        startWatchAd,
        finishAdWatch,
        cancelAdGate,
        requestBooster,
      }}
    >
      {children}
    </VpnContext.Provider>
  );
}
