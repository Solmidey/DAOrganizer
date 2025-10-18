import { http } from "viem";
import { baseSepolia } from "viem/chains";
import { createConfig } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";

const rpcUrl =
  process.env.NEXT_PUBLIC_RPC_URL ??
  process.env.RPC_URL ??
  "https://base-sepolia-rpc.publicnode.com";

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(rpcUrl)
  },
  connectors: [new InjectedConnector()]
});
