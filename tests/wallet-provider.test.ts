import { describe, expect, it } from 'vitest';
import { getInjectedProvider, type InjectedWalletHost } from '../src/lib/wallet-provider';

const phantomProvider = { request: async () => [] };
const browserProvider = { request: async () => [] };

describe('injected wallet provider selection', () => {
  it('selects Phantom’s EVM provider explicitly', () => {
    const host: InjectedWalletHost = {
      ethereum: browserProvider,
      phantom: { ethereum: phantomProvider },
    };

    expect(getInjectedProvider('phantom', host)).toBe(phantomProvider);
  });

  it('returns no Phantom provider when Phantom is not installed', () => {
    expect(getInjectedProvider('phantom', { ethereum: browserProvider })).toBeNull();
  });

  it('keeps the generic browser-wallet provider path', () => {
    const host: InjectedWalletHost = { ethereum: browserProvider };

    expect(getInjectedProvider('browser', host)).toBe(browserProvider);
  });
});
