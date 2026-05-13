# Elite Net — Native Android Build Instructions

All native source files in this `android-native/` folder are **ready to copy** into
the Expo prebuild output. Follow the steps below in order.

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Android Studio | Hedgehog or newer | developer.android.com/studio |
| JDK | 17 | included with Android Studio |
| Android SDK | API 34 | SDK Manager inside Android Studio |
| NDK | 26.1.x | SDK Manager → SDK Tools → NDK (Side by side) |
| Node.js | 20+ | nodejs.org |
| pnpm | 9+ | `npm i -g pnpm` |

---

## Step 1 — Download V2RayCore AAR

1. Go to: https://github.com/2dust/v2rayNG/releases
2. Download `v2ray-core.aar` from the latest release assets
3. Save it — you will place it at `android/app/libs/v2ray-core.aar` in Step 3

---

## Step 2 — Get Firebase `google-services.json`

1. Open Firebase Console: https://console.firebase.google.com
2. Select project **elite-loot**
3. Project Settings → Your apps → Add app → Android
4. Package name: `com.elitenet.vpn`
5. Download `google-services.json`
6. Save it — you will place it at `android/app/google-services.json` in Step 3

---

## Step 3 — Run Expo Prebuild

```bash
# In the project root (where pnpm-workspace.yaml lives):
cd artifacts/elite-net
npx expo prebuild --platform android --clean
```

This generates the `android/` folder. Now copy the prepared native files:

```bash
# Copy all prepared Kotlin source files
cp -r android-native/app/src/main/java/com/elitenet/vpn/ \
      android/app/src/main/java/com/elitenet/vpn/

# Copy build configs (MERGE — do not fully replace, see notes below)
# See Step 4 for merge instructions

# Place the V2RayCore AAR
mkdir -p android/app/libs
cp /path/to/v2ray-core.aar android/app/libs/v2ray-core.aar

# Place Firebase config
cp /path/to/google-services.json android/app/google-services.json

# Copy ProGuard rules
cp android-native/app/proguard-rules.pro android/app/proguard-rules.pro
```

---

## Step 4 — Merge build.gradle Files

### android/build.gradle (project level)
Add inside `buildscript.dependencies`:
```gradle
classpath("com.google.gms:google-services:4.4.0")
```
Add inside `allprojects.repositories`:
```gradle
maven { url "https://unityads.unity3d.com/ivysettings.xml" }
flatDir { dirs 'libs' }
```

### android/app/build.gradle (app level)
Add at the TOP (after existing apply plugin lines):
```gradle
apply plugin: "com.google.gms.google-services"
```
Add inside `android {}`:
```gradle
repositories {
    flatDir { dirs 'libs' }
}
signingConfigs {
    release {
        storeFile     file("elite-net-release.keystore")
        storePassword System.getenv("KEYSTORE_PASS") ?: "YOUR_PASSWORD"
        keyAlias      "elite-net"
        keyPassword   System.getenv("KEY_PASS")      ?: "YOUR_PASSWORD"
    }
}
```
In `buildTypes.release`, add:
```gradle
signingConfig signingConfigs.release
minifyEnabled true
shrinkResources true
proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
```
Add inside `dependencies {}`:
```gradle
implementation(name: 'v2ray-core', ext: 'aar')
implementation "androidx.core:core-ktx:1.12.0"
implementation "androidx.localbroadcastmanager:localbroadcastmanager:1.1.0"
implementation "com.unity3d.ads:unity-ads:4.9.2"
implementation platform("com.google.firebase:firebase-bom:32.7.0")
implementation "com.google.firebase:firebase-messaging-ktx"
implementation "com.google.firebase:firebase-analytics-ktx"
implementation "androidx.lifecycle:lifecycle-service:2.7.0"
implementation "androidx.work:work-runtime-ktx:2.9.0"
```

---

## Step 5 — Merge AndroidManifest.xml

In `android/app/src/main/AndroidManifest.xml`, add these inside `<application>`:

```xml
<!-- V2Ray VPN Service -->
<service
    android:name=".V2RayVpnService"
    android:permission="android.permission.BIND_VPN_SERVICE"
    android:exported="false"
    android:foregroundServiceType="connectedDevice">
    <intent-filter>
        <action android:name="android.net.VpnService" />
    </intent-filter>
</service>

<!-- Firebase Cloud Messaging -->
<service android:name=".EliteFirebaseMessagingService" android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
<meta-data android:name="com.google.firebase.messaging.default_notification_channel_id"
    android:value="elite-net-reminders" />
```

Add these `<uses-permission>` entries at the top level (inside `<manifest>`):
```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
```

---

## Step 6 — Update MainApplication.kt

Replace the Expo-generated `MainApplication.kt` with `android-native/app/src/main/java/com/elitenet/vpn/MainApplication.kt`.

It adds:
- `UnityAdsPackage()` and `EliteVpnPackage()` in `getPackages()`
- `UnityAds.initialize(this, "60907", false, null)` in `onCreate()`

---

## Step 7 — Add V2Ray Server Credentials

Edit `V2RayVpnService.kt` and fill in your actual server:

```kotlin
private const val SERVER_HOST = "vpn.your-domain.com"   // your server IP or domain
private const val SERVER_PORT = 443
private const val UUID        = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
private const val ALTID       = 0
private const val NETWORK     = "ws"
private const val WS_PATH     = "/elite"
```

Then uncomment the V2RayCore call in `runV2Ray()`:
```kotlin
v2raycore.V2Ray.startV2Ray(config, fd)
```

---

## Step 8 — Update FCM API URL

In `EliteFirebaseMessagingService.kt`, update the API URL:
```kotlin
private const val API_BASE_URL = "https://YOUR_REPLIT_DOMAIN/api"
// Example: "https://elite-net.yourusername.repl.co/api"
```

---

## Step 9 — Generate the Signing Keystore

```bash
cd android/app

keytool -genkey -v \
  -keystore elite-net-release.keystore \
  -alias elite-net \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Elite Net, OU=Mobile, O=EliteNet, L=Cairo, S=Cairo, C=EG"

# Enter a strong password when prompted — keep it safe!
# You will need this password every time you build a release APK.
```

---

## Step 10 — Build the Release APK

```bash
cd android

# Set signing credentials (or hard-code them in build.gradle for local builds)
export KEYSTORE_PASS="your_keystore_password"
export KEY_PASS="your_key_password"

# Build
./gradlew assembleRelease

# Output APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

The APK is automatically signed using your keystore — no manual zipalign/apksigner needed
when `signingConfig` is set in build.gradle.

---

## Step 11 — Test on a Real Device

```bash
# Install directly via USB (enable USB debugging on your phone):
adb install android/app/build/outputs/apk/release/app-release.apk
```

Check logcat for VPN and Unity Ads messages:
```bash
adb logcat | grep -E "EliteNet|V2Ray|UnityAds|EliteFCM"
```

---

## Step 12 — Google Play Store Upload

1. Open **Google Play Console** → Create App
2. App name: `Elite Net - Secure & Private VPN`
3. Upload `app-release.apk` (or build AAB with `./gradlew bundleRelease` for smaller size)
4. Complete store listing using the description in `STORE_LISTING.md`
5. Add privacy policy: `https://sites.google.com/view/elite-loot-policy/`
6. Set content rating — VPN apps need the "Tools" category
7. Submit for review (~3–7 days)

---

## Unity Ads Placement Setup (Dashboard)

1. Go to: https://dashboard.unityads.unity3d.com
2. Select Game ID: **60907**
3. Create two placements:
   - `Interstitial_Android` — Non-rewarded (for gate ads + periodic ads)
   - `Rewarded_Android` — Rewarded video (for +30 min booster)
4. Set the rewarded placement to "Can skip after" = **never** (force full watch)

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `v2ray-core.aar not found` | Check it's at `android/app/libs/v2ray-core.aar` and `flatDir` is in build.gradle |
| `Unity Ads LOAD_FAILED` | Ensure Game ID is `60907` and placements match exactly |
| `BIND_VPN_SERVICE` crash | User must grant VPN permission — `EliteVpnModule` handles the dialog |
| `FCM token not registered` | Confirm `google-services.json` is in `android/app/` and Firebase is initialized |
| Build fails with `:app:mergeReleaseResources` | Confirm `com.google.gms:google-services` plugin is applied |
