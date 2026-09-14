export type WalletProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (value: unknown) => void) => void;
  removeListener?: (event: string, handler: (value: unknown) => void) => void;
  disconnect?: () => Promise<void>;
};

export type InjectedWalletHost = {
  ethereum?: WalletProvider;
  phantom?: { ethereum?: WalletProvider };
};

export function getInjectedProvider(kind: 'browser' | 'phantom', host: InjectedWalletHost): WalletProvider | null {
  if (kind === 'phantom') return host.phantom?.ethereum ?? null;
  return host.ethereum ?? null;
}
