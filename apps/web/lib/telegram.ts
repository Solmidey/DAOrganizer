import crypto from "crypto";

const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";

export function verifyTelegramSecret(secretToken?: string) {
  if (!TELEGRAM_WEBHOOK_SECRET) {
    throw new Error("TELEGRAM_WEBHOOK_SECRET not set");
  }
  if (!secretToken || secretToken !== TELEGRAM_WEBHOOK_SECRET) {
    throw new Error("Invalid Telegram webhook secret");
  }
}

export function buildTelegramLinkToken(data: Record<string, unknown>) {
  const body = JSON.stringify(data);
  const signature = crypto.createHmac("sha256", TELEGRAM_WEBHOOK_SECRET).update(body).digest("hex");
  return Buffer.from(JSON.stringify({ body, signature })).toString("base64url");
}

export function parseTelegramLinkToken(token: string) {
  const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));
  const signature = crypto.createHmac("sha256", TELEGRAM_WEBHOOK_SECRET).update(decoded.body).digest("hex");
  if (signature !== decoded.signature) throw new Error("Invalid signature");
  return JSON.parse(decoded.body);
}
