import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SupportedAsset } from '../src/lib/types';
import { AppError } from '../src/server/errors';
import { RobinhoodPriceProvider } from '../src/server/prices';

const asset = {
  id: 'rh-aapl-4663',
  symbol: 'AAPL',
  referenceTicker: 'AAPL',
  tokenAddress: '0xAf3D76f1834A1d425780943C99Ea8A608f8a93f9',
  chainId: 4663,
  decimals: 18,
  multiplier: '1.000000000000000000',
} as unknown as SupportedAsset;

const payload = {
  quotes: [{
    tokenSymbol: 'AAPL',
    bid: '200.00',
    ask: '200.02',
    currency: 'USD',
    isTradingHalt: false,
    generatedAt: new Date().toISOString(),
    deployments: [{ contractAddress: asset.tokenAddress, chainId: 4663 }],
  }],
};

const response = (body: unknown, ok = true) => ({ ok, json: async () => body }) as Response;

afterEach(() => vi.unstubAllGlobals());

describe('Robinhood reference price provider', () => {
  it('retries a transient issuer API failure and returns the live price', async () => {
    let attempts = 0;
    vi.stubGlobal('fetch', vi.fn(async () => {
      attempts += 1;
      if (attempts === 1) throw new TypeError('fetch failed');
      return response(payload);
    }));

    const price = await new RobinhoodPriceProvider().getPrice(asset);

    expect(attempts).toBe(2);
    expect(price.usdE8).toBe('20001000000');
  });

  it('returns a stable error when the issuer API cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network down'); }));

    await expect(new RobinhoodPriceProvider().getPrice(asset)).rejects.toMatchObject({
      code: 'PRICE_UNAVAILABLE',
      status: 503,
    } satisfies Partial<AppError>);
  });
});
