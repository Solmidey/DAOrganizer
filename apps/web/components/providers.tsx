"use client";

import { ReactNode, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiConfig } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <SessionProvider>
      <WagmiConfig config={wagmiConfig}>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </WagmiConfig>
    </SessionProvider>
  );
}
