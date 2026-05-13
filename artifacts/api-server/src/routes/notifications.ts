import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

let firebaseAdmin: typeof import("firebase-admin") | null = null;
let adminApp: import("firebase-admin/app").App | null = null;

interface PushToken {
  token: string;
  platform: string;
  registeredAt: string;
}

const registeredTokens: Map<string, PushToken> = new Map();

interface NotificationConfig {
  dailyReminderTitle: string;
  dailyReminderMessage: string;
  sessionExpiryTitle: string;
  sessionExpiryMessage: string;
  scheduledTime: string;
  schedulerEnabled: boolean;
}

let notificationConfig: NotificationConfig = {
  dailyReminderTitle: "Elite Net",
  dailyReminderMessage:
    "ساعتين النت المجاني بتوعك جاهزين! ادخل فعلهم دلوقتي 🌐",
  sessionExpiryTitle: "Elite Net — Session Ended",
  sessionExpiryMessage:
    "Your 2-hour daily internet session has ended. Come back tomorrow for more free access.",
  scheduledTime: "09:00 Cairo (UTC+2) — 07:00 UTC",
  schedulerEnabled: true,
};

function getFirebaseMessaging() {
  const serviceAccountJson = process.env["FIREBASE_SERVICE_ACCOUNT"];
  if (!serviceAccountJson) return null;

  if (adminApp) {
    return (firebaseAdmin as typeof import("firebase-admin")).messaging();
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson) as Record<
      string,
      unknown
    >;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const admin = require("firebase-admin") as typeof import("firebase-admin");
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(
        serviceAccount as import("firebase-admin").ServiceAccount
      ),
    });
    firebaseAdmin = admin;
    return admin.messaging();
  } catch {
    return null;
  }
}

export async function sendDailyReminderToAll(): Promise<{
  sent: number;
  total: number;
}> {
  const messaging = getFirebaseMessaging();
  if (!messaging) return { sent: 0, total: 0 };

  const tokens = Array.from(registeredTokens.values()).map((t) => t.token);
  if (tokens.length === 0) return { sent: 0, total: 0 };

  let sent = 0;
  for (const token of tokens) {
    try {
      await messaging.send({
        token,
        notification: {
          title: notificationConfig.dailyReminderTitle,
          body: notificationConfig.dailyReminderMessage,
        },
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "elite-net-reminders",
          },
        },
      });
      sent++;
    } catch {
      // token may be stale — skip
    }
  }
  return { sent, total: tokens.length };
}

// ─── Routes ────────────────────────────────────────────────────────────────

router.get("/notifications/status", (_req: Request, res: Response) => {
  const hasFirebase = !!process.env["FIREBASE_SERVICE_ACCOUNT"];
  res.json({
    firebaseConfigured: hasFirebase,
    registeredDevices: registeredTokens.size,
    config: notificationConfig,
  });
});

router.post("/notifications/register", (req: Request, res: Response) => {
  const { token, platform } = req.body as {
    token?: string;
    platform?: string;
  };
  if (!token) {
    res.status(400).json({ error: "token is required" });
    return;
  }
  registeredTokens.set(token, {
    token,
    platform: platform ?? "unknown",
    registeredAt: new Date().toISOString(),
  });
  res.json({ success: true, registeredDevices: registeredTokens.size });
});

router.delete("/notifications/register", (req: Request, res: Response) => {
  const { token } = req.body as { token?: string };
  if (token) registeredTokens.delete(token);
  res.json({ success: true });
});

router.put("/notifications/config", (req: Request, res: Response) => {
  const body = req.body as Partial<NotificationConfig>;
  notificationConfig = { ...notificationConfig, ...body };
  res.json({ success: true, config: notificationConfig });
});

router.post(
  "/notifications/send-daily",
  async (_req: Request, res: Response) => {
    const messaging = getFirebaseMessaging();
    if (!messaging) {
      res.status(503).json({
        error:
          "Firebase not configured. Add FIREBASE_SERVICE_ACCOUNT secret to the server.",
      });
      return;
    }

    const tokens = Array.from(registeredTokens.values()).map((t) => t.token);
    if (tokens.length === 0) {
      res.status(400).json({ error: "No registered devices" });
      return;
    }

    const results: { token: string; success: boolean; error?: string }[] = [];
    for (const token of tokens) {
      try {
        await messaging.send({
          token,
          notification: {
            title: notificationConfig.dailyReminderTitle,
            body: notificationConfig.dailyReminderMessage,
          },
          android: {
            priority: "high",
            notification: {
              sound: "default",
              channelId: "elite-net-reminders",
            },
          },
        });
        results.push({ token, success: true });
      } catch (err: unknown) {
        results.push({
          token,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const sent = results.filter((r) => r.success).length;
    res.json({ sent, total: tokens.length, results });
  }
);

router.post(
  "/notifications/send-expiry",
  async (_req: Request, res: Response) => {
    const messaging = getFirebaseMessaging();
    if (!messaging) {
      res.status(503).json({ error: "Firebase not configured." });
      return;
    }

    const tokens = Array.from(registeredTokens.values()).map((t) => t.token);
    if (tokens.length === 0) {
      res.status(400).json({ error: "No registered devices" });
      return;
    }

    const results: { token: string; success: boolean; error?: string }[] = [];
    for (const token of tokens) {
      try {
        await messaging.send({
          token,
          notification: {
            title: notificationConfig.sessionExpiryTitle,
            body: notificationConfig.sessionExpiryMessage,
          },
          android: {
            priority: "high",
            notification: {
              sound: "default",
              channelId: "elite-net-alerts",
            },
          },
        });
        results.push({ token, success: true });
      } catch (err: unknown) {
        results.push({
          token,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const sent = results.filter((r) => r.success).length;
    res.json({ sent, total: tokens.length, results });
  }
);

router.post(
  "/notifications/send-custom",
  async (req: Request, res: Response) => {
    const messaging = getFirebaseMessaging();
    if (!messaging) {
      res.status(503).json({ error: "Firebase not configured." });
      return;
    }

    const {
      title,
      body,
      tokens: targetTokens,
    } = req.body as {
      title?: string;
      body?: string;
      tokens?: string[];
    };

    if (!title || !body) {
      res.status(400).json({ error: "title and body are required" });
      return;
    }

    const tokens =
      targetTokens ??
      Array.from(registeredTokens.values()).map((t) => t.token);

    if (tokens.length === 0) {
      res.status(400).json({ error: "No target devices" });
      return;
    }

    const results: { token: string; success: boolean; error?: string }[] = [];
    for (const token of tokens) {
      try {
        await messaging.send({
          token,
          notification: { title, body },
          android: {
            priority: "high",
            notification: {
              sound: "default",
              channelId: "elite-net-reminders",
            },
          },
        });
        results.push({ token, success: true });
      } catch (err: unknown) {
        results.push({
          token,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const sent = results.filter((r) => r.success).length;
    res.json({ sent, total: tokens.length, results });
  }
);

export default router;
