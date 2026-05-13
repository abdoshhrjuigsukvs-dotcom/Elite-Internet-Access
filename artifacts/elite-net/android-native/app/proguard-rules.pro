# ─── Elite Net ProGuard Rules ───────────────────────────────────────────────

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Elite Net native modules
-keep class com.elitenet.vpn.** { *; }

# V2RayCore — keep all classes in the AAR
-keep class v2raycore.** { *; }
-keep class com.v2ray.** { *; }
-dontwarn v2raycore.**
-dontwarn com.v2ray.**

# Unity Ads SDK
-keep class com.unity3d.ads.** { *; }
-keep class com.unity3d.services.** { *; }
-dontwarn com.unity3d.**

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**

# Kotlin
-keep class kotlin.** { *; }
-keepclassmembers class kotlin.Metadata { *; }
