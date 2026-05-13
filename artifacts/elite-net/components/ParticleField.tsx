import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width: W, height: H } = Dimensions.get("window");
const COUNT = 22;

interface ParticleData {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  targetOpacity: number;
  dxTarget: number;
  dyTarget: number;
}

function makeParticles(): ParticleData[] {
  return Array.from({ length: COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * W,
    y: Math.random() * H,
    size: Math.random() * 2.5 + 0.8,
    duration: Math.random() * 9000 + 7000,
    delay: Math.random() * 6000,
    targetOpacity: Math.random() * 0.55 + 0.15,
    dxTarget: (Math.random() - 0.5) * 80,
    dyTarget: (Math.random() - 0.5) * 120,
  }));
}

const PARTICLES = makeParticles();

function Particle({ p }: { p: ParticleData }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: p.targetOpacity,
              duration: 2500,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: p.targetOpacity * 0.4,
              duration: p.duration - 3500,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(ty, {
            toValue: p.dyTarget,
            duration: p.duration,
            useNativeDriver: true,
          }),
          Animated.timing(tx, {
            toValue: p.dxTarget,
            duration: p.duration,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: p.x,
          top: p.y,
          width: p.size,
          height: p.size,
          borderRadius: p.size / 2,
          opacity,
          transform: [{ translateX: tx }, { translateY: ty }],
        },
      ]}
    />
  );
}

export function ParticleField() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PARTICLES.map((p) => (
        <Particle key={p.id} p={p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: "absolute",
    backgroundColor: "#FFD700",
  },
});
