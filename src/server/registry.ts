import { z } from 'zod';
import { erc20Abi, getAddress, isAddress, parseAbi, parseUnits } from 'viem';
import snapshot from '../../config/assets.snapshot.json';
import type { SupportedAsset } from '../lib/types';
import { AppError } from './errors';
import { config } from './config';
import { rpc } from './rpc';
import { fetchWithRetry } from './external';
const wireAsset=z.object({id:z.string(),tokenSymbol:z.string(),tokenName:z.string(),deployments:z.array(z.object({contractAddress:z.string().refine(isAddress),chainId:z.number()})),currentMultiplier:z.string(),pendingMultiplier:z.string().optional(),status:z.string(),logoUrl:z.string().url(),tokenDecimals:z.number().int().min(0).max(36).optional()});
const assetResponseSchema=z.object({assets:z.array(wireAsset)});
function normalize(raw:z.infer<typeof wireAsset>, chainId:number):SupportedAsset|null {
 const deployment=raw.deployments.find(x=>x.chainId===chainId); if(!deployment)return null;
 return {id:`rh-${raw.tokenSymbol.toLowerCase()}-${chainId}`,symbol:raw.tokenSymbol,displayName:raw.tokenName.split(' • ')[0],referenceTicker:raw.tokenSymbol,issuer:'Robinhood Assets (Jersey) Limited',tokenAddress:getAddress(deployment.contractAddress),chainId,decimals:raw.tokenDecimals??18,assetType:'stock_token',officialDocsUrl:'https://docs.robinhood.com/chain/stock-tokens/',logoUrl:raw.logoUrl,enabled:raw.status==='ASSET_STATUS_ACTIVE',swapEnabled:raw.status==='ASSET_STATUS_ACTIVE'&&!raw.pendingMultiplier,riskStatus:raw.pendingMultiplier?'paused':'supported',legalStructure:'Tokenised debt security. Economic exposure to the underlying; no legal or beneficial ownership rights in the underlying company.',underlyingReference:raw.tokenName.split(' • ')[0],transferRestrictions:'Not registered under US securities laws. US persons and other restricted jurisdictions are ineligible. Issuer terms and network compliance rules apply.',multiplier:raw.currentMultiplier};
}
// Only these reviewed instruments can be admitted, even if the remote registry grows.
const approvedSymbols=new Set(snapshot.assets.map(a=>a.tokenSymbol));
export const catalog:SupportedAsset[]=snapshot.assets.map(a=>normalize(wireAsset.parse(a),4663)!).filter(Boolean);
export async function liveAssets(chainId=config().chainId):Promise<SupportedAsset[]> {
 const response=await fetchWithRetry('https://api.robinhood.com/rhj/assets',{timeoutMs:8000,cache:'no-store'},new AppError('REGISTRY_UNAVAILABLE','The issuer asset registry is unavailable. Please try again.',503));
 if(!response.ok)throw new AppError('REGISTRY_UNAVAILABLE','The issuer asset registry is unavailable. Please try again.',503);
 let body:z.infer<typeof assetResponseSchema>;
 try {
  body=assetResponseSchema.parse(await response.json());
 } catch {
  throw new AppError('REGISTRY_UNAVAILABLE','The issuer asset registry returned invalid data. Please try again.',503);
 }
 return body.assets.filter(a=>approvedSymbols.has(a.tokenSymbol)).map(a=>normalize(a,chainId)).filter((a):a is SupportedAsset=>!!a&&a.enabled);
}
export async function resolveAssets(ids:string[]):Promise<SupportedAsset[]> {
 const assets=await liveAssets(); return Promise.all(ids.map(async id=>{
  const asset=assets.find(a=>a.id===id); if(!asset||!asset.swapEnabled)throw new AppError('UNSUPPORTED_ASSET','This asset is not enabled on the selected network.');
  try {
   const client=rpc(); const [code,decimals]=await Promise.all([client.getCode({address:asset.tokenAddress}),client.readContract({address:asset.tokenAddress,abi:erc20Abi,functionName:'decimals'})]);
   if(!code||code==='0x'||decimals!==asset.decimals)throw new AppError('ASSET_VERIFICATION_FAILED','The asset contract does not match the registry.',503);
   const tokenState=await Promise.all([client.readContract({address:asset.tokenAddress,abi:parseAbi(['function oraclePaused() view returns (bool)']),functionName:'oraclePaused'}),client.readContract({address:asset.tokenAddress,abi:parseAbi(['function uiMultiplier() view returns (uint256)']),functionName:'uiMultiplier'})]);
   if(tokenState[0]||tokenState[1]!==parseUnits(asset.multiplier,18))throw new AppError('ASSET_PAUSED','This token’s corporate-action state is changing. Please try again after the issuer update.',422);
  } catch (error) {
   if(error instanceof AppError)throw error;
   throw new AppError('ASSET_VERIFICATION_FAILED','The asset could not be verified on Robinhood Chain. Please try again.',503);
  }
  return asset;
 }));
}
export const intermediates:SupportedAsset[]=[{id:'paxos-usdg-4663',symbol:'USDG',displayName:'Global Dollar',referenceTicker:'USD',issuer:'Paxos Digital Singapore Pte. Ltd.',tokenAddress:'0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168',chainId:4663,decimals:6,assetType:'stablecoin',officialDocsUrl:'https://docs.robinhood.com/chain/contracts/',logoUrl:'',enabled:true,swapEnabled:true,riskStatus:'supported',legalStructure:'USD stablecoin',underlyingReference:'US dollar',transferRestrictions:'Issuer terms apply.',multiplier:'1'}];
