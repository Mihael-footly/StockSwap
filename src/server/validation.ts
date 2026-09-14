import { z } from 'zod';
import { isAddress, zeroAddress } from 'viem';
export const addressSchema=z.string().refine(x=>isAddress(x)&&x.toLowerCase()!==zeroAddress,'Invalid wallet address');
export const quoteRequest=z.object({token_in:z.string().min(1).max(80),token_out:z.string().min(1).max(80),amount_in:z.string().regex(/^[1-9][0-9]{0,77}$/).refine(x=>BigInt(x)<2n**256n),wallet:addressSchema,chain_id:z.number().int(),slippage_bps:z.number().int().min(0).max(500).default(50)}).strict();
export const prepareRequest=z.object({quote_id:z.string().uuid(),wallet:addressSchema}).strict();
export const submitRequest=z.object({swap_id:z.string().uuid(),tx_hash:z.string().regex(/^0x[0-9a-fA-F]{64}$/)}).strict();
