import { createPublicClient, fallback, http } from 'viem';
import { chain, config } from './config';
import { AppError } from './errors';
export function rpc() {
 const urls = [...new Set([process.env.RPC_URL || config().publicRpcUrl, process.env.RPC_FALLBACK_URL].filter(Boolean) as string[])];
 return createPublicClient({chain:chain(),transport:fallback(urls.map(url=>http(url,{timeout:8000,retryCount:1})),{retryCount:0})});
}
export async function requireChain() { const client=rpc(); if(await client.getChainId()!==config().chainId) throw new AppError('WRONG_RPC_CHAIN','The RPC is connected to a different network.',503); return client; }
