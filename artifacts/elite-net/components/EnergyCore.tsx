import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Phase } from "@/contexts/VpnContext";

interface EnergyCoreProps {
  phase: Phase;
  onPress: () => void;
}

const CORE_SIZE = 140;
const RING1 = CORE_SIZE + 30;
const RING2 = CORE_SIZE + 60;
const RING3 = CORE_SIZE + 95;

export function EnergyCore({ phase, onPress }: EnergyCoreProps) {
  const isConnected = phase === "connected";
  const isConnecting = phase === "connecting";

  const pulseScale = useRef(new Animated.Value(1)).current;
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const ring2Scale = useRef(new Animated.Value(1)).current;
  const ring3Scale = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0.12)).current;
  const ring2Opacity = useRef(new Animated.Value(0.07)).current;
  const ring3Opacity = useRef(new Animated.Value(0.04)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const connectingRotation = useRef(new Animated.Value(0)).current;

  const connectingLoop = useRef<Animated.CompositeAnimation | null>(null);
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isConnecting) {
      connectingLoop.current = Animated.loop(
        Animated.timing(connectingRotation, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      );
      connectingLoop.current.start();
      Animated.timing(glowOpacity, {
        toValue: 0.5,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } else {
      if (connectingLoop.current) {
        connectingLoop.current.stop();
        connectingLoop.current = null;
      }
      connectingRotation.setValue(0);
    }
  }, [isConnecting]);

  useEffect(() => {
    if (isConnected) {
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.04,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.current.start();

      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ring1Scale, {
              toValue: 1.15,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(ring1Opacity, {
              toValue: 0.35,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(ring1Scale, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(ring1Opacity, {
              toValue: 0.12,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(700),
          Animated.parallel([
            Animated.timing(ring2Scale, {
              toValue: 1.18,
              duration: 2200,
              useNativeDriver: true,
            }),
            Animated.timing(ring2Opacity, {
              toValue: 0.22,
              duration: 1100,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(ring2Scale, {
              toValue: 1,
              duration: 2200,
              useNativeDriver: true,
            }),
            Animated.timing(ring2Opacity, {
              toValue: 0.07,
              duration: 1100,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(1400),
          Animated.parallel([
            Animated.timing(ring3Scale, {
              toValue: 1.22,
              duration: 2500,
              useNativeDriver: true,
            }),
            Animated.timing(ring3Opacity, {
              toValue: 0.12,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(ring3Scale, {
              toValue: 1,
              duration: 2500,
              useNativeDriver: true,
            }),
            Animated.timing(ring3Opacity, {
              toValue: 0.04,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    } else if (!isConnecting) {
      if (pulseLoop.current) {
        pulseLoop.current.stop();
        pulseLoop.current = null;
      }
      Animated.parallel([
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(ring1Scale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(ring1Opacity, {
          toValue: 0.12,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(ring2Scale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(ring2Opacity, {
          toValue: 0.07,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(ring3Scale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(ring3Opacity, {
          toValue: 0.04,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isConnected]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const spin = connectingRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const iconName = isConnected ? "power" : isConnecting ? "reload" : "power";
  const iconColor = isConnected
    ? "#000000"
    : isConnecting
      ? "#FFD700"
      : "rgba(255,215,0,0.7)";

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.ring,
          {
            width: RING3,
            height: RING3,
            borderRadius: RING3 / 2,
            borderColor: "#FFD700",
            opacity: ring3Opacity,
            transform: [{ scale: ring3Scale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          {
            width: RING2,
            height: RING2,
            borderRadius: RING2 / 2,
            borderColor: "#FFD700",
            opacity: ring2Opacity,
            transform: [{ scale: ring2Scale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          {
            width: RING1,
            height: RING1,
            borderRadius: RING1 / 2,
            borderColor: "#FFD700",
            opacity: ring1Opacity,
            transform: [{ scale: ring1Scale }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.glow,
          {
            width: CORE_SIZE + 40,
            height: CORE_SIZE + 40,
            borderRadius: (CORE_SIZE + 40) / 2,
            opacity: glowOpacity,
          },
        ]}
      />

      <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.85}
          style={[
            styles.core,
            {
              backgroundColor: isConnected
                ? "#FFD700"
                : "rgba(255,215,0,0.08)",
              borderColor: isConnected
                ? "#FFD700"
                : isConnecting
                  ? "rgba(255,215,0,0.6)"
                  : "rgba(255,215,0,0.3)",
            },
          ]}
        >
          <Animated.View
            style={
              isConnecting ? { transform: [{ rotate: spin }] } : undefined
            }
          >
            <Ionicons name={iconName} size={48} color={iconColor} />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: RING3,
    height: RING3,
  },
  ring: {
    position: "absolute",
    borderWidth: 1,
  },
  glow: {
    position: "absolute",
    backgroundColor: "rgba(255, 215, 0, 0.18)",
  },
  core: {
    width: CORE_SIZE,
    height: CORE_SIZE,
    borderRadius: CORE_SIZE / 2,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
