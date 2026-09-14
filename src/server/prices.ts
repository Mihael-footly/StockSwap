import { parseUnits } from 'viem';
import { z } from 'zod';
import type { SupportedAsset, Price } from '../lib/types';
import { AppError } from './errors';
export interface PriceProvider { getPrice(asset:SupportedAsset):Promise<Price> }
const decimal=z.string().regex(/^\d+(\.\d+)?$/);
const priceSchema=z.object({tokenSymbol:z.string(),bid:decimal,ask:decimal,currency:z.literal('USD'),isTradingHalt:z.boolean(),generatedAt:z.string().datetime(),deployments:z.array(z.object({contractAddress:z.string(),chainId:z.number()}))});
export class RobinhoodPriceProvider implements PriceProvider {
 async getPrice(asset:SupportedAsset):Promise<Price> {
  const response=await fetch(`https://api.robinhood.com/rhj/prices/${encodeURIComponent(asset.referenceTicker)}`,{signal:AbortSignal.timeout(6000),cache:'no-store'});
  if(!response.ok)throw new AppError('PRICE_UNAVAILABLE','Reference prices are temporarily unavailable.',503);
  const body=z.object({quotes:z.array(priceSchema)}).parse(await response.json());
  const p=body.quotes.find(p=>p.tokenSymbol===asset.referenceTicker&&p.deployments.some(d=>d.chainId===asset.chainId&&d.contractAddress.toLowerCase()===asset.tokenAddress.toLowerCase()));
  if(!p||p.isTradingHalt)throw new AppError('PRICE_UNAVAILABLE','This asset is halted or its reference price is unavailable.',422);
  const age=Date.now()-Date.parse(p.generatedAt);
  if(age>60000||age< -5000)throw new AppError('STALE_REFERENCE_PRICE','Reference prices are stale. Quoting is paused until fresh prices return.',422);
  const bid=parseUnits(p.bid,8),ask=parseUnits(p.ask,8);
  if(bid<=0n||ask<bid)throw new AppError('INVALID_REFERENCE_PRICE','The price source returned an invalid price.',503);
  const usdE8=((bid+ask)/2n*parseUnits(asset.multiplier,18)/10n**18n).toString();
  return {usdE8,generatedAt:p.generatedAt,source:'Robinhood reference price × token multiplier'};
 }
}
