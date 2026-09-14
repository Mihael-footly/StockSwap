import { afterEach, describe, expect, it } from 'vitest';
import { config } from '../src/server/config';

const originalChainId = process.env.CHAIN_ID;
const originalExplorerUrl = process.env.EXPLORER_URL;

afterEach(() => {
  if (originalChainId === undefined) delete process.env.CHAIN_ID;
  else process.env.CHAIN_ID = originalChainId;
  if (originalExplorerUrl === undefined) delete process.env.EXPLORER_URL;
  else process.env.EXPLORER_URL = originalExplorerUrl;
});

describe('default network configuration', () => {
  it('targets Robinhood Chain mainnet when no chain is configured', () => {
    delete process.env.CHAIN_ID;
    delete process.env.EXPLORER_URL;

    const result = config();

    expect(result.chainId).toBe(4663);
    expect(result.testnet).toBe(false);
    expect(result.chainName).toBe('Robinhood Chain');
    expect(result.publicRpcUrl).toBe('https://rpc.mainnet.chain.robinhood.com');
    expect(result.explorerUrl).toBe('https://robinhoodchain.blockscout.com');
  });
});
