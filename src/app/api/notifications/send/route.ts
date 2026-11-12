import { FieldValue, type DocumentData } from "firebase-admin/firestore";
import type { Message } from "firebase-admin/messaging";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export const runtime = "nodejs";

type SendRequest = {
  title?: unknown;
  description?: unknown;
  type?: unknown;
  audience?: unknown;
  targetUserId?: unknown;
};

const tokenFieldNames = [
  "fcmToken",
  "fcmTokens",
  "fcm_token",
  "fcm_tokens",
  "fcmDeviceToken",
  "fcmDeviceTokens",
  "notificationToken",
  "notificationTokens",
  "messagingToken",
  "messagingTokens",
  "deviceToken",
  "deviceTokens",
  "pushToken",
  "pushTokens",
  "tokens",
];

function responseError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function readTokens(data: DocumentData) {
  const tokens = new Set<string>();

  function collect(value: unknown) {
    if (typeof value === "string" && value.trim()) {
      tokens.add(value.trim());
    } else if (Array.isArray(value)) {
      value.forEach(collect);
    } else if (value && typeof value === "object") {
      Object.values(value).forEach(collect);
    }
  }

  tokenFieldNames.forEach((field) => collect(data[field]));
  return [...tokens];
}

function readUserTokens(user: { data(): DocumentData | undefined }) {
  return readTokens(user.data() || {});
}

async function findUser(db: ReturnType<typeof getFirebaseAdmin>["db"], userId: string) {
  const directMatch = await db.collection("users").doc(userId).get();
  if (directMatch.exists) return directMatch;

  const uidMatch = await db.collection("users").where("uid", "==", userId).limit(1).get();
  return uidMatch.docs[0] ?? null;
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const idToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!idToken) return responseError("Admin sign-in required.", 401);

  let admin: ReturnType<typeof getFirebaseAdmin>;
  try {
    admin = getFirebaseAdmin();
  } catch (error) {
    console.error("Firebase Admin setup error:", error);
    return responseError("Server Firebase Admin credentials are missing or invalid.", 503);
  }

  let uid: string;
  try {
    ({ uid } = await admin.auth.verifyIdToken(idToken));
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
    if (code.startsWith("auth/")) {
      return responseError("Your session has expired. Sign in again and retry.", 401);
    }
    console.error("Firebase ID token verification failed:", error);
    return responseError("Admin sign-in could not be verified.", 500);
  }

  try {
    const adminDoc = await admin.db.doc("system_config/admin").get();
    if (!adminDoc.exists || adminDoc.data()?.uid !== uid) {
      return responseError("Only the configured admin can send notifications.", 403);
    }
  } catch (error) {
    console.error("Unable to verify notification admin:", error);
    return responseError("Admin access could not be verified.", 500);
  }

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return responseError("Request body must be valid JSON.", 400);
  }

  if (!requestBody || typeof requestBody !== "object" || Array.isArray(requestBody)) {
    return responseError("Request body must be a JSON object.", 400);
  }

  const body = requestBody as SendRequest;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const notificationType = body.type;
  const audience = body.audience;
  const targetUserId = typeof body.targetUserId === "string" ? body.targetUserId.trim() : "";

  if (!title || title.length > 80 || !description || description.length > 240) {
    return responseError("Add a title (up to 80 characters) and message (up to 240 characters).", 400);
  }
  if (notificationType !== "Reminder" && notificationType !== "Social" && notificationType !== "Milestone") {
    return responseError("Choose a valid notification type.", 400);
  }
  if (audience !== "all" && audience !== "single") {
    return responseError("Choose all users or one user as the audience.", 400);
  }
  if (audience === "single" && !targetUserId) {
    return responseError("Select a user before sending.", 400);
  }

  try {
    const users = audience === "all"
      ? (await admin.db.collection("users").get()).docs
      : await findUser(admin.db, targetUserId).then((user) => user ? [user] : []);

    const selectedUser = users[0];
    if (audience === "single" && !selectedUser) {
      return responseError("That user could not be found.", 404);
    }
    if (users.length === 0) {
      return responseError("There are no registered users to notify.", 422);
    }

    const tokens = [...new Set(users.flatMap((user) => readUserTokens(user)))];
    const userId = audience === "all" ? "all" : String(selectedUser?.data()?.uid || selectedUser?.id);
    const notificationRef = admin.db.collection("notifications").doc();
    const timestamp = FieldValue.serverTimestamp();

    await notificationRef.set({
      title,
      description,
      type: notificationType,
      userId,
      isRead: false,
      timestamp,
      deliveryStatus: tokens.length ? "sending" : "no_tokens",
      recipientCount: users.length,
      tokenCount: tokens.length,
      sentCount: 0,
      failureCount: 0,
    });

    if (!tokens.length) {
      return Response.json({
        sent: 0,
        failed: 0,
        tokenCount: 0,
        recipientCount: users.length,
        message: "Saved for in-app notifications, but no FCM device tokens were found.",
      });
    }

    const batches = Array.from({ length: Math.ceil(tokens.length / 500) }, (_, index) => tokens.slice(index * 500, (index + 1) * 500));
    const baseMessage: Omit<Message, "token" | "topic" | "condition" | "tokens"> = {
      notification: { title, body: description },
      data: {
        notificationId: notificationRef.id,
        type: String(notificationType),
        userId,
      },
    };

    const results = await Promise.allSettled(
      batches.map((batch) => admin.messaging.sendEachForMulticast({ ...baseMessage, tokens: batch })),
    );
    let sent = 0;
    let failed = 0;
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        sent += result.value.successCount;
        failed += result.value.failureCount;
      } else {
        failed += batches[index].length;
        console.error("FCM notification batch failed:", result.reason);
      }
    });

    const deliveryStatus = sent === 0 ? "failed" : failed ? "partial" : "sent";
    await notificationRef.update({
      deliveryStatus,
      sentCount: sent,
      failureCount: failed,
      sentAt: FieldValue.serverTimestamp(),
    });

    return Response.json({
      sent,
      failed,
      tokenCount: tokens.length,
      recipientCount: users.length,
      message: sent === 0
        ? "Notification was saved, but Firebase did not accept it for any device."
        : failed
          ? `Firebase accepted the push for ${sent} device(s); ${failed} device(s) could not be reached.`
          : `Firebase accepted the push for ${sent} device(s).`,
    });
  } catch (error) {
    console.error("Unable to create or send notification:", error);
    return responseError("Notification could not be saved. Check Firebase Admin permissions and try again.", 500);
  }
}
