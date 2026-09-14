import { endpoint } from '@/server/http';
import { liveAssets } from '@/server/registry';
import { addressSchema } from '@/server/validation';
import { requireChain } from '@/server/rpc';
import { erc20Abi,type Address } from 'viem';
export async function GET(req:Request){return endpoint(async()=>{const wallet=addressSchema.parse(new URL(req.url).searchParams.get('wallet')) as Address;const client=await requireChain();const assets=await liveAssets();const balances=await Promise.all(assets.map(async a=>[a.id,(await client.readContract({address:a.tokenAddress,abi:erc20Abi,functionName:'balanceOf',args:[wallet]})).toString()]));return {balances:Object.fromEntries(balances),block:(await client.getBlockNumber()).toString()};});}
