import React, { useEffect, useRef } from "react";
import {
  Animated,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CONSENT_KEY = "vpn_consent_v1";
const PRIVACY_URL = "https://sites.google.com/view/elite-loot-policy/";

interface Props {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * VpnConsentDialog
 *
 * Required by Google Play VPN policy (2022+):
 * "Apps that use the VpnService API must disclose their use of the
 *  VPN API before requesting the BIND_VPN_SERVICE permission."
 *
 * This dialog:
 *  - Explains exactly what the VPN permission does
 *  - Links to the Privacy Policy
 *  - States the no-logs policy
 *  - Only shown once (stored in AsyncStorage)
 */
export function VpnConsentDialog({ visible, onAccept, onDecline }: Props) {
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const content = (
    <Animated.View
      style={[
        styles.sheet,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.handle} />

      {/* Icon */}
      <View style={styles.iconCircle}>
        <Ionicons name="shield-checkmark" size={38} color="#FFD700" />
      </View>

      <Text style={styles.title}>VPN Permission Required</Text>
      <Text style={styles.subtitle}>
        Before connecting, please read how Elite Net protects your privacy.
      </Text>

      {/* Disclosure points — required by Google Play policy */}
      <View style={styles.pointsContainer}>
        <DisclosurePoint
          icon="lock-closed"
          title="Encrypted Tunnel"
          body="Elite Net uses Android's VpnService API to create a secure, encrypted tunnel for all your internet traffic."
        />
        <DisclosurePoint
          icon="eye-off"
          title="No Logs Policy"
          body="We do not log, record, or share your browsing activity, IP address, or personal data. Ever."
        />
        <DisclosurePoint
          icon="server"
          title="Traffic Routing"
          body="Your data is routed through our secure servers to protect you from hackers, especially on public Wi-Fi."
        />
        <DisclosurePoint
          icon="phone-portrait"
          title="Device Traffic"
          body="The VPN service runs in the background as a foreground service, which appears in your notification bar while connected."
        />
      </View>

      {/* Privacy Policy link */}
      <TouchableOpacity
        style={styles.privacyLink}
        onPress={() => Linking.openURL(PRIVACY_URL)}
        activeOpacity={0.7}
      >
        <Ionicons name="document-text-outline" size={14} color="#FFD700" />
        <Text style={styles.privacyLinkText}>Read our full Privacy Policy</Text>
        <Ionicons name="open-outline" size={13} color="rgba(255,215,0,0.6)" />
      </TouchableOpacity>

      {/* Actions */}
      <TouchableOpacity
        style={styles.acceptBtn}
        onPress={onAccept}
        activeOpacity={0.87}
      >
        <Ionicons name="checkmark-circle" size={18} color="#000" />
        <Text style={styles.acceptText}>I Understand — Enable VPN</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.declineBtn}
        onPress={onDecline}
        activeOpacity={0.7}
      >
        <Text style={styles.declineText}>Decline</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      {Platform.OS === "ios" ? (
        <BlurView intensity={25} tint="dark" style={styles.overlay}>
          {content}
        </BlurView>
      ) : (
        <View style={[styles.overlay, styles.androidOverlay]}>
          {content}
        </View>
      )}
    </Modal>
  );
}

function DisclosurePoint({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.point}>
      <View style={styles.pointIcon}>
        <Ionicons name={icon} size={16} color="#FFD700" />
      </View>
      <View style={styles.pointText}>
        <Text style={styles.pointTitle}>{title}</Text>
        <Text style={styles.pointBody}>{body}</Text>
      </View>
    </View>
  );
}

/** Call this on app start to check if the user has already consented */
export async function hasVpnConsent(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(CONSENT_KEY);
    return val === "accepted";
  } catch {
    return false;
  }
}

/** Persist consent so the dialog only shows once */
export async function saveVpnConsent(): Promise<void> {
  await AsyncStorage.setItem(CONSENT_KEY, "accepted");
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  androidOverlay: {
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  sheet: {
    backgroundColor: "#0A0A0A",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
    paddingBottom: Platform.OS === "ios" ? 48 : 36,
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
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,215,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 18,
  },
  title: {
    color: "#FFD700",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(240,248,255,0.5)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 22,
  },
  pointsContainer: {
    gap: 14,
    marginBottom: 20,
  },
  point: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  pointIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,215,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  pointText: {
    flex: 1,
  },
  pointTitle: {
    color: "rgba(240,248,255,0.85)",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  pointBody: {
    color: "rgba(240,248,255,0.4)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  privacyLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    marginBottom: 22,
    paddingVertical: 4,
  },
  privacyLinkText: {
    color: "#FFD700",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textDecorationLine: "underline",
  },
  acceptBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FFD700",
    paddingVertical: 16,
    borderRadius: 50,
    marginBottom: 12,
  },
  acceptText: {
    color: "#000",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  declineBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  declineText: {
    color: "rgba(240,248,255,0.3)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
