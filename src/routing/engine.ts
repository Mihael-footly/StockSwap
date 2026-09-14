import type { LiquidityAdapter, QuoteParams, SupportedAsset, SwapRoute } from '../lib/types';
import { AppError } from '../server/errors';
import { minimumOutput, priceImpact, rankRoutes } from './safety';
export class SwapRouterEngine {
 constructor(private adapters:LiquidityAdapter[],private intermediates:SupportedAsset[]){}
 async findRoutes(p:QuoteParams,referenceOut:bigint):Promise<SwapRoute[]> {
  minimumOutput(p.amount,p.slippageTolerance);
  if(!p.sourceAsset.swapEnabled||!p.destinationAsset.swapEnabled||p.sourceAsset.chainId!==p.chainId||p.destinationAsset.chainId!==p.chainId||p.sourceAsset.id===p.destinationAsset.id)throw new AppError('INVALID_ASSET','Select two supported assets on the same network.');
  const started=Date.now();const expiry=new Date(started+30000).toISOString();
  const paths=[[p.sourceAsset,p.destinationAsset],...this.intermediates.filter(a=>a.chainId===p.chainId&&a.id!==p.sourceAsset.id&&a.id!==p.destinationAsset.id&&a.swapEnabled).map(a=>[p.sourceAsset,a,p.destinationAsset])];
  const results=await Promise.allSettled(this.adapters.flatMap(adapter=>paths.map(async path=>{
   if(!await adapter.supportsPair(p.sourceAsset,p.destinationAsset))return [];
   return (await adapter.quote(p,path)).map((q):SwapRoute=>({id:crypto.randomUUID(),sourceAssetId:p.sourceAsset.id,destinationAssetId:p.destinationAsset.id,amountInRaw:p.amount.toString(),expectedAmountOutRaw:q.amountOut.toString(),minimumAmountOutRaw:minimumOutput(q.amountOut,p.slippageTolerance).toString(),steps:q.steps,priceImpactBps:priceImpact(q.spotAmountOut,q.amountOut),referenceDeviationBps:Number((q.amountOut>referenceOut?q.amountOut-referenceOut:referenceOut-q.amountOut)*10000n/referenceOut),protocolFeeRaw:'0',gasEstimate:q.gasEstimate?.toString()??null,gasFeeWei:null,estimatedSeconds:null,quoteExpiresAt:expiry,securityLevel:adapter.securityLevel,provider:adapter.name,liquidityScore:q.liquidityScore,reliabilityScore:adapter.reliabilityScore,path:q.path,fees:q.fees}));
  })));
  const all=results.flatMap(r=>r.status==='fulfilled'?r.value:[]);
  if(!all.length&&results.some(r=>r.status==='rejected'))throw new AppError('PROVIDER_UNAVAILABLE','One or more liquidity providers are unavailable. Try again.',503);
  const ranked=rankRoutes(all);
  if(!ranked.length&&all.length)throw new AppError('POOR_EXECUTION','Poor execution. Available routes exceed the 5% price impact or reference-price deviation limit.',422);
  return ranked;
 }
}
