import postgres from 'postgres';
import type { QuoteRecord, SwapRecord } from '../lib/types';
import { AppError } from './errors';
// The client is reusable; all authoritative state is in Postgres, never in process memory.
let connection:ReturnType<typeof postgres>|undefined;
export function db(){
 if(!process.env.DATABASE_URL)throw new AppError('STORAGE_UNAVAILABLE','Swap execution is not enabled yet. Persistent storage must be connected.',503);
 return connection??=postgres(process.env.DATABASE_URL,{max:3,idle_timeout:20,connect_timeout:10,prepare:false});
}
export async function saveQuote(q:QuoteRecord){await db()`insert into swap_quotes(id,wallet_address,expires_at,data) values(${q.id},${q.wallet.toLowerCase()},${q.expiresAt},${db().json(q as never)})`;}
export async function getQuote(id:string):Promise<QuoteRecord>{const rows=await db()`select data from swap_quotes where id=${id}`;if(!rows.length)throw new AppError('QUOTE_NOT_FOUND','Quote not found.',404);return rows[0].data as QuoteRecord;}
export async function savePreparedSwap(s:SwapRecord,startBlock:bigint){
 const rows=await db()`insert into swaps(id,public_id,quote_id,wallet_address,chain_id,status,scan_cursor,data) values(${s.id},${s.publicId},${s.quote.id},${s.wallet.toLowerCase()},${s.chainId},${s.status},${startBlock.toString()},${db().json(s as never)}) on conflict (quote_id) do nothing returning data`;
 if(rows.length)return rows[0].data as SwapRecord;
 const existing=await db()`select data from swaps where quote_id=${s.quote.id}`;return existing[0].data as SwapRecord;
}
export async function getSwap(id:string):Promise<SwapRecord>{const rows=await db()`select data from swaps where public_id=${id} or id::text=${id}`;if(!rows.length)throw new AppError('SWAP_NOT_FOUND','Swap not found.',404);return rows[0].data as SwapRecord;}
export async function updateSwap(s:SwapRecord){
 await db()`update swaps set status=${s.status},tx_hash=${s.txHash},data=${db().json(s as never)},updated_at=now() where id=${s.id} and status not in ('COMPLETED','FAILED')`;
}
export async function listSwaps(wallet:string):Promise<SwapRecord[]>{const rows=await db()`select data from swaps where wallet_address=${wallet.toLowerCase()} order by created_at desc limit 100`;return rows.map(r=>r.data as SwapRecord);}
export async function recordEvent(event:string,properties:Record<string,string|number|boolean>){if(!process.env.DATABASE_URL)return;await db()`insert into analytics_events(event,properties) values(${event},${db().json(properties)})`;}
