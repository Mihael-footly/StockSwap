import type { SwapRecord } from '../lib/types';
import { getSwap, listPendingSwaps, updateScanCursor, updateSwap } from './store';
import { requireChain } from './rpc';
import { verifyTransfers } from './verification';
import { AppError } from './errors';
import { config } from './config';
export async function reconcileSwap(s:SwapRecord):Promise<SwapRecord>{
 if(s.status==='COMPLETED'||s.status==='FAILED'||!s.txHash)return s;
 const client=await requireChain();
 let receipt;
 try{receipt=await client.getTransactionReceipt({hash:s.txHash});}catch(e){if(String(e).includes('could not be found')||String(e).includes('not found'))return s;throw e;}
 const tx=await client.getTransaction({hash:s.txHash});
 if(tx.to?.toLowerCase()!==s.transaction.to.toLowerCase()||tx.from.toLowerCase()!==s.wallet.toLowerCase()||tx.input.toLowerCase()!==s.transaction.data.toLowerCase()||tx.value!==0n)throw new AppError('TRANSACTION_MISMATCH','Transaction mismatch.');
 const [height,block]=await Promise.all([client.getBlockNumber(),client.getBlock({blockNumber:receipt.blockNumber})]);
 if(block.hash!==receipt.blockHash)return s;
 s.status='CONFIRMING';
 if(height-receipt.blockNumber<20n){await updateSwap(s);return s;}
 try{
  s.actualOutRaw=verifyTransfers(s,receipt).toString();s.status='COMPLETED';s.completedAt=new Date(Number(block.timestamp)*1000).toISOString();
 }catch(e){if(!(e instanceof AppError))throw e;s.status='FAILED';s.failureReason=e.message;}
 s.blockNumber=receipt.blockNumber.toString();s.gasFeeWei=(receipt.gasUsed*receipt.effectiveGasPrice).toString();await updateSwap(s);return s;
}
// Discover wallet-submitted transactions even if the browser closes before posting their hash.
export async function reconcilePending(){
 const client=await requireChain();
 const rows=await listPendingSwaps(config().chainId);
 let processed=0;const started=Date.now();
 for(const row of rows){
  if(Date.now()-started>45000)break;
  let s=row.data as SwapRecord;
  try{
   if(!s.txHash){
    const height=await client.getBlockNumber();let cursor=BigInt(row.scan_cursor);const stop=cursor+100n<height?cursor+100n:height;
    for(;cursor<=stop;cursor++){
     if(Date.now()-started>45000)break;
     const block=await client.getBlock({blockNumber:cursor,includeTransactions:true});
     const tx=block.transactions.find(tx=>tx.from.toLowerCase()===s.wallet.toLowerCase()&&tx.to?.toLowerCase()===s.transaction.to.toLowerCase()&&tx.input.toLowerCase()===s.transaction.data.toLowerCase()&&tx.value===0n);
     if(tx){s.txHash=tx.hash;s.status='SWAP_SUBMITTED';await updateSwap(s);break;}
     if(Number(block.timestamp)*1000>Date.parse(s.quote.expiresAt)+120000){s.status='FAILED';s.failureReason='No matching transaction was mined before this quote expired.';await updateSwap(s);break;}
    }
    await updateScanCursor(s.id,cursor);
   }
   await reconcileSwap(s);processed++;
  }catch(e){console.error('reconciliation_error',{swapId:s.id,code:e instanceof AppError?e.code:'RPC_OR_STORAGE_ERROR'});}
 }
 return {processed};
}
export async function refreshedSwap(id:string){return reconcileSwap(await getSwap(id));}
