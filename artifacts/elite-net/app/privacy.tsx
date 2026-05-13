import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";

const PRIVACY_URL = "https://sites.google.com/view/elite-loot-policy/";

const SECTIONS = [
  {
    title: "Data We Collect",
    icon: "document-text-outline" as const,
    content:
      "Elite Net does not log your browsing activity, DNS queries, IP addresses, or any identifiable usage data. We collect only anonymous usage metrics required for ad delivery and session management.",
  },
  {
    title: "Advertisement",
    icon: "play-circle-outline" as const,
    content:
      "We display ads via Unity Ads (Game ID: 60907) to fund the free service. Unity Ads may collect device identifiers for ad targeting in accordance with their own privacy policy.",
  },
  {
    title: "Daily Session",
    icon: "time-outline" as const,
    content:
      "Your 2-hour daily usage limit is stored locally on your device only. We never transmit your session data to external servers.",
  },
  {
    title: "Notifications",
    icon: "notifications-outline" as const,
    content:
      "We send one daily push notification to remind you your free internet session is ready. You may disable notifications at any time in your device settings.",
  },
  {
    title: "VPN Service",
    icon: "shield-outline" as const,
    content:
      "Elite Net uses standard Android VPN APIs. Your traffic is routed through secure tunnels. We do not inspect, store, or sell your network traffic.",
  },
];

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#000000", "#050508", "#000000"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color="rgba(255,215,0,0.8)"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PRIVACY POLICY</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBadge}>
          <Ionicons name="shield-checkmark" size={32} color="#FFD700" />
        </View>
        <Text style={styles.heroTitle}>Your Privacy Matters</Text>
        <Text style={styles.heroSub}>
          Elite Net is committed to transparency. Here is exactly what we
          collect — and what we don't.
        </Text>

        {SECTIONS.map((s) => (
          <GlassCard key={s.title} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardIcon}>
                <Ionicons name={s.icon} size={20} color="#FFD700" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{s.title}</Text>
                <Text style={styles.cardBody}>{s.content}</Text>
              </View>
            </View>
          </GlassCard>
        ))}

        <TouchableOpacity
          style={styles.externalBtn}
          onPress={() => Linking.openURL(PRIVACY_URL)}
          activeOpacity={0.85}
        >
          <Ionicons name="open-outline" size={16} color="#000" />
          <Text style={styles.externalBtnText}>FULL PRIVACY POLICY</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          By using Elite Net you agree to our terms and the Unity Ads privacy
          policy. Last updated: May 2025.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#F0F8FF",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  heroBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,215,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  heroTitle: {
    color: "#F0F8FF",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  heroSub: {
    color: "rgba(240,248,255,0.45)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  card: {
    marginVertical: 0,
  },
  cardRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,215,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: "#F0F8FF",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
  },
  cardBody: {
    color: "rgba(240,248,255,0.5)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  externalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFD700",
    borderRadius: 50,
    paddingVertical: 16,
    marginTop: 8,
  },
  externalBtnText: {
    color: "#000",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  footerNote: {
    color: "rgba(240,248,255,0.2)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 8,
  },
});
