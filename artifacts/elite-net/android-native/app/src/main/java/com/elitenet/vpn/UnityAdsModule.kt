package com.elitenet.vpn

import android.app.Activity
import com.facebook.react.bridge.*
import com.unity3d.ads.IUnityAdsInitializationListener
import com.unity3d.ads.IUnityAdsLoadListener
import com.unity3d.ads.IUnityAdsShowListener
import com.unity3d.ads.UnityAds
import com.unity3d.ads.UnityAdsShowOptions

/**
 * Elite Net — Unity Ads Native Module
 *
 * Bridges Unity Ads SDK (Game ID: 60907) to React Native.
 *
 * Exposed methods (call from JS via NativeModules.UnityAdsModule):
 *   initialize()            — call once at app start
 *   showGateAd(promise)     — show interstitial; resolves true when COMPLETED
 *   showBoosterAd(promise)  — show rewarded ad; resolves true when COMPLETED
 *
 * Placement IDs:
 *   "Interstitial_Android"  — used for the 3-ad gate and 15-min periodic ads
 *   "Rewarded_Android"      — used for the +30 min booster (5 ads)
 *
 * HOW TO SET UP:
 *  1. Add to android/app/build.gradle:
 *       implementation 'com.unity3d.ads:unity-ads:4.9.2'
 *  2. Register UnityAdsPackage in MainApplication.kt (see UnityAdsPackage.kt)
 *  3. Call NativeModules.UnityAdsModule.initialize() in your React Native app once.
 */
class UnityAdsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val GAME_ID              = "60907"
        const val INTERSTITIAL_PLACEMENT = "Interstitial_Android"
        const val REWARDED_PLACEMENT     = "Rewarded_Android"
    }

    private var isInitialized = false

    override fun getName(): String = "UnityAdsModule"

    // ─── initialize ─────────────────────────────────────────────────────────

    @ReactMethod
    fun initialize(promise: Promise) {
        val activity = currentActivity ?: run {
            promise.reject("NO_ACTIVITY", "No activity available")
            return
        }

        if (isInitialized) {
            promise.resolve(true)
            return
        }

        UnityAds.initialize(
            activity,
            GAME_ID,
            false,  // testMode — set to true during development
            object : IUnityAdsInitializationListener {
                override fun onInitializationComplete() {
                    isInitialized = true
                    promise.resolve(true)
                }
                override fun onInitializationFailed(
                    error: UnityAds.UnityAdsInitializationError,
                    message: String
                ) {
                    promise.reject("INIT_FAILED", message)
                }
            }
        )
    }

    // ─── showGateAd (Interstitial) ──────────────────────────────────────────
    // Used for: 3-ad gate to connect, 15-min periodic ad

    @ReactMethod
    fun showGateAd(promise: Promise) {
        showAd(INTERSTITIAL_PLACEMENT, promise)
    }

    // ─── showBoosterAd (Rewarded) ───────────────────────────────────────────
    // Used for: 5-ad booster that adds +30 minutes

    @ReactMethod
    fun showBoosterAd(promise: Promise) {
        showAd(REWARDED_PLACEMENT, promise)
    }

    // ─── internal ───────────────────────────────────────────────────────────

    private fun showAd(placementId: String, promise: Promise) {
        if (!isInitialized) {
            promise.reject("NOT_INITIALIZED", "Call initialize() first")
            return
        }

        val activity: Activity = currentActivity ?: run {
            promise.reject("NO_ACTIVITY", "No activity available")
            return
        }

        // Load the ad first, then show when ready
        UnityAds.load(placementId, object : IUnityAdsLoadListener {
            override fun onUnityAdsAdLoaded(placementId: String) {
                UnityAds.show(
                    activity,
                    placementId,
                    UnityAdsShowOptions(),
                    object : IUnityAdsShowListener {
                        override fun onUnityAdsShowComplete(
                            placementId: String,
                            state: UnityAds.UnityAdsShowCompletionState
                        ) {
                            if (state == UnityAds.UnityAdsShowCompletionState.COMPLETED) {
                                promise.resolve(true)   // user watched the full ad
                            } else {
                                promise.reject("AD_SKIPPED", "User skipped the ad")
                            }
                        }

                        override fun onUnityAdsShowFailure(
                            placementId: String,
                            error: UnityAds.UnityAdsShowError,
                            message: String
                        ) {
                            promise.reject("SHOW_FAILED", message)
                        }

                        override fun onUnityAdsShowStart(placementId: String) {}
                        override fun onUnityAdsShowClick(placementId: String) {}
                    }
                )
            }

            override fun onUnityAdsFailedToLoad(
                placementId: String,
                error: UnityAds.UnityAdsLoadError,
                message: String
            ) {
                promise.reject("LOAD_FAILED", message)
            }
        })
    }
}
