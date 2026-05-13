package com.elitenet.vpn

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * Elite Net — Firebase Cloud Messaging Service
 *
 * Handles incoming FCM push notifications (daily reminder, session expiry, custom admin blasts).
 * Also sends the FCM token to the Elite Net API server on first launch / token refresh.
 *
 * The server-side scheduler sends the daily 9 AM Cairo notification automatically.
 * This service ensures notifications are displayed even when the app is in the background.
 */
class EliteFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        // ── POST the FCM token to your Elite Net API server ──────────────────
        // Replace with your Replit deployed API URL or custom domain
        private const val API_BASE_URL = "https://YOUR_REPLIT_DOMAIN/api"
        // ────────────────────────────────────────────────────────────────────

        const val CHANNEL_REMINDERS = "elite-net-reminders"
        const val CHANNEL_ALERTS    = "elite-net-alerts"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    /**
     * Called when FCM delivers a message to this device.
     * Works both when the app is in the foreground and the background.
     */
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        val title = remoteMessage.notification?.title ?: remoteMessage.data["title"] ?: "Elite Net"
        val body  = remoteMessage.notification?.body  ?: remoteMessage.data["body"]  ?: ""
        val channelId = remoteMessage.data["channelId"] ?: CHANNEL_REMINDERS

        showNotification(title, body, channelId)
    }

    /**
     * Called when the FCM token is created or refreshed.
     * Register the new token with the Elite Net API server so it can send push notifications.
     */
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        registerTokenWithServer(token)
    }

    private fun registerTokenWithServer(token: String) {
        Thread {
            try {
                val url = java.net.URL("$API_BASE_URL/notifications/register")
                val conn = url.openConnection() as java.net.HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true
                conn.connectTimeout = 10_000
                conn.readTimeout    = 10_000

                val body = """{"token":"$token","platform":"android"}"""
                conn.outputStream.write(body.toByteArray())
                conn.outputStream.flush()

                val code = conn.responseCode
                if (code != 200) {
                    android.util.Log.w("EliteFCM", "Token registration returned $code")
                }
                conn.disconnect()
            } catch (e: Exception) {
                android.util.Log.e("EliteFCM", "Failed to register FCM token", e)
            }
        }.start()
    }

    private fun showNotification(title: String, body: String, channelId: String) {
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager

        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .build()

        nm.notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager

            nm.createNotificationChannel(
                NotificationChannel(
                    CHANNEL_REMINDERS,
                    "Daily Reminders",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply { description = "Daily free session reminder at 9 AM Cairo" }
            )

            nm.createNotificationChannel(
                NotificationChannel(
                    CHANNEL_ALERTS,
                    "Session Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply { description = "Session expiry and connection alerts" }
            )
        }
    }
}
