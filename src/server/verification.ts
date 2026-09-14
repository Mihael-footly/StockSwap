import { decodeEventLog, erc20Abi, type TransactionReceipt } from 'viem';
import type { SwapRecord } from '../lib/types';
import { AppError } from './errors';
export function verifyTransfers(s:SwapRecord,receipt:TransactionReceipt):bigint {
 if(receipt.status!=='success')throw new AppError('SWAP_REVERTED','The swap transaction reverted.');
 let spent=0n,received=0n;
 for(const log of receipt.logs){
  const input=log.address.toLowerCase()===s.quote.sourceAsset.tokenAddress.toLowerCase();
  const output=log.address.toLowerCase()===s.quote.destinationAsset.tokenAddress.toLowerCase();
  if(!input&&!output)continue;
  try{
   const e=decodeEventLog({abi:erc20Abi,eventName:'Transfer',data:log.data,topics:log.topics});
   const from=e.args.from.toLowerCase()===s.wallet.toLowerCase(),to=e.args.to.toLowerCase()===s.wallet.toLowerCase();
   if(input)spent+=(from?e.args.value:0n)-(to?e.args.value:0n);
   if(output)received+=(to?e.args.value:0n)-(from?e.args.value:0n);
  }catch{ /* Other ERC20 logs are not transfer evidence. */ }
 }
 if(spent!==BigInt(s.route.amountInRaw)||received<BigInt(s.route.minimumAmountOutRaw))throw new AppError('OUTPUT_VERIFICATION_FAILED','Confirmed transfers do not satisfy this swap. Review the transaction on the explorer.');
 return received;
}
