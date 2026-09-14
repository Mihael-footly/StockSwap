import { erc20Abi, encodeFunctionData, type Address, type Hex } from 'viem';
import { UniswapV2Adapter, UniswapV3Adapter, venueAddress } from '../routing/adapters';
import { SwapRouterEngine } from '../routing/engine';
import { requireFresh } from '../routing/safety';
import { config } from './config';
import { AppError } from './errors';
import { requireChain } from './rpc';
import { intermediates, resolveAssets } from './registry';
import { RobinhoodPriceProvider } from './prices';
import { getQuote, getSwap, savePreparedSwap, saveQuote, updateSwap } from './store';
import { quoteRequest, prepareRequest, submitRequest } from './validation';
import type { QuoteRecord, SwapRecord } from '../lib/types';
export async function createQuote(body:unknown){
 const input=quoteRequest.parse(body),c=config();
 if(input.chain_id!==c.chainId)throw new AppError('WRONG_NETWORK','Switch to the supported network.');
 const [source,destination]=await resolveAssets([input.token_in,input.token_out]);
 const client=await requireChain();
 const prices=new RobinhoodPriceProvider();
 const [a,b]=await Promise.all([prices.getPrice(source),prices.getPrice(destination)]);
 const reference=BigInt(input.amount_in)*BigInt(a.usdE8)*10n**BigInt(destination.decimals)/(BigInt(b.usdE8)*10n**BigInt(source.decimals));
 if(reference===0n)throw new AppError('AMOUNT_TOO_SMALL','The amount is too small.');
 const engine=new SwapRouterEngine([new UniswapV3Adapter(client),new UniswapV2Adapter(client)],intermediates);
 const routes=await engine.findRoutes({sourceAsset:source,destinationAsset:destination,amount:BigInt(input.amount_in),wallet:input.wallet as Address,chainId:c.chainId,slippageTolerance:input.slippage_bps},reference);
 if(!routes.length)throw new AppError('NO_ROUTE','No supported route available. Try another pair or a smaller amount.',422);
 requireFresh(routes[0].quoteExpiresAt,Date.now()+3000);
 const q:QuoteRecord={id:crypto.randomUUID(),wallet:input.wallet as Address,chainId:c.chainId,sourceAsset:source,destinationAsset:destination,routes,slippageBps:input.slippage_bps,createdAt:new Date().toISOString(),expiresAt:routes[0].quoteExpiresAt,prices:{[source.id]:a,[destination.id]:b}};
 if(c.storageReady)await saveQuote(q);
 return {...q,executionEnabled:c.executionEnabled};
}
export async function prepareSwap(body:unknown){
 const input=prepareRequest.parse(body),c=config();
 if(!c.executionEnabled)throw new AppError('EXECUTION_DISABLED','Live swap execution is not enabled for this deployment.',503);
 const q=await getQuote(input.quote_id);requireFresh(q.expiresAt,Date.now()+5000);
 if(q.wallet.toLowerCase()!==input.wallet.toLowerCase()||q.chainId!==c.chainId)throw new AppError('QUOTE_MISMATCH','The quote belongs to a different wallet or network.');
 const [source,destination]=await resolveAssets([q.sourceAsset.id,q.destinationAsset.id]);
 if(source.tokenAddress!==q.sourceAsset.tokenAddress||destination.tokenAddress!==q.destinationAsset.tokenAddress)throw new AppError('REGISTRY_CHANGED','The asset registry changed. Request a fresh quote.',409);
 const pp=new RobinhoodPriceProvider();await Promise.all([pp.getPrice(source),pp.getPrice(destination)]);
 const client=await requireChain(),route=q.routes[0];
 const adapter=route.provider==='Uniswap V3'?new UniswapV3Adapter(client):route.provider==='Uniswap V2'?new UniswapV2Adapter(client):null;
 if(!adapter)throw new AppError('INVALID_PROVIDER','Unsupported provider.');
 const transaction=adapter.buildTransaction({route,wallet:q.wallet,chainId:c.chainId});
 const code=await client.getCode({address:transaction.to});if(!code||code==='0x')throw new AppError('INVALID_ROUTER','Router deployment is unavailable.',503);
 const [balance,allowance]=await Promise.all([client.readContract({address:source.tokenAddress,abi:erc20Abi,functionName:'balanceOf',args:[q.wallet]}),client.readContract({address:source.tokenAddress,abi:erc20Abi,functionName:'allowance',args:[q.wallet,transaction.to]})]);
 if(balance<BigInt(route.amountInRaw))throw new AppError('INSUFFICIENT_BALANCE','Not enough source tokens for this swap.');
 if(allowance<BigInt(route.amountInRaw))return {approval:{to:source.tokenAddress,data:encodeFunctionData({abi:erc20Abi,functionName:'approve',args:[transaction.to,allowance>0n?0n:BigInt(route.amountInRaw)]}),value:'0',chainId:c.chainId,resetRequired:allowance>0n},spender:transaction.to};
 // estimateGas simulates the exact wallet call, including allowance and minimum output.
 const [gas,gasPrice,block]=await Promise.all([client.estimateGas({account:q.wallet,to:transaction.to,data:transaction.data,value:0n}),client.getGasPrice(),client.getBlockNumber()]);
 requireFresh(q.expiresAt,Date.now()+3000);
 route.gasEstimate=gas.toString();route.gasFeeWei=(gas*gasPrice).toString();
 const s:SwapRecord={id:crypto.randomUUID(),publicId:crypto.randomUUID(),wallet:q.wallet,chainId:c.chainId,quote:q,route,transaction,status:'READY_TO_SWAP',txHash:null,actualOutRaw:null,blockNumber:null,gasFeeWei:null,createdAt:new Date().toISOString(),completedAt:null,failureReason:null};
 const saved=await savePreparedSwap(s,block);
 if(saved.status!=='READY_TO_SWAP')throw new AppError('QUOTE_ALREADY_USED','This quote already has a submitted swap.',409);
 return {swap:saved};
}
export async function attachTransaction(body:unknown){
 const input=submitRequest.parse(body),s=await getSwap(input.swap_id);
 if(s.txHash&&s.txHash.toLowerCase()!==input.tx_hash.toLowerCase())throw new AppError('DUPLICATE_EXECUTION','This swap already has a transaction.',409);
 const client=await requireChain();
 const tx=await client.getTransaction({hash:input.tx_hash as Hex});
 if(tx.from.toLowerCase()!==s.wallet.toLowerCase()||tx.to?.toLowerCase()!==s.transaction.to.toLowerCase()||tx.input.toLowerCase()!==s.transaction.data.toLowerCase()||tx.value!==0n)throw new AppError('TRANSACTION_MISMATCH','Transaction does not match the approved swap.');
 if(s.status==='COMPLETED'||s.status==='FAILED')return s;
 s.txHash=input.tx_hash as Hex;s.status='SWAP_SUBMITTED';await updateSwap(s);return s;
}
export {venueAddress};
