import { defineChain } from 'viem';
import type { AppConfig } from '../lib/types';
export function config(): AppConfig {
 const chainId = Number(process.env.CHAIN_ID || '46630');
 if (![4663,46630].includes(chainId)) throw new Error('Unsupported configured chain');
 const testnet = chainId === 46630;
 return { chainId, testnet, chainName: `Robinhood Chain${testnet?' Testnet':''}`, explorerUrl:process.env.EXPLORER_URL || (testnet?'https://explorer.testnet.chain.robinhood.com':'https://robinhoodchain.blockscout.com'), publicRpcUrl:testnet?'https://rpc.testnet.chain.robinhood.com':'https://rpc.mainnet.chain.robinhood.com', executionEnabled:process.env.EXECUTION_ENABLED==='true' && !!process.env.DATABASE_URL, storageReady:!!process.env.DATABASE_URL, walletConnectProjectId:process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || null };
}
export function chain() { const c=config(); return defineChain({id:c.chainId,name:c.chainName,nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:{default:{http:[c.publicRpcUrl]}},blockExplorers:{default:{name:'Blockscout',url:c.explorerUrl}},testnet:c.testnet}); }
