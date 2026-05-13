import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, Filter, FeGaussianBlur } from "react-native-svg";

interface TimerRingProps {
  timeRemaining: number;
  totalTime: number;
  isConnected: boolean;
}

const RING_SIZE = 280;
const OUTER_RADIUS = 130;
const INNER_RADIUS = 122;
const STROKE = 3;
const CX = RING_SIZE / 2;
const CY = RING_SIZE / 2;
const OUTER_CIRC = 2 * Math.PI * OUTER_RADIUS;
const INNER_CIRC = 2 * Math.PI * INNER_RADIUS;

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TimerRing({
  timeRemaining,
  totalTime,
  isConnected,
}: TimerRingProps) {
  const progress = totalTime > 0 ? timeRemaining / totalTime : 0;
  const outerOffset = OUTER_CIRC * (1 - progress);
  const innerOffset = INNER_CIRC * (1 - progress);
  const color = isConnected ? "#FFD700" : "rgba(255,215,0,0.35)";
  const trackColor = "rgba(255,215,0,0.08)";

  return (
    <View style={styles.container}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Defs>
          <Filter id="glow">
            <FeGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          </Filter>
        </Defs>

        {/* Outer track */}
        <Circle
          cx={CX}
          cy={CY}
          r={OUTER_RADIUS}
          fill="none"
          stroke={trackColor}
          strokeWidth={STROKE}
        />
        {/* Inner track */}
        <Circle
          cx={CX}
          cy={CY}
          r={INNER_RADIUS}
          fill="none"
          stroke={trackColor}
          strokeWidth={1}
        />

        {/* Outer progress (glow layer) */}
        <Circle
          cx={CX}
          cy={CY}
          r={OUTER_RADIUS}
          fill="none"
          stroke="rgba(255,215,0,0.25)"
          strokeWidth={STROKE + 6}
          strokeDasharray={`${OUTER_CIRC}`}
          strokeDashoffset={outerOffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${CX}, ${CY})`}
        />

        {/* Outer progress */}
        <Circle
          cx={CX}
          cy={CY}
          r={OUTER_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeDasharray={`${OUTER_CIRC}`}
          strokeDashoffset={outerOffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${CX}, ${CY})`}
        />

        {/* Inner thin ring progress */}
        <Circle
          cx={CX}
          cy={CY}
          r={INNER_RADIUS}
          fill="none"
          stroke={isConnected ? "rgba(255,215,0,0.4)" : "rgba(255,215,0,0.1)"}
          strokeWidth={1}
          strokeDasharray={`${INNER_CIRC}`}
          strokeDashoffset={innerOffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${CX}, ${CY})`}
        />
      </Svg>

      {/* Center time display */}
      <View style={styles.centerContent} pointerEvents="box-none">
        <Text style={[styles.timeText, { color: isConnected ? "#FFD700" : "rgba(255,215,0,0.5)" }]}>
          {formatTime(timeRemaining)}
        </Text>
        <Text style={styles.labelText}>DAILY LIMIT</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: RING_SIZE,
    height: RING_SIZE,
  },
  centerContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    bottom: 32,
    left: 0,
    right: 0,
  },
  timeText: {
    fontSize: 42,
    fontFamily: "Inter_400Regular",
    letterSpacing: 3,
    includeFontPadding: false,
  },
  labelText: {
    fontSize: 10,
    color: "rgba(240,248,255,0.3)",
    fontFamily: "Inter_500Medium",
    letterSpacing: 4,
    marginTop: 4,
  },
});
