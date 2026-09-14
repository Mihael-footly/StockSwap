import { encodeFunctionData, encodePacked, zeroAddress, type Address, type PublicClient } from 'viem';
import deployments from '../../config/venues.snapshot.json';
import type { BuildSwapParams, LiquidityAdapter, QuoteParams, RouteQuote, RouteStep, SupportedAsset, TransactionRequest } from '../lib/types';
import { v3FactoryAbi,v3PoolAbi,quoterAbi,router02Abi,v2FactoryAbi,v2PairAbi,v2RouterAbi } from './abi';
import { requireFresh } from './safety';
import { AppError } from '../server/errors';
export const venueAddress=(contract:string):Address=>deployments.records.find(r=>r.contract===contract)!.address as Address;
export function encodePath(path:Address[],fees:number[]) {
 if(path.length!==fees.length+1||path.length<2||path.length>3||new Set(path.map(x=>x.toLowerCase())).size!==path.length)throw new AppError('INVALID_ROUTE','Invalid swap path.');
 let packed=path[0]; for(let i=0;i<fees.length;i++) packed+=encodePacked(['uint24','address'],[fees[i],path[i+1]]).slice(2); return packed as Address;
}
function checkBuild(p:BuildSwapParams,provider:string) {
 requireFresh(p.route.quoteExpiresAt);
 if(p.chainId!==4663||p.route.provider!==provider||BigInt(p.route.amountInRaw)<=0n||BigInt(p.route.minimumAmountOutRaw)<=0n||BigInt(p.route.minimumAmountOutRaw)>BigInt(p.route.expectedAmountOutRaw)||p.wallet===zeroAddress)throw new AppError('INVALID_ROUTE','Invalid transaction parameters.');
 encodePath(p.route.path,p.route.fees);
}
export class UniswapV3Adapter implements LiquidityAdapter {
 readonly name='Uniswap V3'; readonly securityLevel='verified' as const; readonly reliabilityScore=99;
 constructor(private client:PublicClient){}
 async supportsPair(a:SupportedAsset,b:SupportedAsset){return a.chainId===4663&&b.chainId===4663&&a.id!==b.id;}
 async quote(p:QuoteParams,path:SupportedAsset[]):Promise<RouteQuote[]> {
  if(p.chainId!==4663)return [];
  const fees=[100,500,3000,10000];
  const legs=await Promise.all(path.slice(0,-1).map(async(a,i)=>{
   const b=path[i+1];
   const pools=await Promise.allSettled(fees.map(async fee=>{
    const address=await this.client.readContract({address:venueAddress('UniswapV3Factory'),abi:v3FactoryAbi,functionName:'getPool',args:[a.tokenAddress,b.tokenAddress,fee]});
    if(address===zeroAddress)return null;
    const [liquidity,slot]=await Promise.all([this.client.readContract({address,abi:v3PoolAbi,functionName:'liquidity'}),this.client.readContract({address,abi:v3PoolAbi,functionName:'slot0'})]);
    return liquidity>0n&&slot[0]>0n?{address,fee,sqrt:slot[0]}:null;
   }));
   const discovered=pools.flatMap(result=>result.status==='fulfilled'&&result.value?[result.value]:[]);
   if(discovered.length||!pools.some(result=>result.status==='rejected'))return discovered;
   throw new AppError('PROVIDER_UNAVAILABLE','The liquidity provider could not be reached.',503);
  }));
  if(legs.some(x=>!x.length))return [];
  const combinations=legs.length===1?legs[0].map(x=>[x]):legs[0].flatMap(a=>legs[1].map(b=>[a,b]));
  const results=await Promise.allSettled(combinations.map(async pools=>{
   let spot=p.amount; const steps:RouteStep[]=[];let legAmount=p.amount;
   for(let i=0;i<pools.length;i++){
    const pool=pools[i],a=path[i],b=path[i+1];const square=pool.sqrt*pool.sqrt;
    spot=a.tokenAddress.toLowerCase()<b.tokenAddress.toLowerCase()?spot*square/(2n**192n):spot*(2n**192n)/square;
    const quoted=await this.client.simulateContract({address:venueAddress('QuoterV2'),abi:quoterAbi,functionName:'quoteExactInput',args:[encodePath([a.tokenAddress,b.tokenAddress],[pool.fee]),legAmount]});
    steps.push({provider:this.name,tokenIn:a.id,tokenOut:b.id,amountInRaw:legAmount.toString(),expectedOutRaw:quoted.result[0].toString(),poolAddress:pool.address,feePips:pool.fee});legAmount=quoted.result[0];
   }
   const quote=await this.client.simulateContract({address:venueAddress('QuoterV2'),abi:quoterAbi,functionName:'quoteExactInput',args:[encodePath(path.map(a=>a.tokenAddress),pools.map(x=>x.fee)),p.amount]});
   if(quote.result[0]<=0n||spot<=0n)return null;
   return {amountOut:quote.result[0],spotAmountOut:spot,steps,gasEstimate:quote.result[3],path:path.map(a=>a.tokenAddress),fees:pools.map(x=>x.fee),liquidityScore:Math.max(0,100-Number((spot>quote.result[0]?spot-quote.result[0]:0n)*100n/spot))} satisfies RouteQuote;
  }));
  // A reverted quoter indicates that this particular fee/path cannot execute. RPC failures are not called liquidity failures.
  const valid=results.flatMap(r=>r.status==='fulfilled'&&r.value?[r.value]:[]);
  if(!valid.length&&results.some(r=>r.status==='rejected'&&!String(r.reason).toLowerCase().includes('revert')))throw new AppError('PROVIDER_UNAVAILABLE','The liquidity provider could not be reached.',503);
  return valid;
 }
 buildTransaction(p:BuildSwapParams):TransactionRequest {
  checkBuild(p,this.name);
  const swap=encodeFunctionData({abi:router02Abi,functionName:'exactInput',args:[{path:encodePath(p.route.path,p.route.fees),recipient:p.wallet,amountIn:BigInt(p.route.amountInRaw),amountOutMinimum:BigInt(p.route.minimumAmountOutRaw)}]});
  return {to:venueAddress('SwapRouter02'),data:encodeFunctionData({abi:router02Abi,functionName:'multicall',args:[BigInt(Math.floor(Date.parse(p.route.quoteExpiresAt)/1000)),[swap]]}),chainId:p.chainId,value:'0'};
 }
}
export class UniswapV2Adapter implements LiquidityAdapter {
 readonly name='Uniswap V2';readonly securityLevel='verified' as const;readonly reliabilityScore=99;
 constructor(private client:PublicClient){}
 async supportsPair(a:SupportedAsset,b:SupportedAsset){return a.chainId===4663&&b.chainId===4663&&a.id!==b.id;}
 async quote(p:QuoteParams,path:SupportedAsset[]):Promise<RouteQuote[]> {
  if(p.chainId!==4663)return [];
  let amount=p.amount,spot=p.amount;const steps:RouteStep[]=[];let score=100;
  for(let i=0;i<path.length-1;i++){
   const a=path[i],b=path[i+1];
   const address=await this.client.readContract({address:venueAddress('UniswapV2Factory'),abi:v2FactoryAbi,functionName:'getPair',args:[a.tokenAddress,b.tokenAddress]});
   if(address===zeroAddress)return [];
   const [reserves,token0]=await Promise.all([this.client.readContract({address,abi:v2PairAbi,functionName:'getReserves'}),this.client.readContract({address,abi:v2PairAbi,functionName:'token0'})]);
   const [input,output]=token0.toLowerCase()===a.tokenAddress.toLowerCase()?[reserves[0],reserves[1]]:[reserves[1],reserves[0]];
   if(input===0n||output===0n)return [];
   const amountOut=amount*997n*output/(input*1000n+amount*997n);
   if(amountOut<=0n||amountOut>=output)return [];
   spot=spot*output/input;score=Math.min(score,100-Number(amountOut*100n/output));
   steps.push({provider:this.name,tokenIn:a.id,tokenOut:b.id,amountInRaw:amount.toString(),expectedOutRaw:amountOut.toString(),poolAddress:address,feePips:3000});amount=amountOut;
  }
  return [{amountOut:amount,spotAmountOut:spot,steps,gasEstimate:null,path:path.map(a=>a.tokenAddress),fees:steps.map(s=>s.feePips),liquidityScore:score}];
 }
 buildTransaction(p:BuildSwapParams):TransactionRequest {
  checkBuild(p,this.name);
  return {to:venueAddress('UniswapV2Router02'),data:encodeFunctionData({abi:v2RouterAbi,functionName:'swapExactTokensForTokens',args:[BigInt(p.route.amountInRaw),BigInt(p.route.minimumAmountOutRaw),p.route.path,p.wallet,BigInt(Math.floor(Date.parse(p.route.quoteExpiresAt)/1000))]}),value:'0',chainId:p.chainId};
 }
}
