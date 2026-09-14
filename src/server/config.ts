import { defineChain } from 'viem';
import type { AppConfig } from '../lib/types';
import { isSupabaseConfigured } from './supabase';
export function config(): AppConfig {
 const chainId = Number(process.env.CHAIN_ID || '4663');
 if (![4663,46630].includes(chainId)) throw new Error('Unsupported configured chain');
 const testnet = chainId === 46630;
 const storageReady = isSupabaseConfigured();
 return { chainId, testnet, chainName: `Robinhood Chain${testnet?' Testnet':''}`, explorerUrl:process.env.EXPLORER_URL || (testnet?'https://explorer.testnet.chain.robinhood.com':'https://robinhoodchain.blockscout.com'), publicRpcUrl:testnet?'https://rpc.testnet.chain.robinhood.com':'https://rpc.mainnet.chain.robinhood.com', executionEnabled:process.env.EXECUTION_ENABLED==='true' && storageReady, storageReady, walletConnectProjectId:process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || null };
}
export function chain() { const c=config(); return defineChain({id:c.chainId,name:c.chainName,nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:{default:{http:[c.publicRpcUrl]}},blockExplorers:{default:{name:'Blockscout',url:c.explorerUrl}},testnet:c.testnet}); }
