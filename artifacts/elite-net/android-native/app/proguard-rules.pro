# ─── Elite Net — ProGuard / R8 Obfuscation Rules ────────────────────────────
#
# These rules apply to the Release APK and AAB.
# R8 full mode (enabled in gradle.properties) gives maximum obfuscation:
#  - All class names → a, b, c, ...
#  - All method names → a, b, c, ...
#  - All field names → a, b, c, ...
# Anyone who decompiles the APK will see unreadable bytecode.
#
# Rules here KEEP things that must NOT be renamed (SDK entry points, etc.)
# Everything else is aggressively obfuscated.

# ── React Native ─────────────────────────────────────────────────────────────
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.**   { *; }
-dontwarn com.facebook.**

# ── Elite Net native modules (RN bridge — names must match JS side) ──────────
-keep class com.elitenet.vpn.UnityAdsModule  { *; }
-keep class com.elitenet.vpn.UnityAdsPackage { *; }
-keep class com.elitenet.vpn.EliteVpnModule  { *; }
-keep class com.elitenet.vpn.EliteVpnPackage { *; }
# Service and receiver classes must keep their names (Android system uses them)
-keep class com.elitenet.vpn.V2RayVpnService                { *; }
-keep class com.elitenet.vpn.EliteFirebaseMessagingService   { *; }
-keep class com.elitenet.vpn.MainApplication                 { *; }

# ── V2RayCore ────────────────────────────────────────────────────────────────
-keep class v2raycore.**  { *; }
-keep class com.v2ray.**  { *; }
-dontwarn v2raycore.**
-dontwarn com.v2ray.**

# ── Unity Ads ────────────────────────────────────────────────────────────────
-keep class com.unity3d.ads.**      { *; }
-keep class com.unity3d.services.** { *; }
-dontwarn com.unity3d.**

# ── Firebase ─────────────────────────────────────────────────────────────────
-keep class com.google.firebase.**    { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# ── Kotlin ───────────────────────────────────────────────────────────────────
-keep class kotlin.**              { *; }
-keep class kotlinx.**             { *; }
-keepclassmembers class kotlin.Metadata { *; }
-dontwarn kotlin.**

# ── Android system components ────────────────────────────────────────────────
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.app.Application

# ── Suppress common warnings from third-party SDKs ──────────────────────────
-dontwarn org.bouncycastle.**
-dontwarn org.conscrypt.**
-dontwarn org.openjsse.**
-dontwarn javax.annotation.**
-dontwarn sun.misc.Unsafe

# ── Obfuscation settings ─────────────────────────────────────────────────────
# Rename packages too (maximum stealth)
-repackageclasses "x"
-allowaccessmodification
-overloadaggressively
