import nacl from "tweetnacl";
import type { InteractionResponse } from "discord-interactions";

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY ?? "";

export function verifyDiscordSignature(params: { body: string; signature: string; timestamp: string }) {
  const { body, signature, timestamp } = params;
  return nacl.sign.detached.verify(
    Buffer.from(timestamp + body),
    Buffer.from(signature, "hex"),
    Buffer.from(DISCORD_PUBLIC_KEY, "hex")
  );
}

export const discordResponse = (response: InteractionResponse) => Response.json(response);
