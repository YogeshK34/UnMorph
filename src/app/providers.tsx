"use client";

import { useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { injected, metaMask } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const config = createConfig({
  chains: [mainnet],
  connectors: [
    injected({ target: "metaMask" }),
    metaMask({ dappMetadata: { name: "UnMorph" } }),
    injected(),
  ],
  transports: { [mainnet.id]: http() },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
