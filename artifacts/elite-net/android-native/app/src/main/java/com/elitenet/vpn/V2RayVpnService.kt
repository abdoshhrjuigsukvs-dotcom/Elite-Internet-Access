package com.elitenet.vpn

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import androidx.core.app.NotificationCompat
import java.io.FileInputStream
import java.io.FileOutputStream

/**
 * Elite Net VPN Service
 *
 * This service:
 * 1. Requests Android VPN permission and establishes the TUN interface.
 * 2. Starts V2RayCore in a background thread, passing in the VMess/VLESS JSON config.
 * 3. Routes ALL device traffic through the local SOCKS5 proxy that V2RayCore opens (port 10808).
 * 4. Runs as a Foreground Service so Android cannot kill it during an active session.
 *
 * HOW TO USE:
 *  - Place v2ray-core.aar in android/app/libs/
 *  - Build the project: ./gradlew assembleRelease
 *  - The UnityAdsModule bridges to JS; when an ad completes, JS calls NativeModules.EliteVpn.start()
 *
 * IMPORTANT:
 *  - Replace SERVER_HOST, SERVER_PORT, UUID, and ALTID with your actual VMess server credentials.
 *  - For VLESS/Trojan, swap the buildV2RayConfig() body accordingly.
 */
class V2RayVpnService : VpnService() {

    companion object {
        const val ACTION_START = "com.elitenet.vpn.START"
        const val ACTION_STOP  = "com.elitenet.vpn.STOP"

        const val CHANNEL_ID      = "elite-net-vpn"
        const val NOTIFICATION_ID = 1001

        // ── Server credentials ─────────────────────────────────────────
        // Replace these with your actual VPN server details
        private const val SERVER_HOST = "YOUR_SERVER_IP_OR_DOMAIN"
        private const val SERVER_PORT = 443
        private const val UUID        = "YOUR-VMESS-UUID-HERE"
        private const val ALTID       = 0
        private const val SECURITY    = "auto"
        private const val NETWORK     = "ws"
        private const val WS_PATH     = "/elite"
        // ──────────────────────────────────────────────────────────────
    }

    private var vpnInterface: ParcelFileDescriptor? = null
    private var v2rayThread: Thread? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopVpn()
                return START_NOT_STICKY
            }
            else -> startVpn()
        }
        return START_STICKY
    }

    private fun startVpn() {
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())

        // Build the TUN interface — routes ALL IPv4 traffic through the VPN
        val builder = Builder()
            .setSession("Elite Net")
            .addAddress("10.0.0.2", 32)
            .addDnsServer("8.8.8.8")
            .addDnsServer("8.8.4.4")
            .addRoute("0.0.0.0", 0)         // route ALL traffic
            .setMtu(1500)
            .setBlocking(false)

        // Exclude the app itself so it can reach its own server
        builder.addDisallowedApplication(packageName)

        vpnInterface = builder.establish() ?: run {
            stopSelf()
            return
        }

        // Start V2RayCore in a background thread
        v2rayThread = Thread {
            runV2Ray()
        }.also { it.start() }
    }

    /**
     * Initialise and run V2RayCore.
     *
     * v2raycore.startV2Ray() is the entry-point exposed by the v2ray-core.aar library.
     * It takes:
     *   - configJson : the full V2Ray JSON configuration as a String
     *   - fd         : the TUN file descriptor so V2Ray can send/receive raw packets
     *
     * After V2RayCore starts it listens on 127.0.0.1:10808 (SOCKS5).
     * Android forwards all TUN packets to that port automatically via the VpnService routing.
     */
    private fun runV2Ray() {
        try {
            val config = buildV2RayConfig()
            val fd = vpnInterface?.fd ?: return

            // v2raycore is the package exposed by v2ray-core.aar
            // Uncomment once you have added the AAR:
            //
            // v2raycore.V2Ray.startV2Ray(config, fd)
            //
            // For testing without the AAR, we just loop until stopped:
            while (!Thread.currentThread().isInterrupted) {
                Thread.sleep(1000)
            }
        } catch (_: InterruptedException) {
            // service stopped
        } catch (e: Exception) {
            e.printStackTrace()
            stopSelf()
        }
    }

    /**
     * Returns the V2Ray JSON config for a VMess-over-WebSocket connection.
     * Swap this body for VLESS / Trojan / Shadowsocks as needed.
     */
    private fun buildV2RayConfig(): String = """
    {
      "log": { "loglevel": "warning" },
      "inbounds": [
        {
          "port": 10808,
          "protocol": "socks",
          "settings": { "udp": true },
          "sniffing": {
            "enabled": true,
            "destOverride": ["http", "tls"]
          }
        }
      ],
      "outbounds": [
        {
          "protocol": "vmess",
          "settings": {
            "vnext": [{
              "address": "$SERVER_HOST",
              "port": $SERVER_PORT,
              "users": [{
                "id": "$UUID",
                "alterId": $ALTID,
                "security": "$SECURITY"
              }]
            }]
          },
          "streamSettings": {
            "network": "$NETWORK",
            "wsSettings": {
              "path": "$WS_PATH",
              "headers": { "Host": "$SERVER_HOST" }
            },
            "tlsSettings": { "serverName": "$SERVER_HOST" },
            "security": "tls"
          }
        },
        {
          "protocol": "freedom",
          "tag": "direct",
          "settings": {}
        }
      ],
      "routing": {
        "strategy": "rules",
        "rules": [
          {
            "type": "field",
            "ip": ["geoip:private"],
            "outboundTag": "direct"
          }
        ]
      }
    }
    """.trimIndent()

    private fun stopVpn() {
        v2rayThread?.interrupt()
        v2rayThread = null
        vpnInterface?.close()
        vpnInterface = null
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopVpn()
    }

    // ─── Notification ───────────────────────────────────────────────────────

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Elite Net VPN",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "VPN connection status"
            }
            getSystemService(NotificationManager::class.java)
                .createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val stopIntent = PendingIntent.getService(
            this, 0,
            Intent(this, V2RayVpnService::class.java).apply { action = ACTION_STOP },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Elite Net — Connected")
            .setContentText("Your connection is encrypted and private")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Disconnect", stopIntent)
            .build()
    }
}
