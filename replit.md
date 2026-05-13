# Elite Net

A futuristic, ultra-premium VPN app UI for mobile (Expo/React Native) with a 2-hour daily free internet limit, ad-gate system, and glassmorphism design.

## Run & Operate

- `pnpm --filter @workspace/elite-net run dev` — run the Expo mobile app
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- Scan the QR code from the Expo workflow to preview on a real device via Expo Go

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo SDK 54, React Native, Expo Router
- API: Express 5
- Animations: react-native-reanimated, Animated API
- SVG: react-native-svg (circular timer ring)
- Storage: AsyncStorage (daily usage persistence)

## Where things live

- `artifacts/elite-net/` — Expo mobile app
  - `app/(tabs)/index.tsx` — Main VPN screen
  - `app/privacy.tsx` — Privacy Policy screen
  - `contexts/VpnContext.tsx` — All VPN state and timer logic
  - `components/EnergyCore.tsx` — Animated 3D connection button
  - `components/TimerRing.tsx` — SVG circular progress timer
  - `components/ParticleField.tsx` — Floating gold particle background
  - `components/AdGateModal.tsx` — Ad gate bottom sheet modal
  - `components/GlassCard.tsx` — Glassmorphism card component
  - `constants/colors.ts` — Design tokens (black + digital gold palette)

## Architecture decisions

- Frontend-only app using AsyncStorage for daily session persistence (no backend needed)
- VPN state machine: idle → ad-gate → watching-ad → connecting → connected → time-up
- AdSource tracking ('gate' | 'booster' | 'periodic') to handle 3 different ad scenarios
- Particle field uses static data generated at module-load time to avoid re-renders
- Timer and periodic-ad countdown both live in VpnContext to keep state co-located

## Product

Elite Net is a mobile VPN app that grants 2 hours of free internet per day. Users must watch 3 ads (via Unity Ads Game ID 60907) to unlock their connection. Every 15 minutes a periodic ad triggers. Users can extend their session by 30 minutes by watching 5 additional ads.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Full-device VPN (V2RayCore), Unity Ads SDK, and Android Foreground Service require native Android modules — not available in Expo Go. These need a native Android build.
- Firebase FCM for push notifications also requires native setup with google-services.json.
- `useNativeDriver: true` is not supported on web — expected warning, doesn't affect native.
- Privacy Policy URL: https://sites.google.com/view/elite-loot-policy/

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
