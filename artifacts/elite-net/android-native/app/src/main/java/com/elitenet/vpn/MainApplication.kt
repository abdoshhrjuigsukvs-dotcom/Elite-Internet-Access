package com.elitenet.vpn

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import com.unity3d.ads.UnityAds

/**
 * Elite Net — MainApplication
 *
 * Copy this file to:  android/app/src/main/java/com/elitenet/vpn/MainApplication.kt
 * replacing the Expo-generated one.
 *
 * Changes from the Expo default:
 *  1. UnityAdsPackage and EliteVpnPackage registered in getPackages()
 *  2. Unity Ads SDK initialized at app startup (Game ID: 60907)
 */
class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                    // ── Native modules ──────────────────────────────────
                    add(UnityAdsPackage())   // Unity Ads (Game ID 60907)
                    add(EliteVpnPackage())   // V2RayCore VPN controls
                }

            override fun getJSMainModuleName(): String = "index"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean  = BuildConfig.IS_HERMES_ENABLED
        }

    override val reactHost: ReactHost
        get() = getDefaultReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, false)

        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            load()
        }

        // ── Unity Ads SDK Initialization ─────────────────────────────────────
        // Game ID: 60907  |  testMode: false (set true during dev/testing)
        UnityAds.initialize(
            this,
            "60907",
            false,
            null    // IUnityAdsInitializationListener — handled per-module
        )
    }
}
