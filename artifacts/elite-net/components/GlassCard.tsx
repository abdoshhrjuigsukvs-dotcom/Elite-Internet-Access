import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export function GlassCard({
  children,
  style,
  intensity = 10,
}: GlassCardProps) {
  if (Platform.OS === "ios") {
    return (
      <BlurView intensity={intensity} tint="dark" style={[styles.card, style]}>
        <View style={styles.border}>{children}</View>
      </BlurView>
    );
  }
  return (
    <View style={[styles.card, styles.androidCard, style]}>
      <View style={styles.border}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
  },
  androidCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  border: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.18)",
    padding: 16,
  },
});
