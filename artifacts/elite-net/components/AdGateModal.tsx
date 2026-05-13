import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useVpn } from "@/contexts/VpnContext";

const AD_WATCH_DURATION = 5;

export function AdGateModal() {
  const {
    phase,
    adSource,
    gateAdsWatched,
    boosterAdsWatched,
    finishAdWatch,
    cancelAdGate,
    startWatchAd,
  } = useVpn();

  const [countdown, setCountdown] = useState(AD_WATCH_DURATION);
  const [watching, setWatching] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressAnim2 = useRef(new Animated.Value(0)).current;

  const isAdGate = phase === "ad-gate";
  const isBoosterGate = phase === "booster-gate";
  const isWatchingAd = phase === "watching-ad";
  const isVisible = isAdGate || isBoosterGate || isWatchingAd;

  const isPeriodic = adSource === "periodic";
  const isBooster = adSource === "booster" || isBoosterGate;

  const adsRequired = isBooster ? 5 : isPeriodic ? 1 : 3;
  const adsWatched = isBooster ? boosterAdsWatched : 0;
  const gateProgress = isBooster
    ? boosterAdsWatched
    : adSource === "gate"
      ? gateAdsWatched
      : 0;

  useEffect(() => {
    if (!isWatchingAd) {
      setWatching(false);
      setCountdown(AD_WATCH_DURATION);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      progressAnim.setValue(0);
      progressAnim2.setValue(0);
    }
  }, [isWatchingAd]);

  useEffect(() => {
    if (isWatchingAd && !watching) {
      setWatching(true);
      setCountdown(AD_WATCH_DURATION);

      Animated.timing(progressAnim2, {
        toValue: 1,
        duration: AD_WATCH_DURATION * 1000,
        useNativeDriver: false,
      }).start();

      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            countdownRef.current = null;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => {
              finishAdWatch();
            }, 300);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [isWatchingAd]);

  const handleWatchAd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startWatchAd();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cancelAdGate();
  };

  const progressWidth = progressAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const gateTitle = isPeriodic
    ? "CONTINUE SESSION"
    : isBooster
      ? "ADD 30 MINUTES"
      : "UNLOCK ACCESS";

  const gateSubtitle = isPeriodic
    ? "Watch 1 ad to keep your session alive"
    : isBooster
      ? `Watch ${adsRequired} ads to boost your time`
      : `Watch ${adsRequired} ads to activate connection`;

  if (!isVisible) return null;

  const content = (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {isWatchingAd ? (
          <View style={styles.watchingContainer}>
            <View style={styles.adScreen}>
              <Ionicons name="play-circle" size={52} color="#FFD700" />
              <Text style={styles.adLabel}>AD PLAYING</Text>
              <Text style={styles.adCountdown}>{countdown}s</Text>
            </View>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
            <Text style={styles.watchingNote}>Please watch the full ad to continue</Text>
          </View>
        ) : (
          <View style={styles.gateContainer}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={isBooster ? "flash" : "shield-checkmark"}
                size={36}
                color="#FFD700"
              />
            </View>

            <Text style={styles.gateTitle}>{gateTitle}</Text>
            <Text style={styles.gateSubtitle}>{gateSubtitle}</Text>

            <View style={styles.dotsRow}>
              {Array.from({ length: adsRequired }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i < gateProgress && styles.dotFilled,
                  ]}
                />
              ))}
            </View>

            <Text style={styles.progressText}>
              {gateProgress} / {adsRequired} completed
            </Text>

            <TouchableOpacity
              style={styles.watchBtn}
              onPress={handleWatchAd}
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={18} color="#000" />
              <Text style={styles.watchBtnText}>WATCH AD</Text>
            </TouchableOpacity>

            {!isPeriodic && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      {Platform.OS === "ios" ? (
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
          {content}
        </BlurView>
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.androidBlur]}>
          {content}
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  androidBlur: {
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  sheet: {
    backgroundColor: "#0A0A0A",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
    paddingBottom: Platform.OS === "web" ? 34 : 40,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,215,0,0.3)",
    alignSelf: "center",
    marginBottom: 24,
  },
  gateContainer: {
    alignItems: "center",
    paddingBottom: 8,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,215,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  gateTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
    marginBottom: 8,
  },
  gateSubtitle: {
    color: "rgba(240,248,255,0.5)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 20,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255,215,0,0.35)",
    backgroundColor: "transparent",
  },
  dotFilled: {
    backgroundColor: "#FFD700",
    borderColor: "#FFD700",
  },
  progressText: {
    color: "rgba(240,248,255,0.4)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
    marginBottom: 28,
  },
  watchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFD700",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 50,
    width: "100%",
    justifyContent: "center",
    marginBottom: 16,
  },
  watchBtnText: {
    color: "#000",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  cancelBtn: {
    paddingVertical: 12,
  },
  cancelText: {
    color: "rgba(240,248,255,0.35)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  watchingContainer: {
    alignItems: "center",
    paddingBottom: 8,
  },
  adScreen: {
    width: "100%",
    height: 180,
    backgroundColor: "rgba(255,215,0,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    gap: 8,
  },
  adLabel: {
    color: "rgba(255,215,0,0.6)",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 3,
  },
  adCountdown: {
    color: "#FFD700",
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  progressTrack: {
    width: "100%",
    height: 3,
    backgroundColor: "rgba(255,215,0,0.12)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFD700",
    borderRadius: 2,
  },
  watchingNote: {
    color: "rgba(240,248,255,0.35)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
