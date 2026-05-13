import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN ?? "localhost"}/api`;

interface ServerStatus {
  firebaseConfigured: boolean;
  registeredDevices: number;
  config: {
    dailyReminderTitle: string;
    dailyReminderMessage: string;
    sessionExpiryTitle: string;
    sessionExpiryMessage: string;
  };
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [tokenRegistered, setTokenRegistered] = useState(false);
  const [sendingDaily, setSendingDaily] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const [dailyTitle, setDailyTitle] = useState("");
  const [dailyMessage, setDailyMessage] = useState("");
  const [expiryTitle, setExpiryTitle] = useState("");
  const [expiryMessage, setExpiryMessage] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/status`);
      if (res.ok) {
        const data = (await res.json()) as ServerStatus;
        setStatus(data);
        setDailyTitle(data.config.dailyReminderTitle);
        setDailyMessage(data.config.dailyReminderMessage);
        setExpiryTitle(data.config.sessionExpiryTitle);
        setExpiryMessage(data.config.sessionExpiryMessage);
      }
    } catch {
      // server unreachable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const registerPushToken = useCallback(async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Not available",
        "Push notifications require a native device."
      );
      return;
    }
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        finalStatus = newStatus;
      }
      if (finalStatus !== "granted") {
        Alert.alert(
          "Permission denied",
          "Enable notifications in device settings."
        );
        return;
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;
      const tokenData = projectId
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();

      const token = tokenData.data;
      setPushToken(token);

      const res = await fetch(`${API_BASE}/notifications/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, platform: Platform.OS }),
      });
      if (res.ok) {
        setTokenRegistered(true);
        fetchStatus();
        Alert.alert("Success", "This device is now registered for notifications.");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to register push token.");
    }
  }, [fetchStatus]);

  const saveConfig = useCallback(async () => {
    setSavingConfig(true);
    try {
      const res = await fetch(`${API_BASE}/notifications/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyReminderTitle: dailyTitle,
          dailyReminderMessage: dailyMessage,
          sessionExpiryTitle: expiryTitle,
          sessionExpiryMessage: expiryMessage,
        }),
      });
      if (res.ok) {
        Alert.alert("Saved", "Notification messages updated.");
        fetchStatus();
      }
    } catch {
      Alert.alert("Error", "Could not reach server.");
    } finally {
      setSavingConfig(false);
    }
  }, [dailyTitle, dailyMessage, expiryTitle, expiryMessage, fetchStatus]);

  const sendDaily = useCallback(async () => {
    setSendingDaily(true);
    try {
      const res = await fetch(`${API_BASE}/notifications/send-daily`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await res.json()) as { sent?: number; total?: number; error?: string };
      if (res.ok) {
        Alert.alert("Sent", `Daily reminder sent to ${data.sent}/${data.total} devices.`);
      } else {
        Alert.alert("Failed", data.error ?? "Unknown error");
      }
    } catch {
      Alert.alert("Error", "Could not reach server.");
    } finally {
      setSendingDaily(false);
    }
  }, []);

  const sendTest = useCallback(async () => {
    setSendingTest(true);
    try {
      if (Platform.OS !== "web" && pushToken) {
        const res = await fetch(`${API_BASE}/notifications/send-custom`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Elite Net — Test",
            body: "Test notification is working correctly.",
            tokens: [pushToken],
          }),
        });
        const data = (await res.json()) as { sent?: number; error?: string };
        if (res.ok) {
          Alert.alert("Sent", `Test notification sent to this device.`);
        } else {
          Alert.alert("Failed", data.error ?? "Unknown error");
        }
      } else {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Elite Net — Test",
            body: "Local test notification is working.",
          },
          trigger: null,
        });
        Alert.alert("Sent", "Local test notification delivered.");
      }
    } catch {
      Alert.alert("Error", "Could not send test notification.");
    } finally {
      setSendingTest(false);
    }
  }, [pushToken]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#000000", "#050508", "#000000"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="rgba(255,215,0,0.8)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ADMIN PANEL</Text>
        <TouchableOpacity
          onPress={fetchStatus}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={20} color="rgba(255,215,0,0.6)" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPad + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <ActivityIndicator color="#FFD700" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Firebase Status */}
            <Text style={styles.sectionLabel}>FIREBASE STATUS</Text>
            <GlassCard style={styles.card}>
              <View style={styles.statusRow}>
                <View style={styles.statusLeft}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: status?.firebaseConfigured
                          ? "#4CAF50"
                          : "#FF4444",
                      },
                    ]}
                  />
                  <View>
                    <Text style={styles.statusTitle}>
                      {status?.firebaseConfigured
                        ? "Firebase Connected"
                        : "Firebase Not Configured"}
                    </Text>
                    <Text style={styles.statusSub}>
                      {status?.firebaseConfigured
                        ? `${status.registeredDevices} device(s) registered`
                        : "Add FIREBASE_SERVICE_ACCOUNT secret to server"}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={
                    status?.firebaseConfigured
                      ? "checkmark-circle"
                      : "alert-circle"
                  }
                  size={22}
                  color={status?.firebaseConfigured ? "#4CAF50" : "#FF4444"}
                />
              </View>

              {!status?.firebaseConfigured && (
                <View style={styles.instructionBox}>
                  <Text style={styles.instructionTitle}>
                    How to connect Firebase:
                  </Text>
                  <Text style={styles.instructionStep}>
                    1. Open Replit Secrets (the lock icon in the sidebar)
                  </Text>
                  <Text style={styles.instructionStep}>
                    2. Add secret named:{" "}
                    <Text style={styles.monoText}>FIREBASE_SERVICE_ACCOUNT</Text>
                  </Text>
                  <Text style={styles.instructionStep}>
                    3. Paste your Firebase service account JSON as the value
                  </Text>
                  <Text style={styles.instructionStep}>
                    4. Restart the API server workflow
                  </Text>
                </View>
              )}
            </GlassCard>

            {/* Device Registration */}
            <Text style={styles.sectionLabel}>THIS DEVICE</Text>
            <GlassCard style={styles.card}>
              {pushToken ? (
                <View style={styles.tokenRow}>
                  <Ionicons
                    name={tokenRegistered ? "phone-portrait" : "phone-portrait-outline"}
                    size={18}
                    color={tokenRegistered ? "#FFD700" : "rgba(255,215,0,0.4)"}
                  />
                  <View style={styles.tokenInfo}>
                    <Text style={styles.tokenLabel}>
                      {tokenRegistered ? "Registered" : "Token obtained — not yet registered"}
                    </Text>
                    <Text style={styles.tokenValue} numberOfLines={1}>
                      {pushToken.slice(0, 36)}…
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.noToken}>
                  No push token — tap below to register this device.
                </Text>
              )}

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSecondary]}
                onPress={registerPushToken}
                activeOpacity={0.85}
              >
                <Ionicons name="notifications-outline" size={16} color="#FFD700" />
                <Text style={styles.actionBtnSecondaryText}>
                  {tokenRegistered ? "Re-register Device" : "Register This Device"}
                </Text>
              </TouchableOpacity>
            </GlassCard>

            {/* Notification Messages */}
            <Text style={styles.sectionLabel}>NOTIFICATION MESSAGES</Text>
            <GlassCard style={styles.card}>
              <Text style={styles.fieldLabel}>Daily Reminder Title</Text>
              <TextInput
                style={styles.input}
                value={dailyTitle}
                onChangeText={setDailyTitle}
                placeholderTextColor="rgba(240,248,255,0.25)"
                selectionColor="#FFD700"
              />

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                Daily Reminder Message
              </Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={dailyMessage}
                onChangeText={setDailyMessage}
                multiline
                numberOfLines={3}
                placeholderTextColor="rgba(240,248,255,0.25)"
                selectionColor="#FFD700"
                textAlignVertical="top"
              />

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                Session Expiry Title
              </Text>
              <TextInput
                style={styles.input}
                value={expiryTitle}
                onChangeText={setExpiryTitle}
                placeholderTextColor="rgba(240,248,255,0.25)"
                selectionColor="#FFD700"
              />

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                Session Expiry Message
              </Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={expiryMessage}
                onChangeText={setExpiryMessage}
                multiline
                numberOfLines={3}
                placeholderTextColor="rgba(240,248,255,0.25)"
                selectionColor="#FFD700"
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSecondary, { marginTop: 16 }]}
                onPress={saveConfig}
                disabled={savingConfig}
                activeOpacity={0.85}
              >
                {savingConfig ? (
                  <ActivityIndicator size="small" color="#FFD700" />
                ) : (
                  <Ionicons name="save-outline" size={16} color="#FFD700" />
                )}
                <Text style={styles.actionBtnSecondaryText}>
                  {savingConfig ? "Saving…" : "Save Messages"}
                </Text>
              </TouchableOpacity>
            </GlassCard>

            {/* Send Actions */}
            <Text style={styles.sectionLabel}>SEND NOTIFICATIONS</Text>
            <GlassCard style={styles.card}>
              <View style={styles.actionsCol}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={sendDaily}
                  disabled={sendingDaily || !status?.firebaseConfigured}
                  activeOpacity={0.85}
                >
                  {sendingDaily ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Ionicons name="send" size={16} color="#000" />
                  )}
                  <Text style={styles.actionBtnText}>
                    {sendingDaily ? "Sending…" : "Send Daily Reminder"}
                  </Text>
                  <Text style={styles.actionBtnBadge}>
                    {status?.registeredDevices ?? 0} devices
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnSecondary]}
                  onPress={sendTest}
                  disabled={sendingTest}
                  activeOpacity={0.85}
                >
                  {sendingTest ? (
                    <ActivityIndicator size="small" color="#FFD700" />
                  ) : (
                    <Ionicons name="flask-outline" size={16} color="#FFD700" />
                  )}
                  <Text style={styles.actionBtnSecondaryText}>
                    {sendingTest ? "Sending…" : "Send Test to This Device"}
                  </Text>
                </TouchableOpacity>
              </View>

              {!status?.firebaseConfigured && (
                <Text style={styles.disabledNote}>
                  "Send Daily Reminder" requires Firebase to be configured first.
                </Text>
              )}
            </GlassCard>

            {/* Unity Ads + VPN Note */}
            <Text style={styles.sectionLabel}>NATIVE ANDROID FEATURES</Text>
            <GlassCard style={styles.card}>
              <View style={styles.nativeRow}>
                <Ionicons name="logo-android" size={20} color="rgba(255,215,0,0.6)" />
                <View style={styles.nativeInfo}>
                  <Text style={styles.nativeTitle}>Requires Native Build</Text>
                  <Text style={styles.nativeSub}>
                    The following require a native Android developer to integrate:
                    {"\n"}• Unity Ads SDK (Game ID 60907){"\n"}• V2RayCore full-device VPN
                    {"\n"}• Android Foreground Service{"\n"}• APK build + Play Store signing
                  </Text>
                </View>
              </View>
            </GlassCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const GOLD = "#FFD700";
const ICE = "#F0F8FF";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000000" },
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
    color: ICE,
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: 4,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
  sectionLabel: {
    color: "rgba(240,248,255,0.3)",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 3,
    marginTop: 8,
    marginBottom: 2,
  },
  card: { marginVertical: 0 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusTitle: {
    color: ICE,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  statusSub: {
    color: "rgba(240,248,255,0.4)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  instructionBox: {
    marginTop: 16,
    backgroundColor: "rgba(255,215,0,0.04)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.12)",
    padding: 12,
    gap: 5,
  },
  instructionTitle: {
    color: GOLD,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  instructionStep: {
    color: "rgba(240,248,255,0.55)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  monoText: {
    fontFamily: "Inter_600SemiBold",
    color: GOLD,
  },
  tokenRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  tokenInfo: { flex: 1 },
  tokenLabel: {
    color: ICE,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  tokenValue: {
    color: "rgba(240,248,255,0.35)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  noToken: {
    color: "rgba(240,248,255,0.4)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
  },
  fieldLabel: {
    color: "rgba(240,248,255,0.4)",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255,215,0,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.18)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: ICE,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  inputMultiline: {
    minHeight: 72,
    paddingTop: 12,
  },
  actionsCol: { gap: 12 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 50,
    paddingVertical: 14,
  },
  actionBtnText: {
    color: "#000",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  actionBtnBadge: {
    color: "rgba(0,0,0,0.45)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  actionBtnSecondary: {
    backgroundColor: "rgba(255,215,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.25)",
  },
  actionBtnSecondaryText: {
    color: GOLD,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  disabledNote: {
    color: "rgba(240,248,255,0.3)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 10,
  },
  nativeRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  nativeInfo: { flex: 1 },
  nativeTitle: {
    color: ICE,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
  },
  nativeSub: {
    color: "rgba(240,248,255,0.45)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
});
