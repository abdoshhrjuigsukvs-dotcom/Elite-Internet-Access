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
  dailyReminderMessage: string;
  sessionExpiryMessage: string;
  dailyReminderTitle: string;
  sessionExpiryTitle: string;
}

let notificationConfig: NotificationConfig = {
  dailyReminderTitle: "Elite Net",
  dailyReminderMessage:
    "ساعتين النت المجاني بتوعك جاهزين! ادخل فعلهم دلوقتي 🌐",
  sessionExpiryTitle: "Elite Net — Session Ended",
  sessionExpiryMessage:
    "Your 2-hour daily internet session has ended. Come back tomorrow for more free access.",
};

function getFirebaseAdmin() {
  const serviceAccountJson = process.env["FIREBASE_SERVICE_ACCOUNT"];
  if (!serviceAccountJson) return null;

  if (adminApp) return firebaseAdmin;

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    const admin = require("firebase-admin");
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseAdmin = admin;
    return firebaseAdmin;
  } catch (err) {
    return null;
  }
}

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

router.put(
  "/notifications/config",
  (req: Request, res: Response) => {
    const body = req.body as Partial<NotificationConfig>;
    notificationConfig = { ...notificationConfig, ...body };
    res.json({ success: true, config: notificationConfig });
  }
);

router.post(
  "/notifications/send-daily",
  async (req: Request, res: Response) => {
    const admin = getFirebaseAdmin();
    if (!admin) {
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

    const messaging = (admin as typeof import("firebase-admin")).messaging();
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
            notification: { sound: "default", channelId: "elite-net-reminders" },
          },
        });
        results.push({ token, success: true });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        results.push({ token, success: false, error: errMsg });
      }
    }

    const sent = results.filter((r) => r.success).length;
    res.json({ sent, total: tokens.length, results });
  }
);

router.post(
  "/notifications/send-expiry",
  async (req: Request, res: Response) => {
    const admin = getFirebaseAdmin();
    if (!admin) {
      res.status(503).json({ error: "Firebase not configured." });
      return;
    }

    const tokens = Array.from(registeredTokens.values()).map((t) => t.token);
    if (tokens.length === 0) {
      res.status(400).json({ error: "No registered devices" });
      return;
    }

    const messaging = (admin as typeof import("firebase-admin")).messaging();
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
            notification: { sound: "default", channelId: "elite-net-alerts" },
          },
        });
        results.push({ token, success: true });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        results.push({ token, success: false, error: errMsg });
      }
    }

    const sent = results.filter((r) => r.success).length;
    res.json({ sent, total: tokens.length, results });
  }
);

router.post(
  "/notifications/send-custom",
  async (req: Request, res: Response) => {
    const admin = getFirebaseAdmin();
    if (!admin) {
      res.status(503).json({ error: "Firebase not configured." });
      return;
    }

    const { title, body, tokens: targetTokens } = req.body as {
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

    const messaging = (admin as typeof import("firebase-admin")).messaging();
    const results: { token: string; success: boolean; error?: string }[] = [];

    for (const token of tokens) {
      try {
        await messaging.send({
          token,
          notification: { title, body },
          android: {
            priority: "high",
            notification: { sound: "default", channelId: "elite-net-reminders" },
          },
        });
        results.push({ token, success: true });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        results.push({ token, success: false, error: errMsg });
      }
    }

    const sent = results.filter((r) => r.success).length;
    res.json({ sent, total: tokens.length, results });
  }
);

export default router;
