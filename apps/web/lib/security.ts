import crypto from "crypto";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "";

type SignedPayload = {
  userId: string;
  platformId: string;
  platform: "discord" | "telegram";
  displayName?: string;
  iat: number;
};

export async function signWebhookPayload(payload: SignedPayload) {
  if (!WEBHOOK_SECRET) {
    throw new Error("WEBHOOK_SECRET is not set");
  }
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
  return Buffer.from(JSON.stringify({ body, signature })).toString("base64url");
}

export async function verifyWebhookSignature(token: string): Promise<SignedPayload | null> {
  try {
    if (!WEBHOOK_SECRET) {
      throw new Error("WEBHOOK_SECRET is not set");
    }
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));
    const signature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(decoded.body).digest("hex");
    if (signature !== decoded.signature) return null;
    return JSON.parse(decoded.body);
  } catch (err) {
    console.error("Failed to verify webhook signature", err);
    return null;
  }
}

export function assertWebhookSecret(secret?: string) {
  if (!WEBHOOK_SECRET) {
    throw new Error("WEBHOOK_SECRET is not set");
  }
  if (secret !== WEBHOOK_SECRET) {
    throw new Error("Invalid webhook secret");
  }
}
