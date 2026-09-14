import type { SwapRoute } from '../lib/types';
import { AppError } from '../server/errors';
export function minimumOutput(amount: bigint, slippageBps: number): bigint {
 if(!Number.isInteger(slippageBps)||slippageBps<0||slippageBps>500||amount<=0n)throw new AppError('INVALID_SLIPPAGE','Slippage must be between 0% and 5%.');
 const minimum=amount*BigInt(10000-slippageBps)/10000n;
 if(minimum<=0n)throw new AppError('AMOUNT_TOO_SMALL','The amount is too small.');
 return minimum;
}
export function requireFresh(expiresAt: string, now = Date.now()): void {
 if(!Number.isFinite(Date.parse(expiresAt))||Date.parse(expiresAt)<=now)throw new AppError('QUOTE_EXPIRED','This quote has expired. Refresh before continuing.',409);
}
export function priceImpact(spot: bigint, actual: bigint): number {
 if(spot<=0n||actual<0n)throw new AppError('INVALID_QUOTE','Invalid liquidity quote.');
 if(actual>=spot)return 0;
 return Number(((spot-actual)*10000n+spot-1n)/spot);
}
export function rankRoutes(routes: SwapRoute[]): SwapRoute[] {
 return routes.filter(r=>Date.parse(r.quoteExpiresAt)>Date.now()&&r.priceImpactBps<=500&&r.referenceDeviationBps<=500&&r.reliabilityScore>=80&&r.liquidityScore>=20&&BigInt(r.expectedAmountOutRaw)>0n)
 .sort((a,b)=>{
  if(a.securityLevel!==b.securityLevel)return a.securityLevel==='verified'?-1:1;
  const ao=BigInt(a.expectedAmountOutRaw),bo=BigInt(b.expectedAmountOutRaw);
  if(ao!==bo)return ao>bo?-1:1;
  if(a.liquidityScore!==b.liquidityScore)return b.liquidityScore-a.liquidityScore;
  if(a.priceImpactBps!==b.priceImpactBps)return a.priceImpactBps-b.priceImpactBps;
  if(a.gasFeeWei!==null&&b.gasFeeWei!==null&&a.gasFeeWei!==b.gasFeeWei)return BigInt(a.gasFeeWei)<BigInt(b.gasFeeWei)?-1:1;
  return b.reliabilityScore-a.reliabilityScore||a.steps.length-b.steps.length;
 });
}
