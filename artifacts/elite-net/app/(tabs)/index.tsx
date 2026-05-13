import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AdGateModal } from "@/components/AdGateModal";
import { EnergyCore } from "@/components/EnergyCore";
import { GlassCard } from "@/components/GlassCard";
import { ParticleField } from "@/components/ParticleField";
import { TimerRing } from "@/components/TimerRing";
import { useVpn } from "@/contexts/VpnContext";

const SERVERS = [
  { label: "Egypt — Cairo", code: "EG", latency: "12ms" },
  { label: "Germany — Frankfurt", code: "DE", latency: "38ms" },
  { label: "Netherlands — Amsterdam", code: "NL", latency: "44ms" },
];

function formatNextAd(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    phase,
    timeRemaining,
    totalTime,
    nextAdIn,
    requestConnect,
    disconnect,
    requestBooster,
  } = useVpn();

  const isConnected = phase === "connected";
  const isConnecting = phase === "connecting";
  const isTimeUp = phase === "time-up";
  const isIdle = phase === "idle";

  const statusLabel = isConnected
    ? "CONNECTED"
    : isConnecting
      ? "CONNECTING"
      : isTimeUp
        ? "TIME EXPIRED"
        : "DISCONNECTED";

  const statusColor = isConnected
    ? "#FFD700"
    : isConnecting
      ? "rgba(255,215,0,0.7)"
      : isTimeUp
        ? "#FF4444"
        : "rgba(240,248,255,0.35)";

  const topPad =
    Platform.OS === "web" ? 67 : insets.top;
  const bottomPad =
    Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#000000", "#050508", "#000000"]}
        style={StyleSheet.absoluteFill}
      />
      <ParticleField />

      <View
        style={[
          styles.container,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 16 },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="globe-outline" size={18} color="#FFD700" />
            </View>
            <Text style={styles.logoText}>ELITE NET</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/privacy")}
            style={styles.settingsBtn}
            activeOpacity={0.7}
          >
            <Ionicons
              name="information-circle-outline"
              size={24}
              color="rgba(255,215,0,0.6)"
            />
          </TouchableOpacity>
        </View>

        {/* Status badge */}
        <View style={styles.statusRow}>
          <View
            style={[styles.statusDot, { backgroundColor: statusColor }]}
          />
          <Text style={[styles.statusLabel, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>

        {/* Core + Ring */}
        <View style={styles.coreWrapper}>
          <TimerRing
            timeRemaining={timeRemaining}
            totalTime={totalTime}
            isConnected={isConnected}
          />
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <View style={styles.coreCenter} pointerEvents="box-none">
              <EnergyCore
                phase={phase}
                onPress={isConnected ? disconnect : requestConnect}
              />
            </View>
          </View>
        </View>

        {/* Tap hint */}
        <Text style={styles.tapHint}>
          {isConnected
            ? "Tap to disconnect"
            : isTimeUp
              ? "Daily limit reached"
              : "Tap to connect"}
        </Text>

        {/* Stats row (visible when connected) */}
        {isConnected && (
          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard}>
              <View style={styles.statCardInner}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color="rgba(255,215,0,0.6)"
                />
                <Text style={styles.statLabel}>NEXT AD</Text>
                <Text style={styles.statValue}>{formatNextAd(nextAdIn)}</Text>
              </View>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <View style={styles.statCardInner}>
                <Ionicons
                  name="server-outline"
                  size={16}
                  color="rgba(255,215,0,0.6)"
                />
                <Text style={styles.statLabel}>SERVER</Text>
                <Text style={styles.statValue}>EG-01</Text>
              </View>
            </GlassCard>
          </View>
        )}

        {/* Server selector (visible when idle/disconnected) */}
        {(isIdle || isTimeUp) && (
          <GlassCard style={styles.serverCard}>
            <View style={styles.serverCardInner}>
              <Text style={styles.serverHeading}>SERVER LOCATION</Text>
              {SERVERS.map((s, i) => (
                <Pressable
                  key={s.code}
                  style={[
                    styles.serverRow,
                    i === 0 && styles.serverRowSelected,
                  ]}
                >
                  <View style={styles.serverLeft}>
                    <View
                      style={[
                        styles.serverFlag,
                        i === 0 && styles.serverFlagSelected,
                      ]}
                    >
                      <Text style={styles.serverFlagText}>{s.code}</Text>
                    </View>
                    <Text
                      style={[
                        styles.serverName,
                        i === 0 && { color: "#FFD700" },
                      ]}
                    >
                      {s.label}
                    </Text>
                  </View>
                  <Text style={styles.serverLatency}>{s.latency}</Text>
                </Pressable>
              ))}
            </View>
          </GlassCard>
        )}

        {/* Time-up booster */}
        {isTimeUp && (
          <TouchableOpacity
            style={styles.boosterBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              requestBooster();
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="flash" size={18} color="#000" />
            <Text style={styles.boosterBtnText}>ADD 30 MINUTES</Text>
            <Text style={styles.boosterBtnSub}>  ·  5 ads</Text>
          </TouchableOpacity>
        )}
      </View>

      <AdGateModal />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,215,0,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#F0F8FF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 4,
  },
  settingsBtn: {
    padding: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 3,
  },
  coreWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  coreCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tapHint: {
    color: "rgba(240,248,255,0.25)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
  },
  statCardInner: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
  },
  statLabel: {
    color: "rgba(240,248,255,0.35)",
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
  },
  statValue: {
    color: "#F0F8FF",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  serverCard: {
    marginBottom: 16,
  },
  serverCardInner: {
    gap: 2,
  },
  serverHeading: {
    color: "rgba(240,248,255,0.3)",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 3,
    marginBottom: 12,
  },
  serverRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  serverRowSelected: {
    backgroundColor: "rgba(255,215,0,0.06)",
  },
  serverLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  serverFlag: {
    width: 36,
    height: 24,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  serverFlagSelected: {
    backgroundColor: "rgba(255,215,0,0.12)",
    borderColor: "rgba(255,215,0,0.3)",
  },
  serverFlagText: {
    color: "rgba(240,248,255,0.7)",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  serverName: {
    color: "rgba(240,248,255,0.6)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  serverLatency: {
    color: "rgba(255,215,0,0.5)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  boosterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFD700",
    borderRadius: 50,
    paddingVertical: 16,
    gap: 8,
  },
  boosterBtnText: {
    color: "#000",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  boosterBtnSub: {
    color: "rgba(0,0,0,0.5)",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
