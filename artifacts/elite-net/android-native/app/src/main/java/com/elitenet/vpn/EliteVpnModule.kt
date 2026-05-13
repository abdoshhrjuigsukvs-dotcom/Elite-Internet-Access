package com.elitenet.vpn

import android.content.Intent
import android.net.VpnService
import com.facebook.react.bridge.*

/**
 * Elite Net VPN Native Module
 *
 * Exposed to React Native as NativeModules.EliteVpn:
 *   requestPermissionAndStart() — requests VPN permission, then starts V2RayVpnService
 *   stop()                      — stops the VPN service
 *
 * React Native usage example (call after Unity ad completes):
 *
 *   import { NativeModules } from 'react-native';
 *   const { EliteVpn } = NativeModules;
 *
 *   await EliteVpn.requestPermissionAndStart(); // starts VPN
 *   await EliteVpn.stop();                      // stops VPN
 *
 * Register EliteVpnPackage in MainApplication.kt.
 */
class EliteVpnModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var vpnPermissionPromise: Promise? = null

    companion object {
        private const val VPN_PERMISSION_REQUEST = 1337
    }

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String = "EliteVpn"

    @ReactMethod
    fun requestPermissionAndStart(promise: Promise) {
        val activity = currentActivity ?: run {
            promise.reject("NO_ACTIVITY", "No activity")
            return
        }

        val vpnIntent = VpnService.prepare(activity)
        if (vpnIntent == null) {
            // Permission already granted — start immediately
            startService()
            promise.resolve(true)
        } else {
            // Ask user for VPN permission
            vpnPermissionPromise = promise
            activity.startActivityForResult(vpnIntent, VPN_PERMISSION_REQUEST)
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        val intent = Intent(reactContext, V2RayVpnService::class.java).apply {
            action = V2RayVpnService.ACTION_STOP
        }
        reactContext.startService(intent)
        promise.resolve(true)
    }

    private fun startService() {
        val intent = Intent(reactContext, V2RayVpnService::class.java).apply {
            action = V2RayVpnService.ACTION_START
        }
        reactContext.startForegroundService(intent)
    }

    override fun onActivityResult(
        activity: android.app.Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
    ) {
        if (requestCode == VPN_PERMISSION_REQUEST) {
            if (resultCode == android.app.Activity.RESULT_OK) {
                startService()
                vpnPermissionPromise?.resolve(true)
            } else {
                vpnPermissionPromise?.reject("PERMISSION_DENIED", "VPN permission denied by user")
            }
            vpnPermissionPromise = null
        }
    }

    override fun onNewIntent(intent: Intent?) {}
}
