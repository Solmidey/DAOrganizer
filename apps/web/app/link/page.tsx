"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";

export default function LinkWalletPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const { address, isConnected } = useAccount();
  const connector = useMemo(() => new InjectedConnector(), []);
  const { connectAsync } = useConnect({ connector });
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("Missing token");
    }
  }, [token]);

  const handleLink = async () => {
    if (!token) return;
    if (!isConnected) {
      await connectAsync();
      return;
    }
    if (!address) return;
    const message = `Link wallet to governance toolkit\nToken: ${token}\nAddress: ${address}`;
    const signature = await signMessageAsync({ message });
    const res = await fetch("/api/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, address, signature })
    });
    if (!res.ok) {
      const error = await res.json();
      setStatus(error.error ?? "Failed to link");
      return;
    }
    setStatus("Linked successfully");
    router.push("/dashboard");
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-3xl font-semibold">Link your wallet</h1>
      <p className="text-muted-foreground">
        Sign a message to connect your Discord or Telegram account with this address. No gas or approvals required.
      </p>
      <div className="flex items-center gap-2">
        {!isConnected ? (
          <Button onClick={() => connect()}>Connect wallet</Button>
        ) : (
          <Button variant="outline" onClick={() => disconnect()}>
            Disconnect {address?.slice(0, 6)}
          </Button>
        )}
        <Button onClick={handleLink} disabled={!token}>
          Sign & Link
        </Button>
      </div>
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
    </div>
  );
}
