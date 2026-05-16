package com.elitenet.vpn

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

/**
 * Elite Net — Boot Receiver
 *
 * Restarts the VPN service automatically after the device reboots,
 * so users don't need to manually reconnect every time they restart their phone.
 *
 * Triggers on:
 *   BOOT_COMPLETED        — normal reboot
 *   MY_PACKAGE_REPLACED   — app update installed
 *
 * Declared in AndroidManifest.xml with android:exported="true"
 * (required for BOOT_COMPLETED on Android 12 / API 31+).
 *
 * The VPN will only restart if the user had previously connected and
 * granted VPN permission. V2RayVpnService handles the permission check.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return

        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED
        ) {
            val vpnIntent = Intent(context, V2RayVpnService::class.java).apply {
                this.action = V2RayVpnService.ACTION_START
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(vpnIntent)
            } else {
                context.startService(vpnIntent)
            }
        }
    }
}
