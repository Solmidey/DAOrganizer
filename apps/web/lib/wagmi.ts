import { createConfig, http } from "wagmi";
import { baseSepolia } from "viem/chains";
import { injected } from "wagmi/connectors";

const rpcUrl =
  process.env.NEXT_PUBLIC_RPC_URL ??
  process.env.RPC_URL ??
  "https://base-sepolia-rpc.publicnode.com";

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(rpcUrl)
  },
  connectors: [injected()]
});
