import { describe, expect, it } from 'vitest';
import { decodeFunctionData, zeroAddress } from 'viem';
import { SwapRouterEngine } from '../src/routing/engine';
import { UniswapV3Adapter, encodePath } from '../src/routing/adapters';
import { router02Abi } from '../src/routing/abi';
import type { LiquidityAdapter, SupportedAsset, QuoteParams, SwapRoute } from '../src/lib/types';
const a={id:'a',chainId:4663,swapEnabled:true,tokenAddress:'0x0000000000000000000000000000000000000001'} as unknown as SupportedAsset;
const b={...a,id:'b',tokenAddress:'0x0000000000000000000000000000000000000002'} as SupportedAsset;
const usd={...a,id:'usd',tokenAddress:'0x0000000000000000000000000000000000000003'} as SupportedAsset;
const p={sourceAsset:a,destinationAsset:b,amount:1000n,wallet:'0x0000000000000000000000000000000000000004',chainId:4663,slippageTolerance:50} as QuoteParams;
const fixture:LiquidityAdapter={name:'Test-only deterministic venue',securityLevel:'verified',reliabilityScore:99,supportsPair:async()=>true,quote:async(_,path)=>[{amountOut:path.length===2?990n:998n,spotAmountOut:1000n,steps:path.slice(0,-1).map((x,i)=>({provider:'Test',tokenIn:x.id,tokenOut:path[i+1].id,amountInRaw:'1000',expectedOutRaw:'998',poolAddress:zeroAddress,feePips:500})),gasEstimate:100n,path:path.map(a=>a.tokenAddress),fees:path.slice(1).map(()=>500),liquidityScore:99}],buildTransaction:()=>{throw Error('Fixture does not execute');}};
describe('SwapRouterEngine',()=>{
 it('compares a direct route with a single hop using actual adapter outputs',async()=>{const routes=await new SwapRouterEngine([fixture],[usd]).findRoutes(p,1000n);expect(routes).toHaveLength(2);expect(routes[0].steps).toHaveLength(2);expect(routes[0].minimumAmountOutRaw).toBe('993');});
 it('returns an honest empty result for no liquidity',async()=>expect(await new SwapRouterEngine([{...fixture,quote:async()=>[]}],[]).findRoutes(p,1000n)).toEqual([]));
 it('rejects unknown networks and disabled assets',async()=>{await expect(new SwapRouterEngine([fixture],[]).findRoutes({...p,chainId:1},1000n)).rejects.toThrow();await expect(new SwapRouterEngine([fixture],[]).findRoutes({...p,sourceAsset:{...a,swapEnabled:false}},1000n)).rejects.toThrow();});
 it('distinguishes an RPC failure from no liquidity',async()=>expect(new SwapRouterEngine([{...fixture,quote:async()=>{throw Error('network failure');}}],[]).findRoutes(p,1000n)).rejects.toThrow('unavailable'));
 it('rejects implausibly favorable as well as poor reference deviations',async()=>expect(new SwapRouterEngine([fixture],[]).findRoutes(p,500n)).rejects.toThrow('Poor execution'));
});
describe('transaction constraints',()=>{
 const adapter=new UniswapV3Adapter({} as never);
 const route={provider:'Uniswap V3',amountInRaw:'1000',minimumAmountOutRaw:'985',expectedAmountOutRaw:'990',path:[a.tokenAddress,b.tokenAddress],fees:[500],quoteExpiresAt:new Date(Date.now()+30000).toISOString()} as SwapRoute;
 it('binds recipient, exact amount, path, minimum and onchain deadline',()=>{
  const tx=adapter.buildTransaction({route,wallet:p.wallet,chainId:4663});
  const outer=decodeFunctionData({abi:router02Abi,data:tx.data});expect(outer.functionName).toBe('multicall');
  if(outer.functionName!=='multicall')throw Error();
  expect(outer.args[0]).toBe(BigInt(Math.floor(Date.parse(route.quoteExpiresAt)/1000)));
  const inner=decodeFunctionData({abi:router02Abi,data:outer.args[1][0]});expect(inner.functionName).toBe('exactInput');
  if(inner.functionName!=='exactInput')throw Error();expect(inner.args[0]).toMatchObject({recipient:p.wallet,amountIn:1000n,amountOutMinimum:985n,path:encodePath(route.path,[500])});
 });
 it('rejects a stale build',()=>expect(()=>adapter.buildTransaction({route:{...route,quoteExpiresAt:'2000-01-01T00:00:00Z'},wallet:p.wallet,chainId:4663})).toThrow('expired'));
 it('rejects wrong chain, zero recipient, and route loops',()=>{expect(()=>adapter.buildTransaction({route,wallet:p.wallet,chainId:46630})).toThrow();expect(()=>adapter.buildTransaction({route,wallet:zeroAddress,chainId:4663})).toThrow();expect(()=>encodePath([a.tokenAddress,b.tokenAddress,a.tokenAddress],[500,500])).toThrow();});
});
